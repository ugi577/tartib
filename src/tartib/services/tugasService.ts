// Service tugas (Batch C) — perubahan status tugas di papan acara.
// Akses Dexie dari UI wajib lewat service layer (PRD §3); fungsi murni
// diuji tanpa IndexedDB.
import { tartibDb } from '../db/schema';
import type { StatusTugas, Tugas } from '../types';

export class TugasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TugasError';
  }
}

// Urutan perputaran status di papan acara; BATAL kembali ke BELUM agar
// tugas yang dibatalkan bisa dibuka lagi.
const URUTAN_STATUS_TUGAS: readonly StatusTugas[] = ['BELUM', 'JALAN', 'SELESAI', 'BATAL'];

export function statusBerikutnya(status: StatusTugas): StatusTugas {
  const idx = URUTAN_STATUS_TUGAS.indexOf(status);
  return URUTAN_STATUS_TUGAS[(idx + 1) % URUTAN_STATUS_TUGAS.length];
}

// Transisi status BELUM/JALAN/SELESAI/BATAL. Menjadi SELESAI mengisi
// selesaiPada; meninggalkan SELESAI menghapusnya. Status sama → objek
// dikembalikan apa adanya (tidak ada perubahan).
export function perubahanStatusTugas(tugas: Tugas, status: StatusTugas, pada?: string): Tugas {
  if (status === tugas.status) return tugas;
  const selesaiPada = status === 'SELESAI' ? (pada ?? new Date().toISOString()) : undefined;
  return { ...tugas, status, selesaiPada };
}

export async function ubahStatusTugas(tugasId: string, status: StatusTugas): Promise<Tugas> {
  const tugas = await tartibDb.tugas.get(tugasId);
  if (!tugas) throw new TugasError('Tugas tidak ditemukan');
  const berikutnya = perubahanStatusTugas(tugas, status);
  if (berikutnya === tugas) return tugas; // status sama, tidak menulis ulang
  await tartibDb.tugas.put(berikutnya);
  return berikutnya;
}

export async function daftarTugasAcara(acaraId: string): Promise<Tugas[]> {
  const semua = await tartibDb.tugas.where('acaraId').equals(acaraId).toArray();
  return semua.sort((a, b) => (a.faseId === b.faseId ? a.urutan - b.urutan : 0));
}
