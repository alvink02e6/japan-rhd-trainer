import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Material,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import type { CheckpointType, RenderMode, SignalPhaseKeyframe } from '../domain/types';
import { createRightSeatCockpit } from './RightSeatCockpit';
import { createRoadWorld } from './RoadBuilder';

export interface DrillVisualState {
  distanceToStopLineMeters: number;
  lateralOffsetMeters: number;
  wiperActive: boolean;
  signalArmed: 'left' | 'right' | null;
  checkpointType: CheckpointType;
  signalPhase: SignalPhaseKeyframe | null;
  oncomingCarActive: boolean;
  pedestrianActive: boolean;
  actorCycleProgress: number;
  elapsedSec: number;
}

export interface DrillEngineCallbacks {
  onRenderModeResolved: (mode: RenderMode) => void;
  onDegradeTo2D: (reason: 'webgl-unavailable' | 'context-lost' | 'low-fps') => void;
}

export interface DrillEngineController {
  renderFrame(state: DrillVisualState): void;
  resize(): void;
  dispose(): void;
}

export function createDrillEngine(
  container: HTMLElement,
  callbacks: DrillEngineCallbacks,
): DrillEngineController | null {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';

  let glContext: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  let resolvedMode: RenderMode = 'webgl2';

  try {
    glContext = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    }) as WebGL2RenderingContext | null;

    if (!glContext) {
      glContext = (canvas.getContext('webgl', { alpha: false, antialias: false }) ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      resolvedMode = 'webgl1';
    }
  } catch {
    glContext = null;
  }

  if (!glContext) {
    callbacks.onRenderModeResolved('fallback-2d');
    callbacks.onDegradeTo2D('webgl-unavailable');
    return null;
  }

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      context: glContext,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });
  } catch {
    callbacks.onRenderModeResolved('fallback-2d');
    callbacks.onDegradeTo2D('webgl-unavailable');
    return null;
  }

  callbacks.onRenderModeResolved(resolvedMode);

  // Strict pixelRatio cap <= 2 per Constitution Principle II & R2
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  renderer.setPixelRatio(Math.min(dpr, 2));

  const width = Math.max(280, container.clientWidth || 360);
  const height = Math.max(220, container.clientHeight || 320);
  renderer.setSize(width, height, false);

  container.innerHTML = '';
  container.appendChild(canvas);

  const scene = new Scene();
  scene.background = new Color(0x0b1220);

  const camera = new PerspectiveCamera(62, width / height, 0.1, 160);
  // Positioned in the LEFT lane (x = -1.85), sitting in the RIGHT-hand driver seat (+0.32 offset -> x = -1.53)
  camera.position.set(-1.53, 1.32, 2.2);

  const ambient = new AmbientLight(0xffffff, 0.85);
  const sun = new DirectionalLight(0xf8fafc, 0.9);
  sun.position.set(12, 24, 14);
  scene.add(ambient, sun);

  const world = createRoadWorld();
  scene.add(world.group);

  const cockpit = createRightSeatCockpit();
  camera.add(cockpit.group);
  scene.add(camera);

  let disposed = false;
  let frameCount = 0;
  let fpsWindowStartMs = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const onContextLost = (e: Event) => {
    e.preventDefault();
    if (!disposed) {
      callbacks.onRenderModeResolved('fallback-2d');
      callbacks.onDegradeTo2D('context-lost');
    }
  };
  canvas.addEventListener('webglcontextlost', onContextLost, false);

  const resize = () => {
    if (disposed) return;
    const w = Math.max(280, container.clientWidth || 360);
    const h = Math.max(220, container.clientHeight || 320);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  return {
    renderFrame(state: DrillVisualState) {
      if (disposed) return;

      // Update camera lateral position around left-lane center (-1.85 + right-seat +0.32)
      camera.position.x = -1.53 + state.lateralOffsetMeters;

      world.updateWorldProgress(-state.distanceToStopLineMeters);
      world.actors.update({
        checkpointType: state.checkpointType,
        intersectionZ: 0,
        signalPhase: state.signalPhase,
        oncomingCarActive: state.oncomingCarActive,
        pedestrianActive: state.pedestrianActive,
        actorCycleProgress: state.actorCycleProgress,
      });

      cockpit.update({
        steerVisualRad: -state.lateralOffsetMeters * 0.45,
        wiperActive: state.wiperActive,
        signalArmed: state.signalArmed,
        elapsedSec: state.elapsedSec,
      });

      renderer.render(scene, camera);

      // Rolling 2-second low-FPS monitor (< 15 FPS triggers graceful 2D fallback)
      frameCount += 1;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsedWindow = now - fpsWindowStartMs;
      if (elapsedWindow >= 2000) {
        const fps = (frameCount * 1000) / elapsedWindow;
        frameCount = 0;
        fpsWindowStartMs = now;
        if (fps < 15 && state.elapsedSec > 1.5) {
          callbacks.onRenderModeResolved('fallback-2d');
          callbacks.onDegradeTo2D('low-fps');
        }
      }
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onContextLost);

      scene.traverse((obj) => {
        if (obj instanceof Mesh) {
          const geom = obj.geometry as BufferGeometry | undefined;
          geom?.dispose();
          const mat = obj.material as Material | Material[] | undefined;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat?.dispose();
          }
        }
      });

      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    },
  };
}
