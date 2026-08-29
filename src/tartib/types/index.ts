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
  rumusQty?: string; // salinan TemplateItem.rumusQty saat snapshot (K-12); dipakai perlengkapanService
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

// SOP berdiri sendiri (Batch X): daftar tugas/amanah yang TIDAK terikat acara
// dan fase H-offset. Dua pemakaian dalam satu model:
//  - papan baku semi-paten (amanah & khidmah santri — struktur relatif tetap,
//    isi/PIC boleh berubah), dan
//  - SOP kustom buatan pengguna.
export interface Sop {
  id: string;
  judul: string;
  catatan: string;
  baku: boolean; // true = papan baku dari seed (semi-paten, tidak dapat dihapus)
  urutan: number;
  dibuatPada: string; // ISO
}

export interface SopItem {
  id: string;
  sopId: string;
  judul: string;
  picNama: string; // penanggung jawab amanah/tugas — boleh kosong
  catatan: string;
  rutin?: string; // kategori pekerjaan rutin — bebas teks: Harian/Mingguan/Bulanan/Part/Insidental (Batch Y)
  selesai: boolean;
  selesaiPada?: string; // ISO, terisi saat dicentang, hilang saat diuncentang
  urutan: number;
}

// Sub-tugas satu item (Batch Y, arahan Ahmed: "dalam satu checklist bisa
// dibuatkan sub sehingga lebih detail tugas yg diberikan, mirip seperti
// anggota dan tugasnya"): rincian di bawah amanah, tiap sub punya PIC dan
// ceklis sendiri.
export interface SopSubItem {
  id: string;
  sopId: string; // penyangga query per papan (reset, duplikat, hapus papan)
  itemId: string; // item induk
  judul: string;
  picNama: string;
  catatan: string;
  selesai: boolean;
  selesaiPada?: string;
  urutan: number;
}
