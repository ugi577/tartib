// Definisi tipe data untuk Matriks Jadwal KBM & Manajemen Printer (Pilar 3 & 4)

import type { IdKertas, OrientasiKertas as OrientasiKertasBersama } from '../lib/cetak/kertas';

// Sesi 22: satu bentuk kanonik per hari ('Jumat', 'Ahad'). Ejaan lain
// ("Jum'at", "Minggu") dinormalisasi saat dibaca oleh lib/kbm/hari.ts, dan
// tampilan memakai labelHari() ("Jum'at").
export type HariKbm = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';

export interface SesiJam {
  ke: number;
  label: string; // mis. '07:30 - 08:15' atau '03.00 - 03.45'
  nomorSesi?: number | null; // Nomor sesi resmi (mis. 1 sampai 8)
  istirahat?: boolean;
  warna?: string;
}

export interface EntriJadwal {
  id: string;
  hari: HariKbm;
  jamKe: number;
  kelas: string; // mis. 'VII-A' atau 'Halaqah 1' atau 'Semua Santri'
  mapel: string; // mis. 'Tahfidz' atau 'Qiyamullail berjamaah'
  guru?: string; // mis. 'Ust. Farhan' atau 'Musyrif'
  ruang?: string;
  warna?: string; // warna sorotan sel: 'kuning' | 'hijau' | 'biru' | 'oranye' | 'abu'
}

export interface ModelJadwalKbm {
  id: string;
  judul: string;
  tahunAjaran?: string; // mis. 'TAHUN AJARAN 2026-2027'
  subJudul?: string; // mis. 'Hari/ Mata Pelajaran'
  tipe: '5-hari' | '6-hari' | 'tahfidz' | 'pesantren' | 'kustom';
  deskripsi: string;
  daftarHari: HariKbm[];
  daftarJam: SesiJam[];
  daftarKelas: string[];
  entri: EntriJadwal[];
  dibuatPada: string;
  diubahPada?: string;
  kustom?: boolean;
  /** Template kustom: id preset bawaan asalnya (untuk "Reset ke bawaan"). */
  asalId?: string;
}

export type TipePrinter = 'bluetooth' | 'usb' | 'system' | 'simulasi';
// Sesi 22: ukuran kertas kini satu sumber di lib/cetak/kertas.ts (A4, F4
// 215×330, Letter, Legal, A5, Thermal 80/58). Nama lama 'thermal' dinormalisasi
// ke 'thermal80' oleh normalisasiIdKertas() saat dibaca dari penyimpanan lama.
export type UkuranKertas = IdKertas;
export type OrientasiKertas = OrientasiKertasBersama;

export interface PerangkatPrinter {
  id: string;
  nama: string;
  tipe: TipePrinter;
  terhubung: boolean;
  lebarKertasBawaan: UkuranKertas;
  baterai?: number; // 0-100%
  kertasHabis?: boolean;
  terakhirTerhubung?: string;
}

export interface ItemAntreanCetak {
  id: string;
  judulDokumen: string;
  jenisDokumen: 'struktur' | 'sop' | 'kbm' | 'tiket-amanah';
  ukuranKertas: UkuranKertas;
  orientasi: OrientasiKertas;
  status: 'antre' | 'mencetak' | 'selesai' | 'gagal' | 'dibatalkan'; // 'dibatalkan' = dialog cetak ditutup cepat (sesi 22)
  pesan?: string;
  dibuatPada: string;
  selesaiPada?: string;
}
