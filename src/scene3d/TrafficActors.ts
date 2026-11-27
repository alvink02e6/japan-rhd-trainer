import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
} from 'three';
import type { CheckpointType, SignalPhaseKeyframe } from '../domain/types';

export interface TrafficActorsHandle {
  group: Group;
  update(params: {
    checkpointType: CheckpointType;
    intersectionZ: number;
    signalPhase: SignalPhaseKeyframe | null;
    oncomingCarActive: boolean;
    pedestrianActive: boolean;
    actorCycleProgress: number;
  }): void;
}

export function createTrafficActors(): TrafficActorsHandle {
  const group = new Group();

  // 1. Japanese Two-Row Traffic Light Assembly (綠左・黃中・紅右 + 下排左直右綠箭頭)
  const signalRoot = new Group();
  const poleMat = new MeshLambertMaterial({ color: 0x64748b });
  const housingMat = new MeshLambertMaterial({ color: 0x1e293b });

  const pole = new Mesh(new CylinderGeometry(0.08, 0.08, 5.2, 8), poleMat);
  pole.position.set(-4.2, 2.6, 0);
  const arm = new Mesh(new BoxGeometry(3.4, 0.1, 0.1), poleMat);
  arm.position.set(-2.5, 4.7, 0);
  const topBox = new Mesh(new BoxGeometry(1.6, 0.52, 0.25), housingMat);
  topBox.position.set(-1.5, 4.7, 0);
  const arrowBox = new Mesh(new BoxGeometry(1.4, 0.42, 0.22), housingMat);
  arrowBox.position.set(-1.5, 4.18, 0);

  const greenBulbMat = new MeshBasicMaterial({ color: 0x1e293b });
  const yellowBulbMat = new MeshBasicMaterial({ color: 0x1e293b });
  const redBulbMat = new MeshBasicMaterial({ color: 0x1e293b });

  const greenBulb = new Mesh(new BoxGeometry(0.32, 0.32, 0.06), greenBulbMat);
  greenBulb.position.set(-2.0, 4.7, 0.14);
  const yellowBulb = new Mesh(new BoxGeometry(0.32, 0.32, 0.06), yellowBulbMat);
  yellowBulb.position.set(-1.5, 4.7, 0.14);
  const redBulb = new Mesh(new BoxGeometry(0.32, 0.32, 0.06), redBulbMat);
  redBulb.position.set(-1.0, 4.7, 0.14);

  const leftArrowMat = new MeshBasicMaterial({ color: 0x1e293b });
  const straightArrowMat = new MeshBasicMaterial({ color: 0x1e293b });
  const rightArrowMat = new MeshBasicMaterial({ color: 0x1e293b });

  const leftArrowMesh = new Mesh(new BoxGeometry(0.28, 0.18, 0.06), leftArrowMat);
  leftArrowMesh.position.set(-1.92, 4.18, 0.13);
  const straightArrowMesh = new Mesh(new BoxGeometry(0.18, 0.28, 0.06), straightArrowMat);
  straightArrowMesh.position.set(-1.5, 4.18, 0.13);
  const rightArrowMesh = new Mesh(new BoxGeometry(0.28, 0.18, 0.06), rightArrowMat);
  rightArrowMesh.position.set(-1.08, 4.18, 0.13);

  signalRoot.add(
    pole,
    arm,
    topBox,
    arrowBox,
    greenBulb,
    yellowBulb,
    redBulb,
    leftArrowMesh,
    straightArrowMesh,
    rightArrowMesh,
  );
  group.add(signalRoot);

  // 2. Japanese Red Inverted Triangle 止まれ (STOP) Sign Post on left curb
  const tomareGroup = new Group();
  const signPost = new Mesh(new CylinderGeometry(0.05, 0.05, 2.6, 8), poleMat);
  signPost.position.set(-3.9, 1.3, 0);
  const redTriangle = new Mesh(
    new CylinderGeometry(0.55, 0.02, 0.06, 3),
    new MeshBasicMaterial({ color: 0xdc2626 }),
  );
  redTriangle.rotation.x = Math.PI / 2;
  redTriangle.rotation.z = Math.PI;
  redTriangle.position.set(-3.9, 2.55, 0.04);
  tomareGroup.add(signPost, redTriangle);
  group.add(tomareGroup);

  // 3. Oncoming Straight Vehicle (travels in the RIGHT lane from -Z toward +Z!)
  const oncomingCar = new Group();
  const carBody = new Mesh(
    new BoxGeometry(1.75, 1.15, 3.6),
    new MeshLambertMaterial({ color: 0xf97316 }),
  );
  carBody.position.y = 0.65;
  const headlightMat = new MeshBasicMaterial({ color: 0xfef08a });
  const hlLeft = new Mesh(new BoxGeometry(0.32, 0.18, 0.08), headlightMat);
  hlLeft.position.set(-0.55, 0.55, 1.82);
  const hlRight = new Mesh(new BoxGeometry(0.32, 0.18, 0.08), headlightMat);
  hlRight.position.set(0.55, 0.55, 1.82);
  oncomingCar.add(carBody, hlLeft, hlRight);
  group.add(oncomingCar);

  // 4. Crosswalk Pedestrian (walks across crosswalk on left/front side)
  const pedestrian = new Group();
  const pedTorso = new Mesh(
    new CylinderGeometry(0.22, 0.24, 1.1, 8),
    new MeshLambertMaterial({ color: 0x38bdf8 }),
  );
  pedTorso.position.y = 0.85;
  const pedHead = new Mesh(
    new BoxGeometry(0.32, 0.32, 0.32),
    new MeshBasicMaterial({ color: 0xfde68a }),
  );
  pedHead.position.y = 1.6;
  pedestrian.add(pedTorso, pedHead);
  group.add(pedestrian);

  return {
    group,
    update({
      checkpointType,
      intersectionZ,
      signalPhase,
      oncomingCarActive,
      pedestrianActive,
      actorCycleProgress,
    }) {
      const isTomare = checkpointType === 'tomare-stop-line';
      tomareGroup.visible = isTomare;
      tomareGroup.position.z = intersectionZ;

      const showSignal = Boolean(signalPhase && signalPhase.mainLight !== 'off');
      signalRoot.visible = showSignal;
      signalRoot.position.z = intersectionZ - 8;

      if (signalPhase) {
        greenBulbMat.color.setHex(signalPhase.mainLight === 'green' ? 0x10b981 : 0x1e293b);
        yellowBulbMat.color.setHex(signalPhase.mainLight === 'yellow' ? 0xf59e0b : 0x1e293b);
        redBulbMat.color.setHex(signalPhase.mainLight === 'red' ? 0xef4444 : 0x1e293b);

        leftArrowMat.color.setHex(signalPhase.activeArrows.includes('left') ? 0x22c55e : 0x1e293b);
        straightArrowMat.color.setHex(
          signalPhase.activeArrows.includes('straight') ? 0x22c55e : 0x1e293b,
        );
        rightArrowMat.color.setHex(signalPhase.activeArrows.includes('right') ? 0x22c55e : 0x1e293b);
      }

      oncomingCar.visible = oncomingCarActive;
      if (oncomingCarActive) {
        // Moves along x = +1.85 (oncoming lane in Japan!) toward the intersection
        oncomingCar.position.set(1.85, 0, intersectionZ - 26 + actorCycleProgress * 28);
      }

      pedestrian.visible = pedestrianActive;
      if (pedestrianActive) {
        pedestrian.position.set(-4.5 + actorCycleProgress * 3.8, 0, intersectionZ - 3.2);
      }
    },
  };
}
