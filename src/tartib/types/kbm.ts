// Definisi tipe data untuk Matriks Jadwal KBM & Manajemen Printer (Pilar 3 & 4)

export type HariKbm = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';

export interface SesiJam {
  ke: number;
  label: string; // mis. '07:30 - 08:15'
  istirahat?: boolean;
}

export interface EntriJadwal {
  id: string;
  hari: HariKbm;
  jamKe: number;
  kelas: string; // mis. 'VII-A' atau 'Halaqah 1'
  mapel: string; // mis. 'Tahfidz' atau 'Matematika'
  guru: string; // mis. 'Ust. Farhan' atau 'Drs. Ahmad'
  ruang?: string;
  warna?: string;
}

export interface ModelJadwalKbm {
  id: string;
  judul: string;
  tipe: '5-hari' | '6-hari' | 'tahfidz';
  deskripsi: string;
  daftarHari: HariKbm[];
  daftarJam: SesiJam[];
  daftarKelas: string[];
  entri: EntriJadwal[];
  dibuatPada: string;
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
