import { useState } from "react";
import { Camera, MapPin, Sparkles, Eye, Heart, Share2 } from "lucide-react";
import { formatPrice } from "../data/catalogData";

const REGION_GRADIENTS = {
  "Jawa Timur":   "from-rose-600 via-pink-500 to-purple-600",
  "Yogyakarta":   "from-violet-600 via-purple-500 to-indigo-600",
  "Nasional":     "from-cyan-600 via-blue-500 to-indigo-600",
  "Kalimantan":   "from-emerald-600 via-teal-500 to-cyan-600",
  "Sumatera":     "from-amber-600 via-orange-500 to-red-600",
};

export default function ClothingCard({ item, onDetail, onTryAR, isFavorite, onToggleFavorite }) {
  const [imgError, setImgError] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);
  const gradientClass = REGION_GRADIENTS[item.region] || "from-purple-600 via-blue-500 to-cyan-600";
  const loved = isFavorite?.(item.id);

  const handleShare = async () => {
    const detailUrl = `${window.location.origin}${window.location.pathname}#/detail/${item.id}`;
    const shareData = {
      title: item.name,
      text: `Lihat ${item.name} — pakaian adat ${item.region}! Coba virtual try-on AR sekarang.`,
      url: detailUrl,
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

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(124,58,237,0.3)]"
         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      
      <div className="relative h-72 overflow-hidden">
        {!imgError ? (
          <img src={item.image} alt={item.name}
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
               onError={() => setImgError(true)} />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
            <span className="text-7xl opacity-80">👘</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <MapPin size={13} className="text-cyan-400" />
          <span className="text-xs font-medium text-white/90">{item.region}</span>
        </div>

        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(item.id); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              loved ? "bg-pink-500/90 text-white shadow-lg shadow-pink-500/30" : "glass text-white/70 hover:text-pink-400"
            }`}
          >
            <Heart size={14} fill={loved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/70 hover:text-cyan-400 transition-all duration-300 relative"
          >
            <Share2 size={14} />
            {shareMsg && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded whitespace-nowrap">
                Link disalin!
              </span>
            )}
          </button>
        </div>

        {!item.availability && (
          <div className="absolute bottom-16 right-3 bg-red-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
            Tidak Tersedia
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold text-white mb-0.5 drop-shadow-lg">{item.name}</h3>
          <p className="text-white/60 text-sm line-clamp-2">{item.shortDescription}</p>
        </div>
      </div>

      <div className="p-4 pt-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Sewa mulai</p>
            <p className="text-xl font-bold gradient-text-warm">{formatPrice(item.rentalPrice || item.price)}</p>
          </div>
          <div className="flex gap-1">
            {(item.sizes || []).slice(0, 5).map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-slate-400">{s}</span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onDetail?.(item)}
            className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 text-slate-300 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Eye size={15} /> Detail
          </button>
          <button
            onClick={() => onTryAR?.(item)}
            disabled={!item.availability}
            className={`flex-[1.4] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
              item.availability
                ? "gradient-btn-pink text-white shadow-lg"
                : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
            }`}
          >
            <Camera size={15} />
            {item.availability ? "Coba AR" : "Tidak Tersedia"}
          </button>
        </div>
      </div>
    </div>
  );
}
