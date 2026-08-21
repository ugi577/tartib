// Tipe domain Tartib — spesifikasi lengkap di docs/PRD.md bagian 5.1 & 5.2.
// Semua id bertipe string (dibuat via buatId() di db/schema.ts).

export interface JenisAcara {
  id: string;
  nama: string;
  deskripsi: string;
  aktif: boolean;
}

export interface Template {
  id: string;
  jenisAcaraId: string;
  versi: number;
  nama: string;
  catatan: string;
  dibuatPada: string; // ISO
  aktif: boolean;
}

export interface Fase {
  id: string;
  templateId: string;
  urutan: number;
  label: string;
  offsetHari: number; // relatif terhadap hari-H, mis. -30, -7, 0, +1
}

export interface TemplateItem {
  id: string;
  templateId: string;
  faseId: string;
  divisiId: string;
  judul: string;
  catatan: string;
  wajib: boolean;
  rumusQty?: string; // ekspresi terbatas, lihat lib/rumusQty.ts (A-04)
  urutan: number;
}

export interface Divisi {
  id: string;
  nama: string;
  tanggungJawab: string;
  urutan: number;
  baku: boolean; // true = salah satu dari 13 divisi baku (BRIEF Bagian 8)
}

export type StatusAcara = 'DRAF' | 'SIAP' | 'BERJALAN' | 'SELESAI' | 'DIEVALUASI';
export type StatusTugas = 'BELUM' | 'JALAN' | 'SELESAI' | 'BATAL';
export type StatusRsvp = 'BELUM' | 'HADIR' | 'TIDAK_HADIR';
export type StatusPerlengkapan = 'BELUM' | 'SELESAI';

export interface Acara {
  id: string;
  nama: string;
  jenisAcaraId: string;
  templateId: string;
  templateVersi: number; // snapshot versi template saat acara dibuat (K-03)
  tanggal: string; // ISO YYYY-MM-DD
  jamMulai: string; // HH:mm
  jamSelesai: string; // HH:mm
  lokasi: string;
  cabangId?: string; // dari host (integrasi v3); kosong di standalone
  status: StatusAcara;
  dibuatPada: string; // ISO
}

export interface AcaraDivisi {
  id: string;
  acaraId: string;
  divisiId: string;
  picNama: string; // boleh kosong; wajib diisi sebelum acara SIAP (A-01)
  picKontak: string;
  catatan: string;
}

export interface Tugas {
  id: string;
  acaraId: string;
  faseId: string;
  divisiId: string;
  judul: string;
  catatan: string;
  wajib: boolean;
  status: StatusTugas;
  selesaiPada?: string; // ISO, terisi saat status jadi SELESAI
  urutan: number;
}

export interface KelompokTamu {
  id: string;
  acaraId: string;
  nama: string;
  targetUndangan: number; // jumlah rombongan yang diundang
  catatan: string;
}

export interface Rsvp {
  id: string;
  acaraId: string;
  kelompokId: string;
  namaTamu: string;
  kontak: string;
  status: StatusRsvp;
  jumlahRombongan: number; // minimal 1
  catatan: string;
}

export interface Perlengkapan {
  id: string;
  acaraId: string;
  divisiId: string;
  nama: string;
  satuan: string;
  qtyHitung: number; // dari rumusQty / kalkulator porsi
  qtyFinal: number; // hasil konfirmasi panitia
  status: StatusPerlengkapan;
  catatan: string;
}

export interface Evaluasi {
  id: string;
  acaraId: string;
  divisiId: string;
  berjalanBaik: string;
  kurang: string;
  usulan: string;
  sudahDipromosikan: boolean; // A-03: promosi evaluasi membuat versi template baru
}
