// Definisi tipe data untuk Matriks Jadwal KBM & Manajemen Printer (Pilar 3 & 4)

export type HariKbm = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | "Jum'at" | 'Sabtu' | 'Ahad';

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
}

export type TipePrinter = 'bluetooth' | 'usb' | 'system' | 'simulasi';
export type UkuranKertas = 'a4' | 'f4' | 'thermal';
export type OrientasiKertas = 'portrait' | 'landscape';

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
  status: 'antre' | 'mencetak' | 'selesai' | 'gagal';
  pesan?: string;
  dibuatPada: string;
  selesaiPada?: string;
}
