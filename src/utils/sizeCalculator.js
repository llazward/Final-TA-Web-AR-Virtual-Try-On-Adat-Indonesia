/**
 * sizeCalculator.js
 * BAB 4.4 — Sistem Kalibrasi Ukuran Otomatis Berbasis IPD
 * Mengonversi lebar bahu terdeteksi MediaPipe → ukuran baju real (S/M/L/XL/XXL)
 * menggunakan Inter-Pupillary Distance (IPD) sebagai referensi kalibrasi.
 */

// ═══════════════════════════════════════════════════════════════
// BAB 4.4.5 — Tabel 4.8: Size Chart Baju Dewasa
// Batas antar ukuran = titik tengah antara dua ukuran
// S/M = 51.5, M/L = 54.5, L/XL = 58.5, XL/XXL = 62.5
// ═══════════════════════════════════════════════════════════════
const SIZE_CHART = [
  { label: "S",    min: 0,    max: 51.5 },
  { label: "M",    min: 51.5, max: 54.5 },
  { label: "L",    min: 54.5, max: 58.5 },
  { label: "XL",   min: 58.5, max: 62.5 },
  { label: "XXL",  min: 62.5, max: 100 },
];

// ═══════════════════════════════════════════════════════════════
// BAB 4.4.4 — Persamaan 4.19: Multiplier kalibrasi empiris 1.88
// Memetakan rasio rata-rata antara lebar bahu MediaPipe (sendi)
// dengan lebar baju (dada) sesuai standar garmen
// ═══════════════════════════════════════════════════════════════
const SHOULDER_TO_CHEST_MULTIPLIER = 1.88;

// BAB 4.4.3 — Rata-rata IPD dewasa Asia = 6.3 cm (Persamaan 4.13)
const AVG_IPD_CM = 6.3;

// BAB 4.4.7 — Stabilisasi dengan Moving Average (mode statistik)
const SIZE_HISTORY_MAX = 25;
let sizeHistory = [];

function getStableSize(newSize) {
  sizeHistory.push(newSize);
  if (sizeHistory.length > SIZE_HISTORY_MAX) sizeHistory.shift();

  const counts = {};
  sizeHistory.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  let best = newSize, bestCount = 0;
  for (const [sz, cnt] of Object.entries(counts)) {
    if (cnt > bestCount) { bestCount = cnt; best = sz; }
  }
  return best;
}

export const resetSizeHistory = () => { sizeHistory = []; };

/**
 * BAB 4.4.3 — Alur 5 Langkah Kalibrasi IPD (Gambar 4.18)
 * 1. Hitung jarak pixel antar pupil mata (Persamaan 4.13)
 * 2. Hitung jarak pixel bahu kiri-kanan (Persamaan 4.14)
 * 3. Konversi pixel → cm via IPD (Persamaan 4.15 & 4.16)
 * 4. Transformasi bahu → dada via multiplier (Persamaan 4.17 & 4.18)
 * 5. Cocokkan dengan size chart (Tabel 4.8)
 */
export const calculateBodySize = (landmarks) => {
  if (!landmarks) return null;

  const leftEye = landmarks[2];       // Mata kiri (landmark 2)
  const rightEye = landmarks[5];      // Mata kanan (landmark 5)
  const leftShoulder = landmarks[11]; // Bahu kiri (landmark 11)
  const rightShoulder = landmarks[12]; // Bahu kanan (landmark 12)

  if (!leftEye || !rightEye || !leftShoulder || !rightShoulder) return null;

  const minVis = 0.4;
  if ((leftEye.visibility || 0) < minVis ||
      (rightEye.visibility || 0) < minVis ||
      (leftShoulder.visibility || 0) < minVis ||
      (rightShoulder.visibility || 0) < minVis) {
    return null;
  }

  // Langkah 1 — Persamaan 4.13: Jarak Euclidean antar pupil mata
  const eyeDistPx = Math.sqrt(
    Math.pow(leftEye.x - rightEye.x, 2) +
    Math.pow(leftEye.y - rightEye.y, 2)
  );

  // Langkah 2 — Persamaan 4.14: Jarak Euclidean antar sendi bahu
  const shoulderDistPx = Math.sqrt(
    Math.pow(leftShoulder.x - rightShoulder.x, 2) +
    Math.pow(leftShoulder.y - rightShoulder.y, 2)
  );

  if (eyeDistPx < 0.005) return null;

  // Langkah 3 — Persamaan 4.15 & 4.16: Konversi pixel → cm via IPD
  const cmPerPixel = AVG_IPD_CM / eyeDistPx;
  const shoulderWidthCm = shoulderDistPx * cmPerPixel;

  // Langkah 4 — Persamaan 4.17 & 4.18: Bahu → dada via multiplier 1.88
  const chestWidthCm = shoulderWidthCm * SHOULDER_TO_CHEST_MULTIPLIER;

  // Langkah 5 — Cocokkan dengan size chart (Tabel 4.8)
  const rawSize = SIZE_CHART.find(s => chestWidthCm >= s.min && chestWidthCm < s.max);
  const rawLabel = rawSize ? rawSize.label : "?";

  // BAB 4.4.7 — Stabilisasi menggunakan moving average (mode)
  const stableLabel = getStableSize(rawLabel);

  return {
    label: stableLabel,
    widthCm: chestWidthCm.toFixed(1),
    shoulderCm: shoulderWidthCm.toFixed(1),
  };
};