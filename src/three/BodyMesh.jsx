import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { POSE_LANDMARKS } from "../hooks/usePoseDetection";

const SCALE_X = 2.2;
const SCALE_Y = 2.0;
const SCALE_Z = 0.5;

function lmToWorld(lm) {
  return new THREE.Vector3(
    (lm.x - 0.5) * SCALE_X,
    (0.5 - lm.y) * SCALE_Y,
    -lm.z * SCALE_Z
  );
}

export default function BodyMesh({ pose, visible = false }) {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    if (!pose?.landmarks) return null;
    const lm = pose.landmarks;

    const verts = [];

    const nose = lmToWorld(lm[POSE_LANDMARKS.NOSE]);
    const ls = lmToWorld(lm[POSE_LANDMARKS.LEFT_SHOULDER]);
    const rs = lmToWorld(lm[POSE_LANDMARKS.RIGHT_SHOULDER]);
    const lh = lmToWorld(lm[POSE_LANDMARKS.LEFT_HIP]);
    const rh = lmToWorld(lm[POSE_LANDMARKS.RIGHT_HIP]);

    const sc = ls.clone().add(rs).multiplyScalar(0.5);
    const hc = lh.clone().add(rh).multiplyScalar(0.5);

    const chest = sc.clone().lerp(hc, 0.3);
    const waist = sc.clone().lerp(hc, 0.7);

    verts.push(sc, ls, rs, chest, lh, rh, waist, nose);

    const positions = new Float32Array(verts.flatMap((v) => v.toArray()));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const indices = new Uint16Array([
      0, 1, 2, 1, 3, 2, 1, 4, 6, 2, 6, 5, 3, 4, 6, 3, 6, 5,
    ]);

    g.setIndex(new THREE.BufferAttribute(indices, 1));
    g.computeVertexNormals();
    return g;
  }, [pose]);

  useFrame(() => {
    if (meshRef.current && geometry) {
      meshRef.current.geometry = geometry;
    }
  });

  if (!geometry) return null;

  return (
    <mesh ref={meshRef}>
      <meshStandardMaterial
        color="#00ff00"
        wireframe
        transparent
        opacity={visible ? 0.3 : 0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
