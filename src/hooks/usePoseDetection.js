import { useState, useEffect, useRef } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

export const usePoseDetection = (videoRef) => {
  const [pose, setPose] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const landmarkerRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsLoading(false);
          loop();
        }
      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    };

    const loop = () => {
      if (videoRef.current && landmarkerRef.current && videoRef.current.readyState >= 2) {
        const res = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        if (res.landmarks && res.landmarks.length > 0) {
          setPose({ landmarks: res.landmarks[0] });
        } else {
          setPose(null);
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    init();
    return () => { isMounted = false; cancelAnimationFrame(requestRef.current); };
  }, [videoRef]);

  return { pose, isLoading };
};