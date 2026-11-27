import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  TorusGeometry,
} from 'three';

export interface RightSeatCockpitHandle {
  group: Group;
  update(params: {
    steerVisualRad: number;
    wiperActive: boolean;
    signalArmed: 'left' | 'right' | null;
    elapsedSec: number;
  }): void;
}

export function createRightSeatCockpit(): RightSeatCockpitHandle {
  const group = new Group();

  // Dashboard base (First-person view from RIGHT seat: x > 0 is driver center, x < 0 extends left)
  const dashMat = new MeshLambertMaterial({ color: 0x1e293b });
  const dash = new Mesh(new BoxGeometry(2.2, 0.42, 0.65), dashMat);
  dash.position.set(-0.32, -0.58, -0.95);
  group.add(dash);

  // Hood extending forward-left to give clear spatial reference of car's left boundary (FR-005)
  const hoodMat = new MeshLambertMaterial({ color: 0x0284c7 });
  const hood = new Mesh(new BoxGeometry(1.95, 0.08, 1.35), hoodMat);
  hood.position.set(-0.32, -0.42, -1.75);
  group.add(hood);

  // Bright yellow Left-Hood Spatial Guide Corner Marker (helps left-lane curb alignment)
  const leftGuideMat = new MeshBasicMaterial({ color: 0xfacc15 });
  const leftGuidePole = new Mesh(new CylinderGeometry(0.025, 0.025, 0.24, 8), leftGuideMat);
  leftGuidePole.position.set(-1.24, -0.28, -2.35);
  group.add(leftGuidePole);

  // Right-side A-pillar & Left-side A-pillar framing windshield
  const pillarMat = new MeshLambertMaterial({ color: 0x0f172a });
  const rightPillar = new Mesh(new BoxGeometry(0.09, 1.1, 0.12), pillarMat);
  rightPillar.position.set(0.68, 0.05, -0.88);
  rightPillar.rotation.z = 0.16;
  group.add(rightPillar);

  const leftPillar = new Mesh(new BoxGeometry(0.09, 1.1, 0.12), pillarMat);
  leftPillar.position.set(-1.32, 0.05, -0.95);
  leftPillar.rotation.z = -0.18;
  group.add(leftPillar);

  // Steering wheel positioned directly in front of RIGHT-hand driver seat (x = +0.22)
  const wheelGroup = new Group();
  wheelGroup.position.set(0.22, -0.34, -0.68);
  const wheelMat = new MeshLambertMaterial({ color: 0x0f172a });
  const rim = new Mesh(new TorusGeometry(0.19, 0.024, 8, 20), wheelMat);
  const spoke = new Mesh(new BoxGeometry(0.34, 0.03, 0.02), wheelMat);
  wheelGroup.add(rim, spoke);
  group.add(wheelGroup);

  // Dashboard Turn-Signal Indicator LEDs
  const ledLeftMat = new MeshBasicMaterial({ color: 0x1e293b });
  const ledRightMat = new MeshBasicMaterial({ color: 0x1e293b });
  const ledLeft = new Mesh(new BoxGeometry(0.05, 0.03, 0.01), ledLeftMat);
  ledLeft.position.set(0.13, -0.31, -0.78);
  const ledRight = new Mesh(new BoxGeometry(0.05, 0.03, 0.01), ledRightMat);
  ledRight.position.set(0.31, -0.31, -0.78);
  group.add(ledLeft, ledRight);

  // 3D Windshield Wiper Blades (sweep when left stalk trap is triggered!)
  const wiperMat = new MeshBasicMaterial({ color: 0x94a3b8 });
  const wiperPivotLeft = new Group();
  wiperPivotLeft.position.set(-0.55, -0.36, -1.02);
  const blade1 = new Mesh(new BoxGeometry(0.02, 0.48, 0.015), wiperMat);
  blade1.position.set(0, 0.24, 0);
  wiperPivotLeft.add(blade1);
  wiperPivotLeft.rotation.z = 1.25;

  const wiperPivotRight = new Group();
  wiperPivotRight.position.set(0.12, -0.36, -1.02);
  const blade2 = new Mesh(new BoxGeometry(0.02, 0.48, 0.015), wiperMat);
  blade2.position.set(0, 0.24, 0);
  wiperPivotRight.add(blade2);
  wiperPivotRight.rotation.z = 1.25;

  group.add(wiperPivotLeft, wiperPivotRight);

  return {
    group,
    update({ steerVisualRad, wiperActive, signalArmed, elapsedSec }) {
      wheelGroup.rotation.z = steerVisualRad;

      const blinkOn = Math.floor(elapsedSec * 3.2) % 2 === 0;
      ledLeftMat.color.setHex(signalArmed === 'left' && blinkOn ? 0x22c55e : 0x1e293b);
      ledRightMat.color.setHex(signalArmed === 'right' && blinkOn ? 0x22c55e : 0x1e293b);

      if (wiperActive) {
        const angle = 0.35 + Math.abs(Math.sin(elapsedSec * 9.5)) * 1.15;
        wiperPivotLeft.rotation.z = angle;
        wiperPivotRight.rotation.z = angle;
      } else {
        wiperPivotLeft.rotation.z = 1.32;
        wiperPivotRight.rotation.z = 1.32;
      }
    },
  };
}
