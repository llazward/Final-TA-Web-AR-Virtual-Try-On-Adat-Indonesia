import { useState } from "react";
import ClothingCard from "./ClothingCard";
import Footer from "./Footer";
import { catalogData, getCatalogByCategory, searchCatalog } from "../data/catalogData";
import { Search, Filter, Sparkles, Heart } from "lucide-react";

export default function Catalog({ onSelectClothing, onStartAR, favorites = [], onToggleFavorite, isFavorite }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFavorites, setShowFavorites] = useState(false);

  let baseData = searchQuery ? searchCatalog(searchQuery) : catalogData;
  if (selectedCategory !== "all") {
    baseData = baseData.filter(item => item.category === selectedCategory);
  }
  const filteredData = showFavorites
    ? catalogData.filter(item => favorites.includes(item.id))
    : baseData;

  const categories = [
    { value: "all", label: "Semua" },
    { value: "formal", label: "Formal" },
    { value: "semi-formal", label: "Semi-Formal" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #111127 50%, #0f0f2a 100%)' }}>
      
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0f0f2e 0%, #111130 40%, rgba(10,10,26,0.95) 100%)' }}>
        <div className="absolute inset-0 animate-gradient opacity-20"
             style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6, #06b6d4, #ec4899, #7c3aed)', backgroundSize: '300% 300%' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
             style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.5), transparent 70%)' }} />
        
        <div className="relative pt-14 pb-6 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="text-cyan-400" size={20} />
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Virtual Try-On Experience</span>
            <Sparkles className="text-cyan-400" size={20} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 gradient-text">Katalog Baju Adat</h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Jelajahi dan coba pakaian adat Indonesia secara virtual dengan teknologi AR
          </p>
        </div>

        <div className="relative pb-6 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Cari pakaian adat..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowFavorites(false); }}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-purple-500/50"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-500" />
              {categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setSelectedCategory(c.value); setShowFavorites(false); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    !showFavorites && selectedCategory === c.value
                      ? "gradient-btn text-white shadow-lg shadow-purple-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                  style={showFavorites || selectedCategory !== c.value ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
                >
                  {c.label}
                </button>
              ))}

              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                  showFavorites
                    ? "bg-pink-500/90 text-white shadow-lg shadow-pink-500/20"
                    : "text-slate-400 hover:text-pink-400"
                }`}
                style={!showFavorites ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
              >
                <Heart size={14} fill={showFavorites ? "currentColor" : "none"} />
                Favorit
                {favorites.length > 0 && (
                  <span className={`ml-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    showFavorites ? "bg-white/20" : "bg-pink-500/80 text-white"
                  }`}>
                    {favorites.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        {showFavorites && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Heart size={22} className="text-pink-400" fill="currentColor" />
              Koleksi Favorit Anda
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {favorites.length === 0 ? "Belum ada item favorit" : `${favorites.length} item disimpan`}
            </p>
          </div>
        )}

        {filteredData.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-4 opacity-50">{showFavorites ? "💔" : "🔍"}</div>
            <p className="text-slate-500 text-lg">
              {showFavorites ? "Belum ada item favorit. Tekan ♥ pada pakaian untuk menyimpan!" : "Tidak ditemukan"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredData.map((item, i) => (
              <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <ClothingCard
                  item={item}
                  onDetail={onSelectClothing}
                  onTryAR={onStartAR}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
