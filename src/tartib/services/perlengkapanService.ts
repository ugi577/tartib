// Service perlengkapan (Batch D) — ceklis dihitung otomatis dari rumusQty
// tugas (A-04), bukan dari templateItem (A-02: tidak ada jalur baca
// templateItem untuk acara yang sudah dibuat — rumusQty sudah disalin ke
// tugas saat snapshot, lihat K-12). qtyHitung selalu ditulis ulang saat
// generate; qtyFinal dipertahankan untuk baris yang sudah ada (boleh
// ditimpa manual panitia) dan hanya diisi = qtyHitung saat baris baru.
import { buatId, tartibDb } from '../db/schema';
import { parseRumusQty, RumusError, type RumusKonteks } from '../lib/rumusQty';
import type { Perlengkapan, StatusPerlengkapan, Tugas } from '../types';

export class PerlengkapanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PerlengkapanError';
  }
}

export async function daftarPerlengkapan(acaraId: string): Promise<Perlengkapan[]> {
  return tartibDb.perlengkapan.where('acaraId').equals(acaraId).sortBy('nama');
}

// Fungsi murni — diuji tanpa IndexedDB. Item existing dicocokkan lewat
// `nama` (= judul tugas sumbernya) karena tartib_perlengkapan tidak
// menyimpan tugasId (lihat docs/PRD.md 5.1).
export function hitungPerlengkapan(
  tugasList: readonly Tugas[],
  existing: readonly Perlengkapan[],
  acaraId: string,
  konteks: RumusKonteks,
): Perlengkapan[] {
  const existingByNama = new Map(existing.map((p) => [p.nama, p]));
  return tugasList
    .filter((t): t is Tugas & { rumusQty: string } => !!t.rumusQty)
    .map((t) => {
      let qtyHitung: number;
      try {
        qtyHitung = parseRumusQty(t.rumusQty, konteks);
      } catch (e) {
        const pesan = e instanceof RumusError ? e.message : 'tidak diketahui';
        throw new PerlengkapanError(`Rumus qty "${t.judul}" gagal dihitung: ${pesan}`);
      }
      const sudah = existingByNama.get(t.judul);
      if (sudah) {
        return { ...sudah, qtyHitung };
      }
      const baru: Perlengkapan = {
        id: buatId(),
        acaraId,
        divisiId: t.divisiId,
        nama: t.judul,
        satuan: '',
        qtyHitung,
        qtyFinal: qtyHitung,
        status: 'BELUM',
        catatan: '',
      };
      return baru;
    });
}

// Menghitung ulang & menulis ceklis perlengkapan dari seluruh tugas acara
// yang punya rumusQty. Aman dipanggil berulang saat komponen porsi
// berubah (mis. RSVP baru masuk) — qtyFinal yang sudah ditimpa manual
// tidak tersentuh.
export async function generatePerlengkapan(acaraId: string, konteks: RumusKonteks): Promise<Perlengkapan[]> {
  const [tugasList, existing] = await Promise.all([
    tartibDb.tugas.where('acaraId').equals(acaraId).toArray(),
    daftarPerlengkapan(acaraId),
  ]);
  const hasil = hitungPerlengkapan(tugasList, existing, acaraId, konteks);
  if (hasil.length > 0) await tartibDb.perlengkapan.bulkPut(hasil);
  return hasil;
}

export interface InputUbahPerlengkapan {
  nama?: string;
  satuan?: string;
  qtyFinal?: number;
  status?: StatusPerlengkapan;
  catatan?: string;
}

export async function ubahPerlengkapan(id: string, input: InputUbahPerlengkapan): Promise<void> {
  const perubahan: Partial<Perlengkapan> = {};
  if (input.nama !== undefined) {
    const nama = input.nama.trim();
    if (!nama) throw new PerlengkapanError('Nama perlengkapan wajib diisi');
    perubahan.nama = nama;
  }
  if (input.satuan !== undefined) perubahan.satuan = input.satuan.trim();
  if (input.qtyFinal !== undefined) {
    if (!Number.isFinite(input.qtyFinal) || input.qtyFinal < 0) {
      throw new PerlengkapanError('Qty final tidak boleh negatif');
    }
    perubahan.qtyFinal = input.qtyFinal;
  }
  if (input.status !== undefined) perubahan.status = input.status;
  if (input.catatan !== undefined) perubahan.catatan = input.catatan.trim();
  const n = await tartibDb.perlengkapan.update(id, perubahan);
  if (n === 0) throw new PerlengkapanError('Perlengkapan tidak ditemukan');
}
