export const capturePhoto = (videoRef, canvasRef) => {
  if (!videoRef?.current || !canvasRef?.current) return null;

  const video = videoRef.current;
  const containerCanvas = canvasRef.current;

  if (!video.videoWidth || !video.videoHeight) return null;

  try {
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d", { alpha: false, desynchronized: true });

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    const threejsCanvas = containerCanvas.querySelector("canvas");
    if (threejsCanvas) {
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(threejsCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    const dataUrl = tempCanvas.toDataURL("image/png", 1.0);
    downloadImage(dataUrl);
    showFlashEffect();

    return dataUrl;
  } catch (err) {
    console.error("Capture error:", err);
    return null;
  }
};

const downloadImage = (dataUrl) => {
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const filename = `baju-adat-tryon-${timestamp}.png`;

  link.download = filename;
  link.href = dataUrl;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const showFlashEffect = () => {
  const flash = document.createElement("div");
  flash.className = "camera-flash";

  flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    pointer-events: none;
    z-index: 9999;
    animation: cameraFlash 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  if (!document.getElementById("camera-flash-style")) {
    const style = document.createElement("style");
    style.id = "camera-flash-style";
    style.textContent = `
      @keyframes cameraFlash {
        0% { opacity: 0; transform: scale(1.1); }
        10% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);
};

const playShutterSound = () => {
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUA0PVqzn77BdGAg+ltryxHYpBSuAy/LajDkIHGq77OSYTgwOUKPg8bZrIA=="
    );
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (err) { }
};

export const showPreview = (dataUrl) => {
  const modal = document.createElement("div");
  modal.className = "preview-modal";
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    ">
      <div style="max-width: 90%; max-height: 90%; position: relative;">
        <img src="${dataUrl}" style="max-width: 100%; max-height: 100%; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);" />
        <button onclick="this.closest('.preview-modal').remove()" style="
          position: absolute; top: 10px; right: 10px;
          background: white; border: none; border-radius: 50%;
          width: 40px; height: 40px; cursor: pointer; font-size: 20px;
        ">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => { if (modal.parentNode) modal.remove(); }, 5000);
};
