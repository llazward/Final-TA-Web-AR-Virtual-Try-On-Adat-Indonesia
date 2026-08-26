import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { POSE_LANDMARKS } from "../hooks/usePoseDetection";

class Vector3Smoother {
  constructor(smoothingFactor = 0.3) {
    this.current = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.smoothingFactor = smoothingFactor;
  }

  update(x, y, z) {
    this.target.set(x, y, z);
    this.current.lerp(this.target, this.smoothingFactor);
    return this.current;
  }
}

export default function ClothingModel({ pose, clothingUrl }) {
  const groupRef = useRef();
  const positionSmoother = useRef(new Vector3Smoother(0.3));
  const scaleSmoother = useRef(new Vector3Smoother(0.2));

  const { scene: model } = useGLTF(clothingUrl);

  const calculateBodyMetrics = (landmarks) => {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;

    const centerX = (shoulderCenterX + hipCenterX) / 2;
    const centerY = (shoulderCenterY + hipCenterY) / 2;

    const shoulderWidth = Math.sqrt(
      Math.pow(rightShoulder.x - leftShoulder.x, 2) +
        Math.pow(rightShoulder.y - leftShoulder.y, 2)
    );

    const torsoLength = Math.sqrt(
      Math.pow(hipCenterX - shoulderCenterX, 2) +
        Math.pow(hipCenterY - shoulderCenterY, 2)
    );

    const avgZ =
      (leftShoulder.z + rightShoulder.z + leftHip.z + rightHip.z) / 4;

    return {
      centerX,
      centerY,
      shoulderWidth,
      torsoLength,
      depth: avgZ,
      visibility: (leftShoulder.visibility + rightShoulder.visibility) / 2,
    };
  };

  const clonedModel = useMemo(() => {
    if (!model) return null;
    return model.clone();
  }, [model]);

  useFrame(() => {
    if (!groupRef.current || !pose?.landmarks) return;

    const metrics = calculateBodyMetrics(pose.landmarks);
    if (!metrics || metrics.visibility < 0.5) return;

    const x = (metrics.centerX - 0.5) * 6;
    const y = -(metrics.centerY - 0.5) * 4.5;
    const z = -metrics.depth * 2;

    const smoothPos = positionSmoother.current.update(x, y, z);
    groupRef.current.position.copy(smoothPos);

    const targetScale = metrics.shoulderWidth * 15;
    const smoothScale = scaleSmoother.current.update(
      targetScale, targetScale, targetScale
    );
    groupRef.current.scale.copy(smoothScale);

    groupRef.current.rotation.set(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      {clonedModel ? (
        <primitive object={clonedModel} scale={1} rotation={[0, 0, 0]} />
      ) : (
        <mesh castShadow>
          <boxGeometry args={[1, 1.6, 0.4]} />
          <meshStandardMaterial
            color="#ff6b6b"
            transparent
            opacity={0.85}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload("/models/atasan_adatJatim.glb");
useGLTF.preload("/models/adat_jatim.glb");
useGLTF.preload("/models/kebaya_labuh_batik.glb");
useGLTF.preload("/models/dayak.glb");
useGLTF.preload("/models/batik.glb");
