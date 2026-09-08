import type Dexie from 'dexie';
import type { IdKertas, OrientasiKertas } from '../lib/cetak/kertas';

// Satu-satunya batas integrasi dengan luar (K-04): modul di luar src/tartib
// hanya boleh memakai TartibHost — tidak boleh mengimpor tabel atau service.
// Spesifikasi: docs/PRD.md bagian 5.5.

export interface Cabang {
  id: string;
  nama: string;
}

export interface Petugas {
  id: string;
  nama: string;
  kontak?: string;
}

/** Dokumen yang bisa ditampilkan di Kanvas Cetak (sesi 22). */
export type DokumenKanvas = 'struktur' | 'kbm' | 'tiket';

export type CetakPayload =
  | { jenis: 'lembarTugas'; acaraId: string; picNama: string }
  | { jenis: 'bukuAcara'; acaraId: string }
  | { jenis: 'ikhtisarEksekusi'; acaraId: string } // laporan progres/acara — Batch T (K-13)
  | { jenis: 'eksporMarkdown'; acaraId: string }
  | { jenis: 'panduanTemplate'; templateId: string } // panduan manual pengisian SOP — sesi 15
  | { jenis: 'papanSop'; sopId: string } // ceklis amanah/SOP berdiri sendiri — Batch X
  // Lembar Kanvas Cetak (sesi 22): host memasang @page sesuai kertas &
  // orientasi, menyembunyikan kerangka layar, lalu mencetak #print-ready-sheet.
  | { jenis: 'kanvas'; dokumen: DokumenKanvas; judul: string; kertas: IdKertas; orientasi: OrientasiKertas };

export interface TartibHost {
  // Instans Dexie milik host (di standalone: tartib-db; di v3: db v3).
  db: Dexie;
  getCabangList(): Promise<Cabang[]>;
  getJumlahSantri(cabangId?: string): Promise<number>;
  cariPetugas(q: string): Promise<Petugas[]>;
  cetak(payload: CetakPayload): Promise<void>;
}
