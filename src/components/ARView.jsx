import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useCamera } from "../hooks/useCamera";
import { usePoseDetection } from "../hooks/usePoseDetection";
import ARScene from "../three/ARScene";
import { getAvailableCatalog, formatPrice } from "../data/catalogData";
import { calculateBodySize } from "../utils/sizeCalculator"; 
import {
  Camera, FlipHorizontal, ChevronLeft, ChevronRight, Shirt, User, Users,
  Info, X, Lightbulb, Video, Square, Check, Trash2, Play, Pause, ScanFace, Ruler
} from "lucide-react";

const WomanIcon = ({ size = 16, className = "" }) => (
  <img src="/icons/woman.png" alt="Wanita" width={size} height={size} className={className} style={{ filter: 'brightness(0) invert(1)' }} />
);
const ManIcon = ({ size = 16, className = "" }) => (
  <img src="/icons/man.png" alt="Pria" width={size} height={size} className={className} style={{ filter: 'brightness(0) invert(1)' }} />
);

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export default function ARView({ selectedClothing: initialClothing, initialDisplayMode = "full", initialSize = null, initialGender = "pria", onBack }) {
  const [selectedClothing, setSelectedClothing] = useState(initialClothing);
  const [displayMode, setDisplayMode] = useState(initialDisplayMode);
  const [selectedGender, setSelectedGender] = useState(initialGender);
  const [facingMode, setFacingMode] = useState("user");
  const [showTips, setShowTips] = useState(false);
  const [sizeOverride, setSizeOverride] = useState(initialSize);
  const [detectedSize, setDetectedSize] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const videoPreviewRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    html.style.position = 'fixed';
    html.style.width = '100%';
    html.style.height = '100%';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.height = '100%';
    return () => {
      html.style.overflow = '';
      html.style.position = '';
      html.style.width = '';
      html.style.height = '';
      body.style.overflow = '';
      body.style.position = '';
      body.style.width = '';
      body.style.height = '';
    };
  }, []);

  const { videoRef, isLoading: camLoading, error: camError } = useCamera(facingMode);
  const { pose, isLoading: poseLoading } = usePoseDetection(videoRef);
  const isLoading = camLoading || poseLoading;

  useEffect(() => {
    if (pose?.landmarks) {
      const sizeData = calculateBodySize(pose.landmarks);
      if (sizeData) setDetectedSize(sizeData);
    } else {
      setDetectedSize(null);
    }
  }, [pose]);

  useEffect(() => {
    if (!isLoading) {
      setShowTips(true);
      const timer = setTimeout(() => setShowTips(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    return () => {
      clearInterval(recordingIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  const availableCatalog = getAvailableCatalog();
  const currentIndex = availableCatalog.findIndex((i) => i.id === selectedClothing?.id);

  const handlePrev = () => {
    const idx = currentIndex > 0 ? currentIndex - 1 : availableCatalog.length - 1;
    setSelectedClothing(availableCatalog[idx]);
  };

  const handleNext = () => {
    const idx = currentIndex < availableCatalog.length - 1 ? currentIndex + 1 : 0;
    setSelectedClothing(availableCatalog[idx]);
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (videoPreviewRef.current) {
      if (isPlaying) videoPreviewRef.current.pause();
      else videoPreviewRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoPreviewRef.current) setVideoProgress(videoPreviewRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoPreviewRef.current) setVideoDuration(videoPreviewRef.current.duration);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = time;
      setVideoProgress(time);
    }
  };

  const getCombinedCanvas = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const container = canvasRef.current;
    const threeCanvas = container.querySelector("canvas");

    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = video.videoWidth;
    combinedCanvas.height = video.videoHeight;
    const ctx = combinedCanvas.getContext("2d");

    if (facingMode === "user") {
      ctx.translate(combinedCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (threeCanvas) {
      ctx.drawImage(threeCanvas, 0, 0, combinedCanvas.width, combinedCanvas.height);
    }
    return combinedCanvas;
  };

  const handleCapturePhoto = () => {
    try {
      const combined = getCombinedCanvas();
      if (!combined) return;
      const dataUrl = combined.toDataURL("image/png");
      setPreviewMedia({ url: dataUrl, type: "image" });
    } catch (e) {
      console.error("Foto Error:", e);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      clearInterval(recordingIntervalRef.current);
      clearInterval(timerIntervalRef.current);
      setIsRecording(false);
    } else {
      setRecordingTime(0);
      recordedChunksRef.current = [];
      const combined = getCombinedCanvas();
      if (!combined) return;

      const streamCanvas = document.createElement("canvas");
      streamCanvas.width = combined.width;
      streamCanvas.height = combined.height;
      const ctx = streamCanvas.getContext("2d");

      recordingIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        if (facingMode === "user") {
          ctx.save();
          ctx.translate(streamCanvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0);
          ctx.restore();
        } else {
          ctx.drawImage(videoRef.current, 0, 0);
        }
        const threeCanvas = canvasRef.current.querySelector("canvas");
        if (threeCanvas) {
          if (facingMode === "user") {
            ctx.save();
            ctx.translate(streamCanvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(threeCanvas, 0, 0, streamCanvas.width, streamCanvas.height);
            ctx.restore();
          } else {
            ctx.drawImage(threeCanvas, 0, 0, streamCanvas.width, streamCanvas.height);
          }
        }
      }, 1000 / 30);

      const stream = streamCanvas.captureStream(30);
      let mimeType = "video/webm";
      if (MediaRecorder.isTypeSupported("video/mp4")) mimeType = "video/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewMedia({ url, type: "video" });
        setIsPlaying(true);
        clearInterval(recordingIntervalRef.current);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleSave = () => {
    if (!previewMedia) return;
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (previewMedia.type === "image") {
      link.download = `Susilawati-IMG-${timestamp}.png`;
      link.href = previewMedia.url;
    } else {
      link.download = `Susilawati-VID-${timestamp}.webm`;
      link.href = previewMedia.url;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setPreviewMedia(null);
  };

  const handleDiscard = () => {
    if (previewMedia?.url) URL.revokeObjectURL(previewMedia.url);
    setPreviewMedia(null);
    setVideoProgress(0);
    setVideoDuration(0);
  };

  const toggleTips = () => setShowTips((prev) => !prev);

  return (
    <div className="relative w-full bg-black overflow-hidden font-sans select-none" style={{ touchAction: 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
      />

      <div
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: "transparent" }}
          gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
        >
          <ARScene
            pose={pose}
            selectedClothing={selectedClothing}
            displayMode={displayMode}
            sizeOverride={sizeOverride}
            selectedGender={selectedGender}
          />
        </Canvas>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold animate-pulse">Menyiapkan Kamera...</h2>
        </div>
      )}

      {showTips && !isLoading && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-fade-in">
          <div className="bg-white/95 text-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/20 relative">
            <button onClick={() => setShowTips(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X size={24} />
            </button>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                <ScanFace size={36} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Tips Hasil Terbaik</h3>
              <p className="text-gray-500 text-sm mt-1">Ikuti panduan berikut agar baju pas di badan</p>
            </div>
            <ul className="space-y-4 text-left">
              <li className="flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0"><Lightbulb size={20} /></div>
                <div>
                  <p className="font-bold text-gray-800">Cahaya Terang</p>
                  <p className="text-xs text-gray-500">Pastikan wajah dan badan tidak gelap.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0"><User size={20} /></div>
                <div>
                  <p className="font-bold text-gray-800">Posisi Badan</p>
                  <p className="text-xs text-gray-500">Mundur 1-2 meter hingga lutut terlihat.</p>
                </div>
              </li>
            </ul>
            <button onClick={() => setShowTips(false)} className="w-full mt-8 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-bold shadow-lg transition active:scale-95">
              Oke, Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {previewMedia && (
        <div className="absolute inset-0 z-[80] bg-black flex flex-col">
          <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <h3 className="text-white font-bold text-lg">Preview</h3>
            <button onClick={handleDiscard} className="bg-white/20 p-2 rounded-full text-white"><X size={20} /></button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 overflow-hidden relative w-full">
            {previewMedia.type === "image" ? (
              <img src={previewMedia.url} alt="Result" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={videoPreviewRef}
                  src={previewMedia.url}
                  className="max-w-full max-h-full object-contain"
                  playsInline autoPlay
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
                {!isPlaying && (
                  <button onClick={togglePlay} className="absolute p-4 bg-black/50 rounded-full text-white backdrop-blur-sm hover:bg-black/70 transition">
                    <Play size={48} fill="white" />
                  </button>
                )}
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-3 flex items-center gap-3">
                  <button onClick={togglePlay} className="text-white hover:text-amber-400 transition">
                    {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                  </button>
                  <input type="range" min="0" max={videoDuration} value={videoProgress} onChange={handleSeek}
                    className="flex-1 h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                  <span className="text-xs text-white font-mono min-w-[70px] text-right">
                    {formatTimer(videoProgress)} / {formatTimer(videoDuration)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-black/90 p-6 flex justify-around items-center">
            <button onClick={handleDiscard} className="flex flex-col items-center gap-2 text-red-500 active:scale-95 transition">
              <div className="bg-red-500/10 p-4 rounded-full border border-red-500/50"><Trash2 size={24} /></div>
              <span className="text-xs font-bold">Hapus</span>
            </button>
            <button onClick={handleSave} className="flex flex-col items-center gap-2 text-green-500 active:scale-95 transition">
              <div className="bg-green-500/10 p-4 rounded-full border border-green-500/50"><Check size={24} /></div>
              <span className="text-xs font-bold">Simpan</span>
            </button>
          </div>
        </div>
      )}

      {!previewMedia && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent pb-24">
            <button onClick={onBack} className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/30 transition shadow-lg">
              <ChevronLeft size={24} />
            </button>

            <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-2xl shadow-lg border border-white/50">
              <p className="font-bold text-sm text-gray-900 text-center whitespace-nowrap">{selectedClothing?.name}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg">
                <button
                  onClick={() => setDisplayMode("atasan")}
                  className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    displayMode === "atasan" ? "bg-white text-amber-600" : "text-white/70"
                  }`}
                >
                  <Shirt size={16} /> Atasan
                </button>
                <button
                  onClick={() => setDisplayMode("full")}
                  className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    displayMode === "full" ? "bg-white text-amber-600" : "text-white/70"
                  }`}
                >
                  <User size={16} /> Full Set
                </button>
              </div>

              <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg">
                <button
                  onClick={() => setSelectedGender("pria")}
                  className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    selectedGender === "pria" ? "bg-blue-500 text-white" : "text-white/70"
                  }`}
                >
                  <ManIcon size={16} /> Pria
                </button>
                <button
                  onClick={() => setSelectedGender("wanita")}
                  className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    selectedGender === "wanita" ? "bg-pink-500 text-white" : "text-white/70"
                  }`}
                >
                  <WomanIcon size={16} /> Wanita
                </button>
              </div>
            </div>
          </div>

          <div className="absolute top-24 left-4 z-40 flex flex-col gap-2 items-start">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg backdrop-blur-md border border-white/10 transition-colors duration-300 ${
              pose?.landmarks ? "bg-green-500/80" : "bg-red-500/80"
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full bg-white ${pose?.landmarks ? "animate-pulse" : ""}`} />
              {pose?.landmarks ? "Terdeteksi" : "Tidak Terdeteksi"}
            </div>

            <div className="bg-amber-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg border border-white/10">
              <p className="text-xs font-bold text-white tracking-wide">{formatPrice(selectedClothing?.rentalPrice || 0)}</p>
            </div>

            <button
              onClick={() => {
                const sizes = [null, ...(selectedClothing?.sizes || ["S", "M", "L", "XL"])];
                const currentIdx = sizes.indexOf(sizeOverride);
                const nextIdx = (currentIdx + 1) % sizes.length;
                setSizeOverride(sizes[nextIdx]);
              }}
              className="bg-blue-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg border border-white/10 flex items-center gap-2 animate-fade-in active:scale-95 transition"
            >
              <Ruler size={14} className="text-white" />
              <div>
                <p className="text-[10px] text-blue-100 leading-none">Size:</p>
                <p className="text-sm font-bold text-white leading-none mt-0.5">
                  {sizeOverride === null ? (
                    <>
                      {detectedSize ? detectedSize.label : "Auto"}{" "}
                      <span className="text-[10px] font-normal opacity-80">
                        {detectedSize ? `(${detectedSize.widthCm} cm)` : "✨"}
                      </span>
                    </>
                  ) : (
                    <>
                      {sizeOverride}{" "}
                      <span className="text-[10px] font-normal opacity-80">(manual)</span>
                    </>
                  )}
                </p>
              </div>
            </button>
          </div>

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 z-30 pointer-events-none">
            <button onClick={handlePrev} className="pointer-events-auto bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-sm transition active:scale-90">
              <ChevronLeft size={32} />
            </button>
            <button onClick={handleNext} className="pointer-events-auto bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-sm transition active:scale-90">
              <ChevronRight size={32} />
            </button>
          </div>

          <div className="absolute bottom-36 left-0 right-0 z-40 text-center pointer-events-none">
            <div className="inline-block bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-bold border border-white/10 tracking-widest">
              {currentIndex + 1} / {availableCatalog.length}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-50 pt-10 px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center gap-6" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
            <button onClick={handleSwitchCamera} className="flex flex-col items-center gap-1 group active:scale-95 transition">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                <FlipHorizontal size={24} className="text-white" />
              </div>
              <span className="text-[10px] text-white/80 font-medium">Balik</span>
            </button>

            <div className="relative flex flex-col items-center gap-1">
              {isRecording && (
                <div className="absolute -top-10 bg-red-600 text-white text-xs font-mono px-3 py-1 rounded-full animate-pulse shadow-md">
                  {formatTimer(recordingTime)}
                </div>
              )}
              <button
                onClick={handleToggleRecord}
                className={`p-4 rounded-full backdrop-blur-md transition shadow-xl border-2 active:scale-95 ${
                  isRecording ? "bg-white border-red-500" : "bg-white/20 border-white/10 hover:bg-white/30"
                }`}
              >
                {isRecording ? (
                  <Square size={24} className="text-red-600 fill-red-600" />
                ) : (
                  <Video size={24} className="text-white" />
                )}
              </button>
              <span className="text-[10px] text-white/80 font-medium">{isRecording ? "Stop" : "Video"}</span>
            </div>

            <div className="flex flex-col items-center gap-1 pb-1">
              <button onClick={handleCapturePhoto} className="relative group cursor-pointer active:scale-95 transition-transform">
                <div className="absolute inset-0 bg-white rounded-full opacity-20 blur-sm"></div>
                <div className="relative bg-transparent border-[3px] border-white w-20 h-20 rounded-full flex items-center justify-center p-1 shadow-2xl">
                  <div className="w-full h-full bg-amber-500 rounded-full border-2 border-black/10 flex items-center justify-center group-hover:bg-amber-400 transition">
                    <Camera size={32} className="text-white drop-shadow-md" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={toggleTips}
            className="absolute right-6 z-50 text-white/60 hover:text-white bg-black/30 p-2.5 rounded-full backdrop-blur-sm transition border border-white/5 active:scale-90"
            style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
            title="Bantuan"
          >
            <Info size={20} />
          </button>
        </>
      )}
    </div>
  );
}