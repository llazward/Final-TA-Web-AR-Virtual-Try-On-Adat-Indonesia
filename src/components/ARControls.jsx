import { ChevronLeft, Camera, SwitchCamera, Home, Shirt, User } from "lucide-react";
import ModelModeSelector from "./ModelModeSelector";

export default function ARControls({
  selectedClothing,
  modelMode,
  onModelModeChange,
  onBack,
  onBackToCatalog,
  onCapture,
  onSwitchCamera,
}) {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-xl flex items-center gap-2 transition-all shadow-lg backdrop-blur-sm"
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              onClick={onBackToCatalog}
              className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-xl transition-all shadow-lg backdrop-blur-sm"
              title="Ke Katalog"
            >
              <Home size={20} />
            </button>
          </div>

          <div className="flex-1 max-w-xs">
            <div className="bg-white/90 px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm text-center">
              <p className="font-semibold text-gray-800 text-sm truncate">
                {selectedClothing?.name}
              </p>
              <p className="text-xs text-gray-500">{selectedClothing?.region}</p>
            </div>
          </div>

          <ModelModeSelector
            mode={modelMode}
            onChange={onModelModeChange}
            compact
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={onSwitchCamera}
              className="bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full transition-all shadow-xl hover:shadow-2xl backdrop-blur-sm hover:scale-110"
              title="Ganti Kamera"
            >
              <SwitchCamera size={24} />
            </button>

            <button
              onClick={onCapture}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-6 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
              title="Ambil Foto"
            >
              <Camera size={32} />
            </button>

            <div className="w-14 h-14" />
          </div>

          <p className="text-center text-white text-sm mt-4 drop-shadow-lg">
            Tap tombol kamera untuk mengambil foto
          </p>
        </div>
      </div>
    </>
  );
}
