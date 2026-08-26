import { useState, useEffect, useRef } from "react";

export const useCamera = (facingMode = "user") => {
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const stopMediaStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const startCamera = async () => {
      stopMediaStream();
      setIsLoading(true);
      setError(null);

      try {
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!isMounted) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        setIsLoading(false);

      } catch (err) {
        console.error("Camera Error:", err);
        if (isMounted) {
          if (err.name === "NotReadableError") {
            setError("Kamera sedang digunakan aplikasi lain. Tutup tab lain atau restart browser.");
          } else if (err.name === "NotAllowedError") {
            setError("Izin kamera ditolak. Mohon izinkan akses kamera.");
          } else {
            setError(`Gagal: ${err.message}`);
          }
          setIsLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopMediaStream();
    };
  }, [facingMode]);

  return { videoRef, stream, isLoading, error };
}