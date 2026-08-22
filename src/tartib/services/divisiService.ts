// Service divisi (Batch B) — divisi baku (13) ditambah user-defined (baku=false).
import { buatId, tartibDb } from '../db/schema';
import { urutanBerikutnya } from '../lib/urutan';
import type { Divisi } from '../types';

export class DivisiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DivisiError';
  }
}

export async function daftarDivisi(): Promise<Divisi[]> {
  return tartibDb.divisi.orderBy('urutan').toArray();
}

async function pastikanNamaUnik(idDiabaikan: string, nama: string): Promise<void> {
  const semua = await daftarDivisi();
  if (semua.some((d) => d.id !== idDiabaikan && d.nama.toLowerCase() === nama.toLowerCase())) {
    throw new DivisiError(`Divisi "${nama}" sudah ada`);
  }
}

export async function tambahDivisi(input: { nama: string; tanggungJawab?: string }): Promise<Divisi> {
  const nama = input.nama.trim();
  if (!nama) throw new DivisiError('Nama divisi wajib diisi');
  await pastikanNamaUnik('', nama);
  const semua = await daftarDivisi();
  const divisi: Divisi = {
    id: buatId(),
    nama,
    tanggungJawab: input.tanggungJawab ?? '',
    urutan: urutanBerikutnya(semua),
    baku: false,
  };
  await tartibDb.divisi.add(divisi);
  return divisi;
}

export async function ubahDivisi(id: string, input: { nama: string; tanggungJawab?: string }): Promise<void> {
  const nama = input.nama.trim();
  if (!nama) throw new DivisiError('Nama divisi wajib diisi');
  await pastikanNamaUnik(id, nama);
  const n = await tartibDb.divisi.update(id, { nama, tanggungJawab: input.tanggungJawab ?? '' });
  if (n === 0) throw new DivisiError('Divisi tidak ditemukan');
}
