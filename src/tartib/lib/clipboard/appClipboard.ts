// Papan klip internal aplikasi (Salin / Potong / Tempel) — sesi 22.
//
// Sebelumnya satu slot `data: any` yang dibaca tanpa pemeriksaan bentuk oleh
// tiga komponen: klip 'kbm' bisa tertempel ke bagan sebagai jabatan, klip
// 'jabatan' bisa "ditempel sebagai sub-tugas" lalu menghapus ID yang salah.
// Kini:
//   - discriminated union bertipe — tiap tujuan tempel hanya menerima tipe yang
//     cocok (`ambilKlipTipe('sub-tugas')`), dan menu Tempel dinonaktifkan bila
//     isi klip tidak cocok;
//   - klip jabatan/sub-tugas hanya menyimpan ID — data dibaca dari DB saat
//     tempel, sehingga tidak ada snapshot basi;
//   - reaktif (subscribe / hook useKlip) agar kartu yang "dipotong" bisa diberi
//     tanda dan pil "Klip: …" bisa tampil;
//   - TIDAK menulis ke clipboard sistem (menimpa clipboard pengguna diam-diam
//     dan melempar NotAllowedError di WebView).

import type { EntriJadwal } from '../../types/kbm';

interface KlipDasar {
  /** true = Potong (tempel = pindah, sumber dihapus); false = Salin. */
  isCut: boolean;
  /** ISO — kapan klip diisi. */
  waktu: string;
}

export type ItemKlip =
  | ({ tipe: 'jabatan'; id: string; sopId: string; judul: string } & KlipDasar)
  | ({ tipe: 'sub-tugas'; id: string; itemId: string; sopId: string; judul: string } & KlipDasar)
  | ({ tipe: 'kbm'; entri: EntriJadwal } & KlipDasar);

export type TipeKlip = ItemKlip['tipe'];

export type InputKlip =
  | { tipe: 'jabatan'; id: string; sopId: string; judul: string; isCut?: boolean }
  | { tipe: 'sub-tugas'; id: string; itemId: string; sopId: string; judul: string; isCut?: boolean }
  | { tipe: 'kbm'; entri: EntriJadwal; isCut?: boolean };

let klipAktif: ItemKlip | null = null;
const pendengar = new Set<() => void>();

function siarkan(): void {
  pendengar.forEach((fn) => fn());
}

/** Isi klip (Salin bila isCut=false, Potong bila true). */
export function simpanKlip(input: InputKlip): ItemKlip {
  const dasar: KlipDasar = { isCut: input.isCut ?? false, waktu: new Date().toISOString() };
  let klip: ItemKlip;
  switch (input.tipe) {
    case 'jabatan':
      klip = { tipe: 'jabatan', id: input.id, sopId: input.sopId, judul: input.judul, ...dasar };
      break;
    case 'sub-tugas':
      klip = { tipe: 'sub-tugas', id: input.id, itemId: input.itemId, sopId: input.sopId, judul: input.judul, ...dasar };
      break;
    case 'kbm':
      klip = { tipe: 'kbm', entri: { ...input.entri }, ...dasar };
      break;
  }
  klipAktif = klip;
  siarkan();
  return klip;
}

export function ambilKlip(): ItemKlip | null {
  return klipAktif;
}

/** Klip hanya bila tipenya cocok — dipakai tiap tujuan tempel. */
export function ambilKlipTipe<T extends TipeKlip>(tipe: T): Extract<ItemKlip, { tipe: T }> | null {
  if (!klipAktif || klipAktif.tipe !== tipe) return null;
  return klipAktif as Extract<ItemKlip, { tipe: T }>;
}

export function bersihkanKlip(): void {
  if (klipAktif === null) return;
  klipAktif = null;
  siarkan();
}

/** Berlangganan perubahan klip (dipakai hook useKlip lewat useSyncExternalStore). */
export function subscribeKlip(fn: () => void): () => void {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
}

/** Teks singkat untuk pil "Klip: …" dan pesan umpan balik. */
export function labelKlip(k: ItemKlip): string {
  const aksi = k.isCut ? 'dipotong' : 'disalin';
  switch (k.tipe) {
    case 'jabatan':
      return `Jabatan "${k.judul}" ${aksi}`;
    case 'sub-tugas':
      return `Tugas "${k.judul}" ${aksi}`;
    case 'kbm':
      return `Sesi "${k.entri.mapel}" ${aksi}`;
  }
}
