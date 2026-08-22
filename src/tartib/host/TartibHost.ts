import type Dexie from 'dexie';

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

export type CetakPayload =
  | { jenis: 'lembarTugas'; acaraId: string; picNama: string }
  | { jenis: 'bukuAcara'; acaraId: string }
  | { jenis: 'ikhtisarEksekusi'; acaraId: string } // laporan progres/acara — Batch T (K-13)
  | { jenis: 'eksporMarkdown'; acaraId: string }
  | { jenis: 'panduanTemplate'; templateId: string }; // panduan manual pengisian SOP — sesi 15

export interface TartibHost {
  // Instans Dexie milik host (di standalone: tartib-db; di v3: db v3).
  db: Dexie;
  getCabangList(): Promise<Cabang[]>;
  getJumlahSantri(cabangId?: string): Promise<number>;
  cariPetugas(q: string): Promise<Petugas[]>;
  cetak(payload: CetakPayload): Promise<void>;
}
