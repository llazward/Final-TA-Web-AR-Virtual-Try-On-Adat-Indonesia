import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * Komponen utama AR Try-On yang menangani:
 * - Pemuatan & kloning model 3D (BAB 4.2.4)
 * - Algoritma Rotasi Bone 3D Penuh berbasis Quaternion (BAB 4.3)
 * - Auto-Scaling model berdasarkan lebar bahu (BAB 4.4.6)
 * - Rotasi keseluruhan model / kemiringan badan (BAB 4.3.9)
 */

// ═══════════════════════════════════════════════════════════════
// BONE MAP: Pemetaan nama tulang → index landmark MediaPipe Pose
// Referensi: BAB 4.1 — Tabel 4.1 Landmark MediaPipe Pose
// ═══════════════════════════════════════════════════════════════
const BONE_MAP = {
  // Root & Torso — midpoint (tetap di rest pose, tidak dirotasi)
  "hip":          { from: 24, to: 23, type: "midpoint" },
  "chest":        { from: 12, to: 11, type: "midpoint" },
  "neck":         { from: 11, to: 12, type: "midpoint" },
  "head":         { from: 0,  to: 0,  type: "midpoint" },
  // Lengan — direction (dirotasi mengikuti pose user)
  "upperarmL":    { from: 11, to: 13, type: "direction" },
  "lowerarmL":    { from: 13, to: 15, type: "direction" },
  "handL":        { from: 15, to: 17, type: "direction" },
  "upperarmR":    { from: 12, to: 14, type: "direction" },
  "lowerarmR":    { from: 14, to: 16, type: "direction" },
  "handR":        { from: 16, to: 18, type: "direction" },
  // Kaki — direction (rotasi minimal untuk garmen bawah)
  "upperlegL":    { from: 23, to: 25, type: "direction" },
  "lowerlegL":    { from: 25, to: 27, type: "direction" },
  "footL":        { from: 27, to: 31, type: "direction" },
  "upperlegR":    { from: 24, to: 26, type: "direction" },
  "lowerlegR":    { from: 26, to: 28, type: "direction" },
  "footR":        { from: 28, to: 32, type: "direction" },
};

// Urutan proses: parent bone dulu, kemudian child bone
const BONE_PROCESS_ORDER = [
  "hip", "chest", "neck", "head",
  "upperarmL", "upperarmR",
  "lowerarmL", "lowerarmR",
  "handL", "handR",
  "upperlegL", "upperlegR",
  "lowerlegL", "lowerlegR",
  "footL", "footR",
];

// Alias nama tulang untuk flexible bone name matching dari Blender
const BONE_NAME_ALIASES = {
  "hip":       ["hip", "Hip", "pelvis", "Pelvis", "hips", "Hips"],
  "chest":     ["chest", "Chest", "spine1", "Spine1", "torso", "Torso", "dada"],
  "neck":      ["neck", "Neck", "leher"],
  "head":      ["head", "Head", "kepala"],
  "upperarmL": ["upperarmL", "upper_arm.L", "UpperArm.L", "upperarm.L", "Upper_Arm_L"],
  "lowerarmL": ["lowerarmL", "lower_arm.L", "LowerArm.L", "lowerarm.L", "Lower_Arm_L", "forearmL"],
  "handL":     ["handL", "hand.L", "Hand.L", "Hand_L"],
  "upperarmR": ["upperarmR", "upper_arm.R", "UpperArm.R", "upperarm.R", "Upper_Arm_R"],
  "lowerarmR": ["lowerarmR", "lower_arm.R", "LowerArm.R", "lowerarm.R", "Lower_Arm_R", "forearmR"],
  "handR":     ["handR", "hand.R", "Hand.R", "Hand_R"],
  "upperlegL": ["upperlegL", "upper_leg.L", "UpperLeg.L", "upperleg.L", "thighL", "Thigh.L"],
  "lowerlegL": ["lowerlegL", "lower_leg.L", "LowerLeg.L", "lowerleg.L", "shinL", "Shin.L"],
  "footL":     ["footL", "foot.L", "Foot.L", "Foot_L"],
  "upperlegR": ["upperlegR", "upper_leg.R", "UpperLeg.R", "upperleg.R", "thighR", "Thigh.R"],
  "lowerlegR": ["lowerlegR", "lower_leg.R", "LowerLeg.R", "lowerleg.R", "shinR", "Shin.R"],
  "footR":     ["footR", "foot.R", "Foot.R", "Foot_R"],
};

// ═══════════════════════════════════════════════════════════════
// BAB 4.3.6 — Tabel 4.3: Batas Sudut Rotasi per Tulang (radian)
// Angle Clamping untuk membatasi rotasi anatomis
// ═══════════════════════════════════════════════════════════════
const MAX_BONE_ANGLE = {
  "upperarmL": 2.0,   // ~115°
  "lowerarmL": 2.2,   // ~126°
  "handL":     1.2,   // ~69°
  "upperarmR": 2.0,
  "lowerarmR": 2.2,
  "handR":     1.2,
  "upperlegL": 0.6,   // ~34°
  "lowerlegL": 0.5,   // ~29°
  "footL":     0.3,   // ~17°
  "upperlegR": 0.6,
  "lowerlegR": 0.5,
  "footR":     0.3,
};

const MIN_VISIBILITY = 0.5;

// BAB 4.3.2 — Z-depth scaling: MediaPipe Z di-scale ke 40% untuk stabilitas
const Z_DEPTH_SCALE = 0.4;

const IS_MOBILE = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ═══════════════════════════════════════════════════════════════
// BAB 4.3.1 — Persamaan 4.1: Smoothing Posisi Landmark
// Kelas-kelas smoother untuk stabilisasi posisi dan rotasi
// ═══════════════════════════════════════════════════════════════

/** Smoother 1D — untuk posisi X/Y dan skala */
class Smoother {
  constructor(factor = 0.5) { this.v = null; this.f = factor; }
  update(target) {
    if (this.v === null) this.v = target;
    else this.v += (target - this.v) * this.f;
    return this.v;
  }
}

/** BAB 4.3.8 — Quaternion Smoother menggunakan SLERP (Persamaan 4.10) */
class QuatSmoother {
  constructor(factor = 0.45) { this.q = null; this.f = factor; }
  update(target) {
    if (this.q === null) {
      this.q = target.clone();
    } else {
      this.q.slerp(target, this.f);
    }
    return this.q.clone();
  }
}

/** Smoother 3D — XY cepat, Z lambat (BAB 4.3.1 — Tabel 4.2) */
class Vec3Smoother {
  constructor(xyFactor = 0.85, zFactor = 0.35) {
    this.v = null;
    this.xyF = xyFactor;
    this.zF = zFactor;
  }
  update(x, y, z) {
    if (this.v === null) {
      this.v = { x, y, z };
    } else {
      this.v.x += (x - this.v.x) * this.xyF;
      this.v.y += (y - this.v.y) * this.xyF;
      this.v.z += (z - this.v.z) * this.zF;
    }
    return this.v;
  }
}

/** Mencari bone dari model berdasarkan alias nama (BAB 4.2.4) */
function findBoneByAlias(allBones, mapKey) {
  const aliases = BONE_NAME_ALIASES[mapKey] || [mapKey];
  for (const alias of aliases) {
    const found = allBones.find(b => b.name === alias);
    if (found) return found;
  }
  const lowerKey = mapKey.toLowerCase();
  return allBones.find(b => b.name.toLowerCase() === lowerKey) || null;
}

function normalizeAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

// ═══════════════════════════════════════════════════════════════
// KOMPONEN UTAMA: AdvancedClothingModel
// ═══════════════════════════════════════════════════════════════
export default function AdvancedClothingModel({ pose, clothingUrl, arConfig = {}, sizeOverride = null }) {
  const groupRef = useRef();
  const { camera } = useThree();
  const initialized = useRef(false);
  const frameCount = useRef(0);

  const { scene } = useGLTF(clothingUrl);

  // ═══════════════════════════════════════════════════════════
  // BAB 4.2.4 — Pemuatan dan Kloning Model 3D
  // SkeletonUtils.clone() menjaga hubungan bone↔mesh
  // ═══════════════════════════════════════════════════════════
  const { clonedScene, bones, skinnedMeshes, isRigged, modelCenter, modelSize, modelShoulderWidth } = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);

    const foundBones = {};
    const skins = [];
    const allBones = [];
    let hasRig = false;

    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.frustumCulled = false;
      }
      if (child.isSkinnedMesh) {
        skins.push(child);
        child.frustumCulled = false;
      }
      if (child.isBone) {
        allBones.push(child);
      }
    });

    for (const mapKey of Object.keys(BONE_MAP)) {
      const bone = findBoneByAlias(allBones, mapKey);
      if (bone) {
        foundBones[mapKey] = bone;
        hasRig = true;
      }
    }

    // Hitung lebar pundak model untuk auto-scaling (BAB 4.4.6)
    clone.updateMatrixWorld(true);
    let shoulderW = 0;

    const leftArm = foundBones["upperarmL"];
    const rightArm = foundBones["upperarmR"];
    if (leftArm && rightArm) {
      const lp = new THREE.Vector3();
      const rp = new THREE.Vector3();
      leftArm.getWorldPosition(lp);
      rightArm.getWorldPosition(rp);
      shoulderW = lp.distanceTo(rp);
    }

    if (shoulderW < 0.01) {
      const fallbackBox = new THREE.Box3().setFromObject(clone);
      const fallbackSize = fallbackBox.getSize(new THREE.Vector3());
      shoulderW = fallbackSize.x * 0.45;
      if (shoulderW < 0.01) shoulderW = 0.5;
    }

    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    return {
      clonedScene: clone,
      bones: foundBones,
      skinnedMeshes: skins,
      isRigged: hasRig,
      modelCenter: center,
      modelSize: size,
      modelShoulderWidth: shoulderW,
    };
  }, [scene]);

  // ═══════════════════════════════════════════════════════════
  // REST POSE — Menyimpan posisi awal model saat pertama dimuat
  // Digunakan sebagai referensi untuk perhitungan delta quaternion
  // ═══════════════════════════════════════════════════════════
  const restPoseData = useRef({});

  useEffect(() => {
    if (!isRigged || initialized.current) return;

    clonedScene.updateMatrixWorld(true);

    for (const [mapKey, bone] of Object.entries(bones)) {
      const restWorldQuat = new THREE.Quaternion();
      bone.getWorldQuaternion(restWorldQuat);

      let restDir;
      const childBone = bone.children.find(c => c.isBone);
      if (childBone) {
        const headPos = new THREE.Vector3();
        const tailPos = new THREE.Vector3();
        bone.getWorldPosition(headPos);
        childBone.getWorldPosition(tailPos);
        restDir = new THREE.Vector3().subVectors(tailPos, headPos);
        if (restDir.lengthSq() < 0.0001) {
          restDir.set(0, 1, 0).applyQuaternion(restWorldQuat);
        }
        restDir.normalize();
      } else {
        restDir = new THREE.Vector3(0, 1, 0)
          .applyQuaternion(restWorldQuat)
          .normalize();
      }

      const restAngle2D = Math.atan2(restDir.y, restDir.x);

      restPoseData.current[mapKey] = {
        restLocalQuat: bone.quaternion.clone(),
        restWorldQuat: restWorldQuat.clone(),
        restDirection: restDir.clone(),
        restAngle2D: restAngle2D,
      };
    }

    initialized.current = true;
  }, [isRigged, bones, clonedScene]);

  // ═══════════════════════════════════════════════════════════
  // SMOOTHER INSTANCES (BAB 4.3.1 — Tabel 4.2, Tabel 4.4)
  // ═══════════════════════════════════════════════════════════
  const sm = useRef({
    px: new Smoother(IS_MOBILE ? 0.18 : 0.5),
    py: new Smoother(IS_MOBILE ? 0.18 : 0.5),
    sc: new Smoother(IS_MOBILE ? 0.08 : 0.3),
    rz: new Smoother(IS_MOBILE ? 0.12 : 0.35),
    ry: new Smoother(IS_MOBILE ? 0.12 : 0.35),
  });

  const boneSmoothers = useRef({});
  function getBoneSmoother(name) {
    if (!boneSmoothers.current[name]) {
      boneSmoothers.current[name] = new QuatSmoother(IS_MOBILE ? 0.15 : 0.45);
    }
    return boneSmoothers.current[name];
  }

  const lmSmoothers = useRef({});
  function getSmoothedLandmark(lm, index) {
    if (!lmSmoothers.current[index]) {
      lmSmoothers.current[index] = new Vec3Smoother(
        IS_MOBILE ? 0.35 : 0.85,
        IS_MOBILE ? 0.12 : 0.35
      );
    }
    return lmSmoothers.current[index].update(lm.x, lm.y, lm.z || 0);
  }

  // Objek quaternion/vector reusable untuk efisiensi memori
  const _deltaQuat = useMemo(() => new THREE.Quaternion(), []);
  const _targetWorldQuat = useMemo(() => new THREE.Quaternion(), []);
  const _parentWorldQuat = useMemo(() => new THREE.Quaternion(), []);
  const _identityQuat = useMemo(() => new THREE.Quaternion(), []);
  const _restDirVec = useMemo(() => new THREE.Vector3(), []);
  const _liveDirVec = useMemo(() => new THREE.Vector3(), []);

  // ═══════════════════════════════════════════════════════════
  // FRAME LOOP — Dijalankan setiap frame (~60fps)
  // Pipeline: Posisi → Skala → Rotasi Group → Rotasi Bone
  // ═══════════════════════════════════════════════════════════
  useFrame(() => {
    if (!pose?.landmarks || !groupRef.current) return;
    if (!initialized.current && isRigged) return;

    const lm = pose.landmarks;
    const lS = lm[11]; // Bahu kiri (landmark 11)
    const rS = lm[12]; // Bahu kanan (landmark 12)
    const lH = lm[23]; // Pinggul kiri (landmark 23)
    const rH = lm[24]; // Pinggul kanan (landmark 24)

    if (!lS || !rS) return;
    if ((lS.visibility || 0) < 0.4 || (rS.visibility || 0) < 0.4) return;

    // Dimensi kamera untuk konversi koordinat
    const vFov = (camera.fov * Math.PI) / 180;
    const camDist = camera.position.z;
    const visH = 2 * Math.tan(vFov / 2) * camDist;
    const visW = visH * (camera.aspect || 1);

    // ─── POSISI MODEL ─── (BAB 4.5.7)
    const anchor = arConfig.anchorPoint || "shoulder";
    let ax, ay;

    if (anchor === "hip" && lH && rH &&
        (lH.visibility || 0) > 0.4 && (rH.visibility || 0) > 0.4) {
      ax = ((lS.x + rS.x) / 2 + (lH.x + rH.x) / 2) / 2;
      ay = ((lS.y + rS.y) / 2 + (lH.y + rH.y) / 2) / 2;
    } else {
      ax = (lS.x + rS.x) / 2;
      ay = (lS.y + rS.y) / 2;
    }

    const worldX = (ax - 0.5) * visW;
    const worldY = (0.5 - ay) * visH;

    const offX = arConfig.positionOffset?.x || 0;
    const offY = arConfig.positionOffset?.y || 0;
    const offZ = arConfig.positionOffset?.z || 0;

    const clampedX = Math.max(-visW * 0.5, Math.min(visW * 0.5, worldX + offX));
    const clampedY = Math.max(-visH * 0.5, Math.min(visH * 0.5, worldY + offY));

    const finalX = sm.current.px.update(clampedX);
    const finalY = sm.current.py.update(clampedY);
    groupRef.current.position.set(finalX, finalY, offZ);

    // ─── SKALA MODEL ─── (BAB 4.4.6 — Persamaan 4.20: Auto Scaling)
    const dx = lS.x - rS.x;
    const dy = lS.y - rS.y;
    const shoulderDist = Math.sqrt(dx * dx + dy * dy);
    const shoulderWorld = shoulderDist * visW;
    const baseScale = arConfig.baseScale || 1.0;

    let rawScale;

    if (sizeOverride && arConfig.sizeScaleMap?.[sizeOverride]) {
      // Mode manual: skala berdasarkan ukuran yang dipilih user (BAB 4.5.6)
      const sizeMultiplier = arConfig.sizeScaleMap[sizeOverride];
      rawScale = (shoulderWorld / modelShoulderWidth) * baseScale * sizeMultiplier;
    } else {
      // Mode auto: skala berdasarkan lebar pundak terdeteksi
      rawScale = (shoulderWorld / modelShoulderWidth) * baseScale;
    }

    rawScale = Math.max(0.2, Math.min(4.0, rawScale));

    const finalScale = sm.current.sc.update(rawScale);
    groupRef.current.scale.set(finalScale, finalScale, finalScale);

    // ─── ROTASI GROUP ─── (BAB 4.3.9 — Persamaan 4.11 & 4.12)
    const rotOffX = arConfig.rotationOffset?.x || 0;
    const rotOffY = arConfig.rotationOffset?.y || 0;
    const rotOffZ = arConfig.rotationOffset?.z || 0;

    // Persamaan 4.11: Kemiringan badan (roll) — sensitivitas 60%
    const angleZ = Math.atan2(dy, dx) * 0.6;
    const dz = (lS.z || 0) - (rS.z || 0);
    // Persamaan 4.12: Arah hadap (yaw) — sensitivitas 80%
    const angleY = Math.atan2(dz, Math.abs(dx) + 0.001) * 0.8;

    const sRZ = sm.current.rz.update(angleZ);
    const sRY = sm.current.ry.update(angleY);
    groupRef.current.rotation.set(rotOffX, sRY + rotOffY, sRZ + rotOffZ);

    // ═══════════════════════════════════════════════════════════
    // BAB 4.3 — ALGORITMA ROTASI BONE 3D PENUH (8 LANGKAH)
    // Pipeline per bone: A→B→C→D→E→F→G→H
    // Referensi: Gambar 4.16, Activity Diagram 3 (Gambar 3.15)
    // ═══════════════════════════════════════════════════════════
    if (isRigged && !arConfig.disableBoneRotation) {
      groupRef.current.updateMatrixWorld(true);

      for (const boneName of BONE_PROCESS_ORDER) {
        const bone = bones[boneName];
        const mapping = BONE_MAP[boneName];
        const rest = restPoseData.current[boneName];

        if (!bone || !mapping || !rest) continue;

        // Midpoint bones tetap di rest pose (tidak dirotasi)
        if (mapping.type === "midpoint") {
          bone.quaternion.copy(rest.restLocalQuat);
          bone.updateMatrixWorld(true);
          continue;
        }

        const fromLm = lm[mapping.from];
        const toLm = lm[mapping.to];
        if (!fromLm || !toLm) continue;

        // Visibility check — kembali ke rest pose jika landmark tidak reliable
        if ((fromLm.visibility || 0) < MIN_VISIBILITY ||
            (toLm.visibility || 0) < MIN_VISIBILITY) {
          const smoothed = getBoneSmoother(boneName).update(rest.restLocalQuat);
          bone.quaternion.copy(smoothed);
          bone.updateMatrixWorld(true);
          continue;
        }

        // LANGKAH A (BAB 4.3.1): Smoothing posisi landmark 3D
        const sFrom = getSmoothedLandmark(fromLm, mapping.from);
        const sTo = getSmoothedLandmark(toLm, mapping.to);

        // LANGKAH B (BAB 4.3.2 — Persamaan 4.2): Konversi koordinat MediaPipe → Three.js
        const fx = (sFrom.x - 0.5) * 2;
        const fy = -(sFrom.y - 0.5) * 2;
        const fz = sFrom.z * Z_DEPTH_SCALE;
        const tx = (sTo.x - 0.5) * 2;
        const ty = -(sTo.y - 0.5) * 2;
        const tz = sTo.z * Z_DEPTH_SCALE;

        // LANGKAH C (BAB 4.3.3 — Persamaan 4.3): Hitung vektor arah 3D live
        _liveDirVec.set(tx - fx, ty - fy, tz - fz);
        const liveLen = _liveDirVec.length();
        if (liveLen < 0.001) continue;
        _liveDirVec.divideScalar(liveLen);

        _restDirVec.copy(rest.restDirection);

        // LANGKAH D (BAB 4.3.4 — Persamaan 4.4): Safeguard anti-opposite direction
        const dot = _restDirVec.dot(_liveDirVec);
        if (dot < -0.95) {
          const smoothed = getBoneSmoother(boneName).update(rest.restLocalQuat);
          bone.quaternion.copy(smoothed);
          bone.updateMatrixWorld(true);
          continue;
        }

        // LANGKAH E (BAB 4.3.5 — Persamaan 4.5): Delta quaternion via setFromUnitVectors()
        _deltaQuat.setFromUnitVectors(_restDirVec, _liveDirVec);

        // LANGKAH F (BAB 4.3.6 — Persamaan 4.8): Angle clamping (pembatasan sudut anatomis)
        const maxAngle = MAX_BONE_ANGLE[boneName] || 0.8;
        const halfAngle = Math.acos(Math.min(1.0, Math.abs(_deltaQuat.w)));
        const currentAngle = halfAngle * 2;

        if (currentAngle > maxAngle) {
          const t = 1.0 - (maxAngle / currentAngle);
          _deltaQuat.slerp(_identityQuat, t);
        }

        // LANGKAH G (BAB 4.3.7 — Persamaan 4.9): Konversi world → local space
        _targetWorldQuat.copy(rest.restWorldQuat);
        _targetWorldQuat.premultiply(_deltaQuat);

        if (bone.parent) {
          bone.parent.updateWorldMatrix(true, false);
          bone.parent.getWorldQuaternion(_parentWorldQuat);
          _parentWorldQuat.invert();

          // LANGKAH H (BAB 4.3.8 — Persamaan 4.10): Final smoothing SLERP
          const targetLocalQuat = _targetWorldQuat.clone().premultiply(_parentWorldQuat);
          const smoothed = getBoneSmoother(boneName).update(targetLocalQuat);
          bone.quaternion.copy(smoothed);
        } else {
          const smoothed = getBoneSmoother(boneName).update(_targetWorldQuat);
          bone.quaternion.copy(smoothed);
        }

        bone.updateMatrixWorld(true);
      }

      // Update skeleton setelah semua bone dirotasi
      skinnedMeshes.forEach(mesh => {
        if (mesh.skeleton) mesh.skeleton.update();
      });
    }

    frameCount.current++;
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={clonedScene}
        scale={1.0}
        position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}
      />
    </group>
  );
}