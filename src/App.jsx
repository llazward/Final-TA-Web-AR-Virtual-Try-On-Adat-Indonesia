import { useState, useEffect, useCallback } from "react";
import Catalog from "./components/Catalog";
import ClothingDetail from "./components/ClothingDetail";
import ARView from "./components/ARView";
import { getCatalogById } from "./data/catalogData";

const loadFavorites = () => {
  try {
    const saved = localStorage.getItem("ar_favorites");
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const parseHash = () => {
  const hash = window.location.hash;
  const detailMatch = hash.match(/^#\/detail\/(\d+)$/);
  if (detailMatch) {
    const id = parseInt(detailMatch[1]);
    const item = getCatalogById(id);
    if (item) return { view: "detail", item };
  }
  return { view: "catalog", item: null };
};

export default function App() {
  const initial = parseHash();
  const [selectedClothing, setSelectedClothing] = useState(initial.item);
  const [displayMode, setDisplayMode] = useState("full");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedGender, setSelectedGender] = useState("pria");
  const [currentView, setCurrentView] = useState(initial.view);
  const [favorites, setFavorites] = useState(loadFavorites);

  useEffect(() => {
    localStorage.setItem("ar_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((itemId) => {
    setFavorites(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  }, []);

  const isFavorite = useCallback((itemId) => favorites.includes(itemId), [favorites]);

  useEffect(() => {
    if (currentView === "detail" && selectedClothing) {
      window.location.hash = `/detail/${selectedClothing.id}`;
    } else if (currentView === "catalog") {
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    }
  }, [currentView, selectedClothing]);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash();
      setSelectedClothing(parsed.item);
      setCurrentView(parsed.view);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleSelectClothing = (item) => {
    setSelectedClothing(item);
    setCurrentView("detail");
  };

  const handleStartAR = (mode, size, gender) => {
    setDisplayMode(mode || "full");
    setSelectedSize(size || null);
    setSelectedGender(gender || "pria");
    setCurrentView("ar");
  };

  const handleBackToCatalog = () => {
    setSelectedClothing(null);
    setDisplayMode("full");
    setCurrentView("catalog");
  };

  const handleStartARDirect = (item) => {
    setSelectedClothing(item);
    setDisplayMode("full");
    setSelectedSize(null);
    setCurrentView("ar");
  };

  const handleBackToDetail = () => {
    setCurrentView("detail");
  };

  switch (currentView) {
    case "ar":
      return (
        <ARView
          selectedClothing={selectedClothing}
          initialDisplayMode={displayMode}
          initialSize={selectedSize}
          initialGender={selectedGender}
          onBack={handleBackToDetail}
        />
      );
    case "detail":
      return (
        <ClothingDetail
          clothing={selectedClothing}
          onBack={handleBackToCatalog}
          onStartAR={handleStartAR}
          isFavorite={isFavorite(selectedClothing?.id)}
          onToggleFavorite={() => toggleFavorite(selectedClothing?.id)}
        />
      );
    default:
      return (
        <Catalog
          onSelectClothing={handleSelectClothing}
          onStartAR={handleStartARDirect}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />
      );
  }
}
