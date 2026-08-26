export const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * PANDUAN MENGATUR POSISI MODEL AR:
 * ──────────────────────────────────
 * positionOffset.y → Atur ATAS/BAWAH model
 *   - Nilai NEGATIF (-0.5, -1.0) = model TURUN ke bawah
 *   - Nilai POSITIF (+0.5, +1.0) = model NAIK ke atas
 *
 * positionOffset.x → Atur KIRI/KANAN model
 *   - Nilai NEGATIF = model geser ke KIRI
 *   - Nilai POSITIF = model geser ke KANAN
 *
 * positionOffset.z → Atur DEPAN/BELAKANG model (jarang diubah)
 *
 * baseScale → Atur UKURAN model
 *   - Nilai < 1.0 (misal 0.8) = model LEBIH KECIL
 *   - Nilai > 1.0 (misal 1.3) = model LEBIH BESAR
 *
 * anchorPoint → Titik jangkar posisi model
 *   - "shoulder" = model mengikuti posisi bahu
 *   - "hip" = model mengikuti rata-rata bahu + pinggul (untuk full set)
 */
export const defaultARConfig = {
  anchorPoint: "shoulder",
  positionOffset: { x: 0, y: 0, z: 0 },
  rotationOffset: { x: 0, y: 0, z: 0 },
  baseScale: 1.0,
  scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
  baseShoulderDistance: 0.25,
  flipHorizontal: false,
  disableBoneRotation: false,
};

export const catalogData = [
  {
    id: 1,
    name: "Adat Jawa Timur",
    region: "Jawa Timur",
    description: "Pakaian adat dengan kain jarik dan aksesoris lengkap. Pakaian adat Jawa Timur ini merupakan pakaian adat khas Jawa Timur yang sering dikenakan dalam acara formal dan upacara adat.",
    shortDescription: "Pakaian adat Jawa Timur",
    image: "/images/adat_jawa_timur.jpg",
    price: 500000,
    rentalPrice: 150000,
    model: "/models/full_adatJatim_pria.glb",
    models: {
      pria: {
        atasan: "/models/atasan_adatJatim_pria.glb",
        full: "/models/full_adatJatim_pria.glb",
      },
      wanita: {
        atasan: "/models/atasan_adatJatim_wanita.glb",
        full: "/models/full_adatJatim_wanita.glb",
      },
    },
    gender: "pria",
    category: "formal",
    availability: true,
    sizes: ["S", "M", "L", "XL", "XXL"],
    tags: ["Kebaya", "Formal"],
    arConfig: {
      full: {
        anchorPoint: "hip",
        positionOffset: { x: 0, y: -0.8, z: 0 }, // y: minus=turun, plus=naik
        rotationOffset: { x: 0, y: 0, z: 0 },
        baseScale: 1.0, // ubah untuk memperbesar/memperkecil model
        scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
        baseShoulderDistance: 0.22,
        flipHorizontal: false,
        disableBoneRotation: false,
        sizeScaleMap: { S: 0.893, M: 0.946, L: 1.0, XL: 1.054, XXL: 1.107 },
      },
      atasan: {
        anchorPoint: "shoulder",
        positionOffset: { x: 0, y: -1.2, z: 0 }, // y: minus=turun, plus=naik
        rotationOffset: { x: 0, y: 0, z: 0.1 },
        baseScale: 1.3, // ubah untuk memperbesar/memperkecil model
        scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
        baseShoulderDistance: 0.22,
        flipHorizontal: false,
        disableBoneRotation: false,
        sizeScaleMap: { S: 0.893, M: 0.946, L: 1.0, XL: 1.054, XXL: 1.107 },
      },
    },
  },
  {
    id: 2,
    name: "Adat Jogja",
    region: "Yogyakarta",
    description: "Pakaian adat Jogja dengan beskap, sarung, dan blangkon. Pakaian adat Yogyakarta ini melambangkan kehalusan budaya Jawa dan biasa dikenakan dalam upacara keraton.",
    shortDescription: "Pakaian adat Yogyakarta",
    image: "/images/adat_jogja.jpg",
    price: 600000,
    rentalPrice: 175000,
    model: "/models/full_adatJogja_pria.glb",
    models: {
      pria: {
        atasan: "/models/atasan_adatJogja_pria.glb",
        full: "/models/full_adatJogja_pria.glb",
      },
      wanita: {
        atasan: "/models/atasan_adatJogja_wanita.glb",
        full: "/models/full_adatJogja_wanita.glb",
      },
    },
    gender: "pria",
    category: "formal",
    availability: true,
    sizes: ["M", "L", "XL", "XXL"],
    tags: ["Beskap", "Formal"],
    arConfig: {
      full: {
        anchorPoint: "hip",
        positionOffset: { x: 0, y: -0.8, z: 0 }, // y: minus=turun, plus=naik
        rotationOffset: { x: 0, y: 0, z: 0 },
        baseScale: 1.0, // ubah untuk memperbesar/memperkecil model
        scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
        baseShoulderDistance: 0.22,
        flipHorizontal: false,
        disableBoneRotation: false,
        sizeScaleMap: { M: 0.946, L: 1.0, XL: 1.054, XXL: 1.107 },
      },
      atasan: {
        anchorPoint: "shoulder",
        positionOffset: { x: 0, y: -1.2, z: 0 }, // y: minus=turun, plus=naik
        rotationOffset: { x: 0, y: 0, z: 0 },
        baseScale: 1.0, // ubah untuk memperbesar/memperkecil model
        scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
        baseShoulderDistance: 0.22,
        flipHorizontal: false,
        disableBoneRotation: false,
        sizeScaleMap: { M: 0.946, L: 1.0, XL: 1.054, XXL: 1.107 },
      },
    },
  },
  {
    id: 3,
    name: "Adat Bali",
    region: "Bali",
    description: "Pakaian dengan motif bunga yang elegan. Perpaduan kebaya modern dengan sentuhan bunga yang cocok untuk acara formal maupun semi-formal.",
    shortDescription: "Pakaian Bali dengan motif kotak dan bunga",
    image: "/images/adat_bali.jpg",
    price: 450000,
    rentalPrice: 125000,
    model: "/models/full_adatBali_pria.glb",
    models: {
      pria: {
        atasan: "/models/atasan_adatBali_pria.glb",
        full: "/models/full_adatBali_pria.glb",
      },
      wanita: {
        atasan: "/models/atasan_adatBali_wanita.glb",
        full: "/models/full_adatBali_wanita.glb",
      },
    },
    gender: "wanita",
    category: "semi-formal",
    availability: true,
    sizes: ["S", "M", "L", "XL", "XXL"],
    tags: ["Kebaya", "Batik", "Modern"],
    arConfig: {
      full: {
        anchorPoint: "shoulder",
        positionOffset: { x: 0, y: -2.3, z: 0 }, // y: minus=turun, plus=naik
        rotationOffset: { x: 0, y: 0, z: 0 },
        baseScale: 1.1, // ubah untuk memperbesar/memperkecil model
        scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
        baseShoulderDistance: 0.24,
        flipHorizontal: false,
        disableBoneRotation: false,
        sizeScaleMap: { S: 0.893, M: 0.946, L: 1.0, XL: 1.054, XXL: 1.107 },
      },
      atasan: {
        anchorPoint: "shoulder",
        positionOffset: { x: 0, y: -1.5, z: 0 }, // y: minus=turun, plus=naik
        rotationOffset: { x: 0, y: 0, z: 0 },
        baseScale: 1.1, // ubah untuk memperbesar/memperkecil model
        scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
        baseShoulderDistance: 0.24,
        flipHorizontal: false,
        disableBoneRotation: false,
        sizeScaleMap: { S: 0.893, M: 0.946, L: 1.0, XL: 1.054, XXL: 1.107 },
      },
    },
  },
  {
    id: 4,
    name: "Adat Dayak",
    region: "Kalimantan",
    description: "Pakaian adat suku Dayak dari Kalimantan dengan ornamen dan motif khas yang menggambarkan kearifan lokal Kalimantan. Biasa dipakai dalam upacara Gawai dan ritual adat.",
    shortDescription: "Pakaian adat khas Kalimantan",
    image: "/images/adat_dayak.jpg",
    price: 550000,
    rentalPrice: 160000,
    model: "/models/full_adatDayak_pria.glb",
    models: {
      pria: {
        atasan: "/models/atasan_adatDayak_pria.glb",
        full: "/models/full_adatDayak_pria.glb",
      },
      wanita: {
        atasan: "/models/atasan_adatDayak_wanita.glb",
        full: "/models/full_adatDayak_wanita.glb",
      },
    },
    gender: "pria",
    category: "formal",
    availability: true,
    sizes: ["M", "L", "XL", "XXL"],
    tags: ["Dayak", "Kalimantan", "Formal"],
    arConfig: {
      full: {
        anchorPoint: "shoulder",
        positionOffset: { x: 0, y: -0.8, z: 0 }, // y: minus=turun, plus=naik
        rotationOffset: { x: 0, y: 0, z: 0 },
        baseScale: 1.0, // ubah untuk memperbesar/memperkecil model
        scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
        baseShoulderDistance: 0.23,
        flipHorizontal: false,
        disableBoneRotation: false,
        sizeScaleMap: { M: 0.946, L: 1.0, XL: 1.054, XXL: 1.107 },
      },
      atasan: {
        anchorPoint: "shoulder",
        positionOffset: { x: 0, y: -1.2, z: 0 }, // y: minus=turun, plus=naik
        rotationOffset: { x: 0, y: 0, z: 0 },
        baseScale: 1.0, // ubah untuk memperbesar/memperkecil model
        scaleMultiplier: { x: 2.0, y: 2.0, z: 1.5 },
        baseShoulderDistance: 0.23,
        flipHorizontal: false,
        disableBoneRotation: false,
        sizeScaleMap: { M: 0.946, L: 1.0, XL: 1.054, XXL: 1.107 },
      },
    },
  },
];

export const getCatalogByCategory = (category) => {
  if (!category || category === "all") return catalogData;
  return catalogData.filter((item) => item.category === category);
};

export const getCatalogByGender = (data, gender) => {
  if (!gender || gender === "semua") return data;
  return data.filter((item) => item.gender === gender);
};

export const getCatalogById = (id) => {
  return catalogData.find((item) => item.id === parseInt(id));
};

export const searchCatalog = (query) => {
  const q = query.toLowerCase();
  return catalogData.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q) ||
      (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(q)))
  );
};

export const getAvailableCatalog = () => {
  return catalogData.filter((item) => item.availability);
};

export const getARConfig = (clothing, displayMode) => {
  if (clothing?.arConfig?.[displayMode]) return clothing.arConfig[displayMode];
  if (clothing?.arConfig?.full) return clothing.arConfig.full;
  return defaultARConfig;
};

export const getModelUrl = (clothing, displayMode, gender = "pria") => {
  if (clothing?.models?.[gender]?.[displayMode]) return clothing.models[gender][displayMode];
  if (clothing?.models?.pria?.[displayMode]) return clothing.models.pria[displayMode];
  if (clothing?.models?.wanita?.[displayMode]) return clothing.models.wanita[displayMode];
  return clothing?.model || "/models/adat_jatim.glb";
};
