import { useState, useEffect, useRef } from "react";
import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

export const useBodySegmentation = (videoRef) => {
  const [mask, setMask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const segmenterRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const initSegmentation = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );

        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });

        segmenterRef.current = segmenter;
        setIsLoading(false);
        processFrame();
      } catch (err) {
        console.error("Segmentation init error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    const processFrame = async () => {
      if (!isMounted) return;

      const video = videoRef.current;
      const segmenter = segmenterRef.current;

      if (video && segmenter && video.readyState === 4) {
        const now = performance.now();

        if (now - lastTimeRef.current > 66) {
          lastTimeRef.current = now;

          try {
            const results = segmenter.segmentForVideo(video, now);

            if (results.categoryMask) {
              const maskData = results.categoryMask.getAsUint8Array();
              const width = results.categoryMask.width;
              const height = results.categoryMask.height;

              setMask({ data: maskData, width, height });
              results.categoryMask.close();
            }
          } catch (err) { }
        }
      }

      animationRef.current = requestAnimationFrame(processFrame);
    };

    initSegmentation();

    return () => {
      isMounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (segmenterRef.current) segmenterRef.current.close();
    };
  }, [videoRef]);

  return { mask, isLoading, error };
};
