// Service SOP (Batch X) — papan baku semi-paten (amanah & khidmah santri)
// dan SOP kustom buatan pengguna. Satu-satunya jalur baca/tulis data SOP
// dari UI (PRD §3 pola wajib); fungsi murni diuji tanpa IndexedDB.
import { buatId, tartibDb } from '../db/schema';
import { urutanBerikutnya } from '../lib/urutan';
import type { Sop, SopItem } from '../types';

export class SopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SopError';
  }
}

function wajibIsi(nilai: string, label: string): string {
  const bersih = nilai.trim();
  if (!bersih) throw new SopError(`${label} wajib diisi`);
  return bersih;
}

// ===== Fungsi murni (diuji di sopService.test.ts) =====

export interface InputSop {
  judul: string;
  catatan?: string;
}

export interface InputItemSop {
  judul: string;
  picNama?: string;
  catatan?: string;
}

/** Bersihkan & validasi input SOP — judul wajib. */
export function inputSopSah(input: InputSop): { judul: string; catatan: string } {
  return { judul: wajibIsi(input.judul, 'Judul SOP'), catatan: input.catatan?.trim() ?? '' };
}

/** Bersihkan & validasi input item — judul wajib, PIC & catatan boleh kosong. */
export function inputItemSopSah(input: InputItemSop): { judul: string; picNama: string; catatan: string } {
  return {
    judul: wajibIsi(input.judul, 'Isi amanah/tugas'),
    picNama: input.picNama?.trim() ?? '',
    catatan: input.catatan?.trim() ?? '',
  };
}

export interface IkhtisarCeklis {
  total: number;
  selesai: number;
  persen: number; // 0..100 dibulatkan; papan kosong = 0
}

/** Progres ceklis sebuah papan — dipakai bar progres di layar & kartu daftar. */
export function ikhtisarCeklis(items: readonly { selesai: boolean }[]): IkhtisarCeklis {
  const total = items.length;
  const selesai = items.filter((i) => i.selesai).length;
  return { total, selesai, persen: total === 0 ? 0 : Math.round((selesai / total) * 100) };
}

/** Centang item: masuk SELESAI mengisi selesaiPada, keluar menghapusnya (pola perubahanStatusTugas). */
export function perubahanCeklis(item: SopItem, selesai: boolean, pada?: string): SopItem {
  if (selesai === item.selesai) return item;
  return { ...item, selesai, selesaiPada: selesai ? (pada ?? new Date().toISOString()) : undefined };
}

/** Salinan SOP: judul "(Salinan)", PIC & urutan ikut, ceklis DIRESET agar salinan mulai bersih. */
export function salinanSop(sumber: Sop, items: readonly SopItem[], urutanBaru: number): { sop: Sop; item: SopItem[] } {
  const sop: Sop = {
    ...sumber,
    id: buatId(),
    judul: `${sumber.judul} (Salinan)`,
    baku: false, // salinan papan baku menjadi SOP kustom biasa
    urutan: urutanBaru,
    dibuatPada: new Date().toISOString(),
  };
  const item = items.map((i) => ({
    ...i,
    id: buatId(),
    sopId: sop.id,
    selesai: false,
    selesaiPada: undefined,
  }));
  return { sop, item };
}

// ===== Akses data =====

export async function daftarSop(opsi: { baku?: boolean } = {}): Promise<Sop[]> {
  const semua = await tartibDb.sop.orderBy('urutan').toArray();
  return opsi.baku === undefined ? semua : semua.filter((s) => s.baku === opsi.baku);
}

export async function ambilSop(id: string): Promise<Sop> {
  const sop = await tartibDb.sop.get(id);
  if (!sop) throw new SopError('SOP tidak ditemukan');
  return sop;
}

export async function daftarItemSop(sopId: string): Promise<SopItem[]> {
  return tartibDb.sopItem.where('sopId').equals(sopId).sortBy('urutan');
}

export async function tambahSop(input: InputSop): Promise<Sop> {
  const isi = inputSopSah(input);
  const sop: Sop = {
    id: buatId(),
    ...isi,
    baku: false,
    urutan: urutanBerikutnya(await daftarSop()),
    dibuatPada: new Date().toISOString(),
  };
  await tartibDb.sop.add(sop);
  return sop;
}

export async function ubahSop(id: string, input: InputSop): Promise<void> {
  const isi = inputSopSah(input);
  const n = await tartibDb.sop.update(id, isi);
  if (n === 0) throw new SopError('SOP tidak ditemukan');
}

export async function hapusSop(id: string): Promise<void> {
  const sop = await ambilSop(id);
  // Papan baku semi-paten tidak boleh terhapus sekali jalan (K-23):
  // strukturnya relatif tetap, isinya saja yang boleh diubah.
  if (sop.baku) throw new SopError('Papan baku tidak dapat dihapus — ubah atau hapus isinya saja.');
  await tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, async () => {
    await tartibDb.sopItem.where('sopId').equals(id).delete();
    await tartibDb.sop.delete(id);
  });
}

export async function duplikatSop(id: string): Promise<Sop> {
  const sumber = await ambilSop(id);
  const [items, semua] = await Promise.all([daftarItemSop(id), daftarSop()]);
  const { sop, item } = salinanSop(sumber, items, urutanBerikutnya(semua));
  await tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, async () => {
    await tartibDb.sop.add(sop);
    if (item.length > 0) await tartibDb.sopItem.bulkAdd(item);
  });
  return sop;
}

// ===== Mutasi item =====

export async function tambahItemSop(sopId: string, input: InputItemSop): Promise<SopItem> {
  await ambilSop(sopId);
  const isi = inputItemSopSah(input);
  const item: SopItem = {
    id: buatId(),
    sopId,
    ...isi,
    selesai: false,
    urutan: urutanBerikutnya(await daftarItemSop(sopId)),
  };
  await tartibDb.sopItem.add(item);
  return item;
}

export async function ubahItemSop(itemId: string, input: InputItemSop): Promise<void> {
  const lama = await tartibDb.sopItem.get(itemId);
  if (!lama) throw new SopError('Item tidak ditemukan');
  const isi = inputItemSopSah(input);
  const n = await tartibDb.sopItem.update(itemId, isi);
  if (n === 0) throw new SopError('Item tidak ditemukan');
}

export async function hapusItemSop(itemId: string): Promise<void> {
  const item = await tartibDb.sopItem.get(itemId);
  if (!item) throw new SopError('Item tidak ditemukan');
  await tartibDb.sopItem.delete(itemId);
}

export async function pindahItemSop(itemId: string, arah: 'atas' | 'bawah'): Promise<void> {
  const item = await tartibDb.sopItem.get(itemId);
  if (!item) throw new SopError('Item tidak ditemukan');
  const items = await daftarItemSop(item.sopId);
  const i = items.findIndex((x) => x.id === itemId);
  const j = arah === 'atas' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= items.length) return; // sudah di tepi
  const tetangga = items[j];
  await tartibDb.transaction('rw', tartibDb.sopItem, async () => {
    await tartibDb.sopItem.update(item.id, { urutan: tetangga.urutan });
    await tartibDb.sopItem.update(tetangga.id, { urutan: item.urutan });
  });
}

/** Centang / uncentang satu item (mudah diceklist — arahan Ahmed Batch X). */
export async function tandaiCeklis(itemId: string, selesai: boolean): Promise<SopItem> {
  const item = await tartibDb.sopItem.get(itemId);
  if (!item) throw new SopError('Item tidak ditemukan');
  const berikutnya = perubahanCeklis(item, selesai);
  if (berikutnya === item) return item; // keadaan sama, tidak menulis ulang
  await tartibDb.sopItem.put(berikutnya);
  return berikutnya;
}

/** Kosongkan seluruh centang satu papan — dipakai tombol "Reset Ceklis" harian. */
export async function resetCeklis(sopId: string): Promise<number> {
  const items = (await daftarItemSop(sopId)).filter((i) => i.selesai);
  if (items.length === 0) return 0;
  await tartibDb.transaction('rw', tartibDb.sopItem, async () => {
    await Promise.all(items.map((i) => tartibDb.sopItem.put({ ...i, selesai: false, selesaiPada: undefined })));
  });
  return items.length;
}
