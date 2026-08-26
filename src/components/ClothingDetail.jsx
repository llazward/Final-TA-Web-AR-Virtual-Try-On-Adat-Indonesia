import { useState } from "react";
import {
  ChevronLeft, Camera, Heart, Share2, MapPin, Check, Shirt, User, Users,
  Info, Ruler, Sparkles, Zap,
} from "lucide-react";
import { formatPrice } from "../data/catalogData";

const WomanIcon = ({ size = 16, className = "" }) => (
  <img src="/icons/woman.png" alt="Wanita" width={size} height={size} className={className} style={{ filter: 'brightness(0) invert(1)' }} />
);
const ManIcon = ({ size = 16, className = "" }) => (
  <img src="/icons/man.png" alt="Pria" width={size} height={size} className={className} style={{ filter: 'brightness(0) invert(1)' }} />
);

const REGION_GRADIENTS = {
  "Jawa Timur":  "from-rose-600 via-pink-500 to-purple-600",
  "Yogyakarta":  "from-violet-600 via-purple-500 to-indigo-600",
  "Nasional":    "from-cyan-600 via-blue-500 to-indigo-600",
  "Kalimantan":  "from-emerald-600 via-teal-500 to-cyan-600",
  "Sumatera":    "from-amber-600 via-orange-500 to-red-600",
};

export default function ClothingDetail({ clothing, onBack, onStartAR, isFavorite = false, onToggleFavorite }) {
  const [selectedMode, setSelectedMode] = useState("full");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedGender, setSelectedGender] = useState(clothing?.gender || "pria");
  const [imgError, setImgError] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);

  const modes = [
    { id: "atasan", name: "Atasan Saja", icon: Shirt, description: "Hanya bagian baju" },
    { id: "full", name: "Full Set", icon: User, description: "Lengkap dari kepala hingga bawah" },
  ];

  const handleTryAR = () => onStartAR(selectedMode, selectedSize, selectedGender);

  const handleShare = async () => {
    const shareData = {
      title: clothing?.name,
      text: `Lihat ${clothing?.name} — pakaian adat ${clothing?.region}! Coba virtual try-on AR.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareMsg(true);
        setTimeout(() => setShareMsg(false), 2000);
      }
    } catch (e) { }
  };

  if (!clothing) return null;

  const gradientClass = REGION_GRADIENTS[clothing.region] || "from-purple-600 via-blue-500 to-cyan-600";

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #111127 50%, #0f0f2a 100%)' }}>
      
      <header className="sticky top-0 z-50 py-3 px-4" style={{ background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container mx-auto flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={22} />
            <span className="font-medium text-sm">Kembali</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFavorite}
              className={`p-2.5 rounded-full transition-all ${isFavorite ? "bg-pink-500/20 text-pink-400" : "text-slate-500 hover:text-white"}`}
              style={!isFavorite ? { background: 'rgba(255,255,255,0.05)' } : {}}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full text-slate-500 hover:text-white transition-all relative"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <Share2 size={18} />
              {shareMsg && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded whitespace-nowrap">
                  Link disalin!
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          
          <div className="animate-fade-in">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {!imgError ? (
                <img src={clothing.gallery?.[0] || clothing.image} alt={clothing.name}
                  className="w-full h-full object-cover" onError={() => setImgError(true)} />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                  <span className="text-8xl opacity-70">👘</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 glass rounded-full px-4 py-2 flex items-center gap-2">
                <MapPin size={14} className="text-cyan-400" />
                <span className="font-medium text-white/90 text-sm">{clothing.region}</span>
              </div>
              {clothing.availability ? (
                <div className="absolute top-4 right-4 bg-emerald-500/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <Check size={14} /> Tersedia
                </div>
              ) : (
                <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
                  Tidak Tersedia
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 animate-fade-in-up">
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-3 gradient-text">{clothing.name}</h1>
              <p className="text-slate-400 leading-relaxed text-sm">{clothing.description}</p>
            </div>

            {clothing.tags && (
              <div className="flex flex-wrap gap-2">
                {clothing.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium text-purple-300"
                        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Harga Sewa</p>
                  <p className="text-3xl font-black gradient-text-warm">{formatPrice(clothing.rentalPrice || clothing.price)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Harga Beli</p>
                  <p className="text-lg font-semibold text-slate-500">{formatPrice(clothing.price)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <Ruler size={16} className="text-purple-400" /> Pilih Ukuran
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">Pilih ukuran manual atau biarkan otomatis menyesuaikan tubuh</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSize(null)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedSize === null ? "gradient-btn-pink text-white shadow-lg shadow-pink-500/20" : "text-slate-400 hover:text-white"
                  }`}
                  style={selectedSize !== null ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
                >
                  <Sparkles size={14} /> Auto
                </button>
                {(clothing.sizes || ["S","M","L","XL","XXL"]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedSize === size ? "gradient-btn text-white shadow-lg shadow-purple-500/20" : "text-slate-400 hover:text-white"
                    }`}
                    style={selectedSize !== size ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                {selectedSize === null ? (
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Sparkles size={11} /> Ukuran otomatis berdasarkan deteksi tubuh kamera
                  </span>
                ) : (
                  <span>Ukuran <strong className="text-white">{selectedSize}</strong> akan digunakan di AR</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Users size={16} className="text-purple-400" /> Pilih Gender Pakaian
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "pria", name: "Pria", icon: ManIcon, description: "Pakaian adat pria", color: "blue" },
                  { id: "wanita", name: "Wanita", icon: WomanIcon, description: "Pakaian adat wanita", color: "pink" },
                ].map((g) => {
                  const GIcon = g.icon;
                  const isActive = selectedGender === g.id;
                  const activeColor = g.color === "blue" ? "rgba(59,130,246" : "rgba(236,72,153";
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGender(g.id)}
                      className="relative p-4 rounded-xl transition-all text-left"
                      style={{
                        background: isActive ? `${activeColor},0.12)` : 'rgba(255,255,255,0.03)',
                        border: isActive ? `1px solid ${activeColor},0.5)` : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                             style={{ background: g.color === "blue" ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                        isActive ? (g.color === "blue" ? "text-blue-400" : "text-pink-400") : "text-slate-500"
                      }`} style={{ background: isActive ? `${activeColor},0.2)` : 'rgba(255,255,255,0.05)' }}>
                        <GIcon size={20} />
                      </div>
                      <h4 className={`font-semibold text-sm ${isActive ? "text-white" : "text-slate-400"}`}>{g.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{g.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Camera size={16} className="text-cyan-400" /> Mode AR Try-On
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className="relative p-4 rounded-xl transition-all text-left"
                      style={{
                        background: isActive ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                        border: isActive ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                             style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                        isActive ? "text-purple-400" : "text-slate-500"
                      }`} style={{ background: isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)' }}>
                        <Icon size={20} />
                      </div>
                      <h4 className={`font-semibold text-sm ${isActive ? "text-white" : "text-slate-400"}`}>{mode.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{mode.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleTryAR}
              disabled={!clothing.availability}
              className={`w-full py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                clothing.availability
                  ? "gradient-btn-pink text-white shadow-xl shadow-pink-500/20 hover:shadow-2xl hover:shadow-pink-500/30"
                  : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
              }`}
            >
              <Zap size={22} />
              <span>Coba dengan AR Camera</span>
            </button>

            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300/80">
                Gunakan kamera di tempat terang dan pastikan seluruh badan terlihat untuk hasil terbaik.
              </p>
            </div>

            {clothing.materials && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Bahan</h3>
                <div className="flex flex-wrap gap-2">
                  {clothing.materials.map((material, idx) => (
                    <span key={idx} className="px-4 py-2 rounded-lg text-xs text-slate-400"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
