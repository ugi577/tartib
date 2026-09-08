// Satu sumber ukuran kertas untuk pratinjau DAN cetak (sesi 22).
//
// Sebelumnya ada dua sistem kertas yang saling berbeda: SopView memakai
// A4/F4(210×330)/Letter/Legal/A5 dengan @page di-inject sendiri, sementara
// PrintReadyCanvas memakai a4/f4(215×330)/thermal dengan @page yang ditulis
// bersarang di globals.css (tidak valid — dibuang browser, ukuran kertas
// tidak pernah diterapkan). Modul ini menyatukan keduanya:
//   - dimensi fisik dalam mm (F4/Folio = 215 × 330 mm, ukuran folio Indonesia),
//   - margin cetak baku per kertas,
//   - aturan @page yang siap di-inject sebagai <style> saat mencetak,
//   - konversi mm → px CSS (96 dpi) agar pratinjau layar berskala benar,
//   - preferensi kertas milik perangkat (localStorage) yang dipakai bersama.
//
// Aturan pratinjau = cetak: padding lembar di layar SAMA dengan margin @page,
// sehingga garis batas aman di pratinjau tepat di posisi tepi area cetak.

export type IdKertas = 'a4' | 'f4' | 'letter' | 'legal' | 'a5' | 'thermal80' | 'thermal58';
export type OrientasiKertas = 'portrait' | 'landscape';

export interface SpesifikasiKertas {
  id: IdKertas;
  /** Nama singkat untuk tombol/pilihan. */
  label: string;
  /** Lebar fisik dalam posisi tegak (mm). */
  lebarMm: number;
  /** Tinggi fisik (mm); null = kertas gulung, tinggi mengikuti isi. */
  tinggiMm: number | null;
  /** Margin cetak baku (mm) — dipakai @page dan padding pratinjau. */
  marginMm: number;
}

export const DAFTAR_KERTAS: readonly SpesifikasiKertas[] = [
  { id: 'a4', label: 'A4', lebarMm: 210, tinggiMm: 297, marginMm: 10 },
  { id: 'f4', label: 'F4 / Folio', lebarMm: 215, tinggiMm: 330, marginMm: 10 },
  { id: 'letter', label: 'Letter', lebarMm: 216, tinggiMm: 279, marginMm: 10 },
  { id: 'legal', label: 'Legal', lebarMm: 216, tinggiMm: 356, marginMm: 10 },
  { id: 'a5', label: 'A5', lebarMm: 148, tinggiMm: 210, marginMm: 8 },
  { id: 'thermal80', label: 'Thermal 80mm', lebarMm: 80, tinggiMm: null, marginMm: 2 },
  { id: 'thermal58', label: 'Thermal 58mm', lebarMm: 58, tinggiMm: null, marginMm: 2 },
];

/** Kertas lembaran (bukan gulung) — pilihan untuk dokumen A4/F4 dsb. */
export const KERTAS_LEMBAR: readonly SpesifikasiKertas[] = DAFTAR_KERTAS.filter((k) => k.tinggiMm !== null);

export const KERTAS_BAKU: IdKertas = 'a4';

/** Tinggi nominal halaman untuk kertas gulung (driver thermal umum: Roll 80 × 297 mm). */
export const TINGGI_GULUNG_MM = 297;

/** 1 mm = 96/25.4 px CSS (definisi unit absolut CSS). */
export const PX_PER_MM = 96 / 25.4;

export function mmKePx(mm: number): number {
  return mm * PX_PER_MM;
}

export function pxKeMm(px: number): number {
  return px / PX_PER_MM;
}

export function apakahIdKertas(v: unknown): v is IdKertas {
  return typeof v === 'string' && DAFTAR_KERTAS.some((k) => k.id === v);
}

/**
 * Normalisasi id dari sumber luar (localStorage lama, props lama).
 * 'thermal' (nama lama di types/kbm.ts) → 'thermal80'; selain itu → baku.
 */
export function normalisasiIdKertas(v: unknown, baku: IdKertas = KERTAS_BAKU): IdKertas {
  if (v === 'thermal') return 'thermal80';
  return apakahIdKertas(v) ? v : baku;
}

export function apakahOrientasi(v: unknown): v is OrientasiKertas {
  return v === 'portrait' || v === 'landscape';
}

export function ambilKertas(id: IdKertas): SpesifikasiKertas {
  return DAFTAR_KERTAS.find((k) => k.id === id) ?? DAFTAR_KERTAS[0];
}

export function apakahGulung(id: IdKertas): boolean {
  return ambilKertas(id).tinggiMm === null;
}

export interface DimensiKertas {
  lebarMm: number;
  /** null = tinggi mengikuti isi (kertas gulung). */
  tinggiMm: number | null;
  marginMm: number;
}

/** Dimensi efektif setelah orientasi; kertas gulung mengabaikan orientasi. */
export function dimensiKertas(id: IdKertas, orientasi: OrientasiKertas = 'portrait'): DimensiKertas {
  const k = ambilKertas(id);
  if (k.tinggiMm === null || orientasi === 'portrait') {
    return { lebarMm: k.lebarMm, tinggiMm: k.tinggiMm, marginMm: k.marginMm };
  }
  return { lebarMm: k.tinggiMm, tinggiMm: k.lebarMm, marginMm: k.marginMm };
}

/**
 * Aturan @page siap pakai — di-inject sebagai isi <style> saat mencetak.
 * Ukuran ditulis eksplisit dalam mm (bukan nama "A4 landscape") supaya F4/Folio
 * yang tidak punya nama CSS ikut benar, dan orientasi tidak bergantung pada
 * dukungan kata kunci tiap browser.
 */
export function aturanPage(id: IdKertas, orientasi: OrientasiKertas = 'portrait', marginMm?: number): string {
  const d = dimensiKertas(id, orientasi);
  const margin = marginMm ?? d.marginMm;
  // `size` tidak menerima campuran panjang + auto (Chrome membuang aturannya).
  // Kertas gulung memakai tinggi nominal driver thermal "Roll 80 × 297 mm".
  const size = `${d.lebarMm}mm ${d.tinggiMm ?? TINGGI_GULUNG_MM}mm`;
  return `@page { size: ${size}; margin: ${margin}mm; }`;
}

/** Teks dimensi untuk bar informasi: "A4 · 210 × 297 mm · tegak". */
export function labelDimensi(id: IdKertas, orientasi: OrientasiKertas = 'portrait'): string {
  const k = ambilKertas(id);
  const d = dimensiKertas(id, orientasi);
  if (d.tinggiMm === null) return `${k.label} · lebar ${d.lebarMm} mm · gulung`;
  return `${k.label} · ${d.lebarMm} × ${d.tinggiMm} mm · ${orientasi === 'portrait' ? 'tegak' : 'mendatar'}`;
}

// ── Preferensi kertas milik perangkat (dipakai bersama semua jalur cetak) ──

export interface PilihanKertas {
  id: IdKertas;
  orientasi: OrientasiKertas;
}

export const KUNCI_KERTAS = 'tartib.kertas';

interface PenyimpananKertas {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

/** Baca preferensi; apa pun isinya, hasil selalu pilihan yang sah. */
export function bacaPilihanKertas(
  simpanan: PenyimpananKertas | null | undefined,
  baku: PilihanKertas = { id: KERTAS_BAKU, orientasi: 'portrait' },
): PilihanKertas {
  if (!simpanan) return { ...baku };
  try {
    const mentah = simpanan.getItem(KUNCI_KERTAS);
    if (!mentah) return { ...baku };
    const obj = JSON.parse(mentah) as { id?: unknown; orientasi?: unknown };
    return {
      id: normalisasiIdKertas(obj?.id, baku.id),
      orientasi: apakahOrientasi(obj?.orientasi) ? obj.orientasi : baku.orientasi,
    };
  } catch {
    return { ...baku };
  }
}

export function simpanPilihanKertas(simpanan: PenyimpananKertas | null | undefined, pilihan: PilihanKertas): void {
  if (!simpanan) return;
  try {
    simpanan.setItem(KUNCI_KERTAS, JSON.stringify({ id: pilihan.id, orientasi: pilihan.orientasi }));
  } catch {
    // Penyimpanan penuh / mode privat — preferensi tidak wajib.
  }
}

/** localStorage bila ada (aman dipanggil saat render server / test). */
export function simpananPerangkat(): PenyimpananKertas | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}
