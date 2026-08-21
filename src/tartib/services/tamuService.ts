// Service tamu & RSVP (Batch D) — kelompok tamu per acara, RSVP dengan
// jumlah rombongan (BRIEF §5.4), rekap untuk panel porsi. Akses Dexie dari
// UI wajib lewat service layer (PRD §3); fungsi rekap murni diuji tanpa
// IndexedDB.
import { buatId, tartibDb } from '../db/schema';
import type { KelompokTamu, Rsvp, StatusRsvp } from '../types';

export class TamuError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TamuError';
  }
}

// ===== Kelompok tamu =====

export async function daftarKelompokTamu(acaraId: string): Promise<KelompokTamu[]> {
  return tartibDb.kelompokTamu.where('acaraId').equals(acaraId).sortBy('nama');
}

export async function tambahKelompok(
  acaraId: string,
  input: { nama: string; targetUndangan: number; catatan?: string },
): Promise<KelompokTamu> {
  const nama = input.nama.trim();
  if (!nama) throw new TamuError('Nama kelompok wajib diisi');
  if (!Number.isFinite(input.targetUndangan) || input.targetUndangan < 0) {
    throw new TamuError('Target undangan tidak boleh negatif');
  }
  const kelompok: KelompokTamu = {
    id: buatId(),
    acaraId,
    nama,
    targetUndangan: Math.trunc(input.targetUndangan),
    catatan: input.catatan?.trim() ?? '',
  };
  await tartibDb.kelompokTamu.add(kelompok);
  return kelompok;
}

export async function ubahKelompok(
  id: string,
  input: { nama: string; targetUndangan: number; catatan?: string },
): Promise<void> {
  const nama = input.nama.trim();
  if (!nama) throw new TamuError('Nama kelompok wajib diisi');
  if (!Number.isFinite(input.targetUndangan) || input.targetUndangan < 0) {
    throw new TamuError('Target undangan tidak boleh negatif');
  }
  const n = await tartibDb.kelompokTamu.update(id, {
    nama,
    targetUndangan: Math.trunc(input.targetUndangan),
    catatan: input.catatan?.trim() ?? '',
  });
  if (n === 0) throw new TamuError('Kelompok tamu tidak ditemukan');
}

// Hapus kelompok ikut menghapus RSVP di bawahnya — pola sama seperti
// hapus fase ikut menghapus item template (Batch B).
export async function hapusKelompok(id: string): Promise<void> {
  await tartibDb.transaction('rw', tartibDb.kelompokTamu, tartibDb.rsvp, async () => {
    await tartibDb.rsvp.where('kelompokId').equals(id).delete();
    await tartibDb.kelompokTamu.delete(id);
  });
}

// ===== RSVP =====

export async function daftarRsvpKelompok(kelompokId: string): Promise<Rsvp[]> {
  return tartibDb.rsvp.where('kelompokId').equals(kelompokId).sortBy('namaTamu');
}

export interface InputRsvp {
  namaTamu: string;
  kontak?: string;
  status: StatusRsvp;
  jumlahRombongan: number;
  catatan?: string;
}

function validasiInputRsvp(input: InputRsvp) {
  if (!input.namaTamu.trim()) throw new TamuError('Nama tamu wajib diisi');
  if (!Number.isFinite(input.jumlahRombongan) || input.jumlahRombongan < 1) {
    throw new TamuError('Jumlah rombongan minimal 1');
  }
}

export async function catatRsvp(acaraId: string, kelompokId: string, input: InputRsvp): Promise<Rsvp> {
  validasiInputRsvp(input);
  const rsvp: Rsvp = {
    id: buatId(),
    acaraId,
    kelompokId,
    namaTamu: input.namaTamu.trim(),
    kontak: input.kontak?.trim() ?? '',
    status: input.status,
    jumlahRombongan: Math.trunc(input.jumlahRombongan),
    catatan: input.catatan?.trim() ?? '',
  };
  await tartibDb.rsvp.add(rsvp);
  return rsvp;
}

export async function ubahRsvp(id: string, input: InputRsvp): Promise<void> {
  validasiInputRsvp(input);
  const n = await tartibDb.rsvp.update(id, {
    namaTamu: input.namaTamu.trim(),
    kontak: input.kontak?.trim() ?? '',
    status: input.status,
    jumlahRombongan: Math.trunc(input.jumlahRombongan),
    catatan: input.catatan?.trim() ?? '',
  });
  if (n === 0) throw new TamuError('RSVP tidak ditemukan');
}

export async function hapusRsvp(id: string): Promise<void> {
  await tartibDb.rsvp.delete(id);
}

// ===== Rekap (panel tamu & porsi) =====

export interface RekapKelompok {
  kelompok: KelompokTamu;
  diundang: number; // targetUndangan
  jumlahRsvp: number; // baris RSVP tercatat, semua status
  terkonfirmasi: number; // status HADIR
  totalRombongan: number; // jumlah rombongan, status HADIR saja
}

// Fungsi murni — diuji tanpa IndexedDB.
export function hitungRekapKelompok(kelompok: readonly KelompokTamu[], rsvp: readonly Rsvp[]): RekapKelompok[] {
  return kelompok.map((k) => {
    const milikKelompok = rsvp.filter((r) => r.kelompokId === k.id);
    const hadir = milikKelompok.filter((r) => r.status === 'HADIR');
    return {
      kelompok: k,
      diundang: k.targetUndangan,
      jumlahRsvp: milikKelompok.length,
      terkonfirmasi: hadir.length,
      totalRombongan: hadir.reduce((total, r) => total + r.jumlahRombongan, 0),
    };
  });
}

export async function rekapKelompok(acaraId: string): Promise<RekapKelompok[]> {
  const [kelompok, rsvp] = await Promise.all([
    daftarKelompokTamu(acaraId),
    tartibDb.rsvp.where('acaraId').equals(acaraId).toArray(),
  ]);
  return hitungRekapKelompok(kelompok, rsvp);
}

// Total rombongan terkonfirmasi hadir di seluruh acara — variabel `rsvp`
// pada kalkulator porsi (PRD §5.4) dan konteks rumusQty (A-04).
export function totalRombonganHadir(rekap: readonly RekapKelompok[]): number {
  return rekap.reduce((total, r) => total + r.totalRombongan, 0);
}
