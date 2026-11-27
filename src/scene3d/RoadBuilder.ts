import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
} from 'three';
import { createTrafficActors, type TrafficActorsHandle } from './TrafficActors';

export interface RoadWorldHandle {
  group: Group;
  actors: TrafficActorsHandle;
  updateWorldProgress(distanceToStopLineMeters: number): void;
}

export function createRoadWorld(): RoadWorldHandle {
  const group = new Group();

  // Ground plane
  const ground = new Mesh(
    new PlaneGeometry(90, 180),
    new MeshLambertMaterial({ color: 0x1e293b }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.02, -45);
  group.add(ground);

  // Main North-South two-lane road (x = -3.6..0 is LEFT inbound lane; x = 0..+3.6 is RIGHT oncoming lane)
  const roadMat = new MeshLambertMaterial({ color: 0x334155 });
  const mainRoad = new Mesh(new PlaneGeometry(7.4, 160), roadMat);
  mainRoad.rotation.x = -Math.PI / 2;
  mainRoad.position.set(0, 0, -45);
  group.add(mainRoad);

  // Cross-street at z = 0 (relative to moving world group)
  const crossRoad = new Mesh(new PlaneGeometry(64, 8.4), roadMat);
  crossRoad.rotation.x = -Math.PI / 2;
  crossRoad.position.set(0, 0.005, -4.2);
  group.add(crossRoad);

  // White Stop Line at z = 0 on left lane ONLY (x = -3.5 to -0.15) — iconic Japanese layout!
  const whiteLineMat = new MeshBasicMaterial({ color: 0xf8fafc });
  const stopLine = new Mesh(new PlaneGeometry(3.3, 0.45), whiteLineMat);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(-1.8, 0.015, 0);
  group.add(stopLine);

  // Centerline divider (orange/white dashed/solid)
  const centerLineMat = new MeshBasicMaterial({ color: 0xf59e0b });
  const southCenter = new Mesh(new PlaneGeometry(0.16, 65), centerLineMat);
  southCenter.rotation.x = -Math.PI / 2;
  southCenter.position.set(0, 0.014, 33);
  const northCenter = new Mesh(new PlaneGeometry(0.16, 65), centerLineMat);
  northCenter.rotation.x = -Math.PI / 2;
  northCenter.position.set(0, 0.014, -42);
  group.add(southCenter, northCenter);

  // Left-lane cyan guidance markers (visual cue keeping learner centered in left lane x = -1.8)
  const guideGeom = new PlaneGeometry(0.55, 1.8);
  const guideMat = new MeshBasicMaterial({ color: 0x38bdf8 });
  const guideInstanced = new InstancedMesh(guideGeom, guideMat, 14);
  const dummyMat = new Matrix4();
  const rotX = new Matrix4().makeRotationX(-Math.PI / 2);
  for (let i = 0; i < 14; i++) {
    const zPos = 52 - i * 8;
    const trans = new Matrix4().makeTranslation(-1.85, 0.016, zPos);
    dummyMat.multiplyMatrices(trans, rotX);
    guideInstanced.setMatrixAt(i, dummyMat);
  }
  guideInstanced.instanceMatrix.needsUpdate = true;
  group.add(guideInstanced);

  // Crosswalk zebra stripes (InstancedMesh -> 1 draw call!)
  const stripeGeom = new PlaneGeometry(0.45, 2.4);
  const crosswalk = new InstancedMesh(stripeGeom, whiteLineMat, 8);
  for (let i = 0; i < 8; i++) {
    const xPos = -3.1 + i * 0.9;
    const trans = new Matrix4().makeTranslation(xPos, 0.017, -1.5);
    dummyMat.multiplyMatrices(trans, rotX);
    crosswalk.setMatrixAt(i, dummyMat);
  }
  crosswalk.instanceMatrix.needsUpdate = true;
  group.add(crosswalk);

  // Low-poly Japanese urban building blocks on both sides (InstancedMesh -> 1 draw call!)
  const bldgGeom = new BoxGeometry(5.5, 6.5, 6.5);
  const bldgMat = new MeshLambertMaterial({ color: 0xffffff });
  const buildings = new InstancedMesh(bldgGeom, bldgMat, 16);
  const palette = [0x475569, 0x64748b, 0x334155, 0x1e3a8a];
  for (let i = 0; i < 16; i++) {
    const isLeft = i % 2 === 0;
    const row = Math.floor(i / 2);
    const zPos = 44 - row * 13;
    // Leave gap around cross-street z = -10..+4
    const adjustedZ = zPos <= 4 && zPos >= -12 ? zPos - 18 : zPos;
    const xPos = isLeft ? -8.2 : 8.2;
    const heightScale = 0.7 + ((i * 37) % 10) * 0.09;
    const scaleM = new Matrix4().makeScale(1, heightScale, 1);
    const transM = new Matrix4().makeTranslation(xPos, (6.5 * heightScale) / 2, adjustedZ);
    dummyMat.multiplyMatrices(transM, scaleM);
    buildings.setMatrixAt(i, dummyMat);
    buildings.setColorAt(i, new Color(palette[i % palette.length]));
  }
  buildings.instanceMatrix.needsUpdate = true;
  if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
  group.add(buildings);

  const actors = createTrafficActors();
  group.add(actors.group);

  return {
    group,
    actors,
    updateWorldProgress(distanceToStopLineMeters: number) {
      // Player camera sits near z = 0; stop line approaches z = 0 as distance shrinks to 0!
      group.position.z = distanceToStopLineMeters;
      actors.group.position.z = 0;
    },
  };
}
