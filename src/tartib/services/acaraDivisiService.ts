// Service PIC divisi acara (Batch C) — menyimpan data PIC saja. Aturan
// A-01 (PIC wajib sebelum SIAP) ditegakkan di acaraService.setStatus,
// bukan di sini, agar pelanggaran hanya muncul lewat satu jalur.
import { tartibDb } from '../db/schema';
import type { AcaraDivisi } from '../types';

export class AcaraDivisiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AcaraDivisiError';
  }
}

export async function daftarAcaraDivisi(acaraId: string): Promise<AcaraDivisi[]> {
  return tartibDb.acaraDivisi.where('acaraId').equals(acaraId).sortBy('divisiId');
}

export async function tetapkanPic(
  acaraDivisiId: string,
  input: { picNama: string; picKontak?: string },
): Promise<void> {
  const picNama = input.picNama.trim();
  if (!picNama) throw new AcaraDivisiError('Nama PIC wajib diisi');
  const n = await tartibDb.acaraDivisi.update(acaraDivisiId, {
    picNama,
    picKontak: input.picKontak ?? '',
  });
  if (n === 0) throw new AcaraDivisiError('Divisi acara tidak ditemukan');
}

export async function kosongkanPic(acaraDivisiId: string): Promise<void> {
  const n = await tartibDb.acaraDivisi.update(acaraDivisiId, { picNama: '', picKontak: '' });
  if (n === 0) throw new AcaraDivisiError('Divisi acara tidak ditemukan');
}
