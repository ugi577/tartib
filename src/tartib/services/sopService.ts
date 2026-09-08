// Service SOP (Batch X) — papan baku semi-paten (amanah & khidmah santri)
// dan SOP kustom buatan pengguna. Satu-satunya jalur baca/tulis data SOP
// dari UI (PRD §3 pola wajib); fungsi murni diuji tanpa IndexedDB.
// Batch Y: sub-tugas di bawah tiap item, kategori rutin, dan impor papan.
// Sesi 22: salin/potong/tempel & duplikat item/sub-tugas dipindah dari UI ke
// sini sebagai operasi TRANSAKSIONAL (dulu UI merangkai tambah + hapus tanpa
// transaksi: salinan jadi tapi sumber gagal dihapus, ceklis hilang, sub dari
// snapshot basi). Potong→Tempel kini benar-benar MEMINDAHKAN baris (update
// sopId/itemId), bukan membuat baris baru bernama "(Salinan)".
import { buatId, tartibDb } from '../db/schema';
import { urutanBerikutnya } from '../lib/urutan';
import type { Sop, SopItem, SopSubItem } from '../types';

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
  rutin?: string;
}

export interface InputSubItemSop {
  judul: string;
  picNama?: string;
  catatan?: string;
}

/** Bersihkan & validasi input SOP — judul wajib. */
export function inputSopSah(input: InputSop): { judul: string; catatan: string } {
  return { judul: wajibIsi(input.judul, 'Judul SOP'), catatan: input.catatan?.trim() ?? '' };
}

/** Bersihkan & validasi input item — judul wajib, PIC/catatan/rutin boleh kosong. */
export function inputItemSopSah(input: InputItemSop): {
  judul: string;
  picNama: string;
  catatan: string;
  rutin: string;
} {
  return {
    judul: wajibIsi(input.judul, 'Isi amanah/tugas'),
    picNama: input.picNama?.trim() ?? '',
    catatan: input.catatan?.trim() ?? '',
    rutin: input.rutin?.trim() ?? '',
  };
}

/** Bersihkan & validasi input sub-tugas — judul wajib, PIC/catatan boleh kosong. */
export function inputSubItemSopSah(input: InputSubItemSop): { judul: string; picNama: string; catatan: string } {
  return {
    judul: wajibIsi(input.judul, 'Isi sub-tugas'),
    picNama: input.picNama?.trim() ?? '',
    catatan: input.catatan?.trim() ?? '',
  };
}

export interface IkhtisarCeklis {
  total: number;
  selesai: number;
  persen: number; // 0..100 dibulatkan; papan kosong = 0
}

/** Progres ceklis dari sekumpulan baris tercentang (item + sub-tugas). */
export function ikhtisarCeklis(items: readonly { selesai: boolean }[]): IkhtisarCeklis {
  const total = items.length;
  const selesai = items.filter((i) => i.selesai).length;
  return { total, selesai, persen: total === 0 ? 0 : Math.round((selesai / total) * 100) };
}

/** Centang baris: masuk selesai mengisi selesaiPada, keluar menghapusnya (pola perubahanStatusTugas). */
export function perubahanCeklis<T extends { selesai: boolean; selesaiPada?: string }>(
  baris: T,
  selesai: boolean,
  pada?: string,
): T {
  if (selesai === baris.selesai) return baris;
  return { ...baris, selesai, selesaiPada: selesai ? (pada ?? new Date().toISOString()) : undefined };
}

export interface StrukturSalinanSop {
  sop: Sop;
  item: SopItem[];
  subItem: SopSubItem[];
}

/** Salinan papan: judul "(Salinan)", PIC/rutin/sub ikut, ceklis DIRESET agar salinan mulai bersih. */
export function salinanSop(
  sumber: Sop,
  items: readonly SopItem[],
  subItems: readonly SopSubItem[],
  urutanBaru: number,
): StrukturSalinanSop {
  const sop: Sop = {
    ...sumber,
    id: buatId(),
    judul: `${sumber.judul} (Salinan)`,
    baku: false, // salinan papan baku menjadi SOP kustom biasa
    urutan: urutanBaru,
    dibuatPada: new Date().toISOString(),
  };
  const idItemBaru = new Map<string, string>();
  const item = items.map((i) => {
    const id = buatId();
    idItemBaru.set(i.id, id);
    return { ...i, id, sopId: sop.id, selesai: false, selesaiPada: undefined };
  });
  const subItem = subItems.map((s) => {
    const itemId = idItemBaru.get(s.itemId);
    if (!itemId) {
      throw new SopError(`Sub-tugas "${s.judul}" merujuk item yang tidak ikut disalin (${s.itemId})`);
    }
    return { ...s, id: buatId(), sopId: sop.id, itemId, selesai: false, selesaiPada: undefined };
  });
  return { sop, item, subItem };
}

// ===== Salin / pindah item & sub-tugas (sesi 22) — fungsi murni =====

export const AKHIRAN_SALINAN = ' (Salinan)';

/**
 * Akhiran judul untuk salinan: hanya bila sumber dan tujuan berada di wadah
 * yang sama (papan yang sama untuk item, jabatan yang sama untuk sub-tugas) —
 * di situlah dua nama identik membingungkan. Salinan ke papan/jabatan lain
 * memakai judul apa adanya. `akhiran` eksplisit (termasuk '') menang.
 */
export function akhiranSalinan(wadahAsal: string, wadahTujuan: string, akhiran?: string): string {
  if (akhiran !== undefined) return akhiran;
  return wadahAsal === wadahTujuan ? AKHIRAN_SALINAN : '';
}

export interface PenyisipanUrutan {
  /** Urutan untuk baris baru: tepat setelah baris acuan. */
  urutanBaru: number;
  /** Baris lama yang harus digeser (id → urutan baru) agar tidak bertabrakan. */
  geser: Array<{ id: string; urutan: number }>;
}

/**
 * Sisipkan baris baru TEPAT setelah `setelahId` (duplikat item muncul di bawah
 * aslinya, bukan di dasar daftar). Baris sesudah acuan dinomori ulang rapat
 * (acuan+2, acuan+3, …) sehingga nomor kembar yang mungkin ada di data lama
 * ikut terurai. Daftar boleh tidak terurut.
 */
export function sisipkanUrutan(daftar: readonly { id: string; urutan: number }[], setelahId: string): PenyisipanUrutan {
  const terurut = [...daftar].sort((a, b) => a.urutan - b.urutan);
  const i = terurut.findIndex((b) => b.id === setelahId);
  if (i < 0) throw new SopError('Baris acuan penyisipan tidak ditemukan');
  const dasar = terurut[i].urutan;
  const geser: Array<{ id: string; urutan: number }> = [];
  terurut.slice(i + 1).forEach((b, k) => {
    const urutan = dasar + 2 + k;
    if (urutan !== b.urutan) geser.push({ id: b.id, urutan });
  });
  return { urutanBaru: dasar + 1, geser };
}

export interface OpsiSalinanItem {
  sopId: string;
  urutan: number;
  /** undefined = rutin sumber dipertahankan; '' = dikosongkan. */
  rutin?: string;
  /** '' = judul apa adanya. */
  akhiran?: string;
}

export interface StrukturSalinanItem {
  item: SopItem;
  subItem: SopSubItem[];
}

/** Salinan satu item + sub-tugasnya: id baru, ceklis DIRESET, urutan sub asli dipertahankan. */
export function salinanItem(
  sumber: SopItem,
  subs: readonly SopSubItem[],
  opsi: OpsiSalinanItem,
): StrukturSalinanItem {
  const item: SopItem = {
    ...sumber,
    id: buatId(),
    sopId: opsi.sopId,
    judul: `${sumber.judul}${opsi.akhiran ?? AKHIRAN_SALINAN}`,
    rutin: opsi.rutin === undefined ? sumber.rutin : opsi.rutin || undefined,
    selesai: false,
    selesaiPada: undefined,
    urutan: opsi.urutan,
  };
  const subItem = subs.map((s) => {
    if (s.itemId !== sumber.id) {
      throw new SopError(`Sub-tugas "${s.judul}" bukan milik item "${sumber.judul}"`);
    }
    return { ...s, id: buatId(), sopId: item.sopId, itemId: item.id, selesai: false, selesaiPada: undefined };
  });
  return { item, subItem };
}

export interface OpsiSalinanSub {
  itemId: string;
  sopId: string;
  urutan: number;
  /** '' = judul apa adanya. */
  akhiran?: string;
}

/** Salinan satu sub-tugas ke jabatan tujuan: id baru, ceklis direset. */
export function salinanSubItem(sumber: SopSubItem, opsi: OpsiSalinanSub): SopSubItem {
  return {
    ...sumber,
    id: buatId(),
    sopId: opsi.sopId,
    itemId: opsi.itemId,
    judul: `${sumber.judul}${opsi.akhiran ?? AKHIRAN_SALINAN}`,
    selesai: false,
    selesaiPada: undefined,
    urutan: opsi.urutan,
  };
}

// ===== Impor papan dari dokumen (Batch Y) =====

export interface InputImporItemSop {
  judul: string;
  picNama?: string;
  catatan?: string;
  rutin?: string;
  sub?: InputSubItemSop[];
}

export interface InputImporSop {
  judul: string;
  catatan?: string;
  items: InputImporItemSop[];
}

export interface StrukturImporSop {
  sop: Sop;
  item: SopItem[];
  subItem: SopSubItem[];
}

/**
 * Bangun papan + item + sub-tugas hasil impor (murni, diuji tanpa IndexedDB).
 * Seluruh validasi (judul & judul item wajib) berjalan di sini sehingga
 * transaksi penyimpanan tidak bisa gagal di tengah.
 */
export function bangunStrukturImporPapan(input: InputImporSop): StrukturImporSop {
  const sop: Sop = {
    id: buatId(),
    ...inputSopSah(input),
    baku: false, // hasil impor selalu SOP kustom
    urutan: 1, // diperbarui importer ke urutan max+1 (io)
    dibuatPada: new Date().toISOString(),
  };
  const item: SopItem[] = [];
  const subItem: SopSubItem[] = [];
  input.items.forEach((it, iItem) => {
    const isi = inputItemSopSah(it);
    const itemId = buatId();
    item.push({
      id: itemId,
      sopId: sop.id,
      judul: isi.judul,
      picNama: isi.picNama,
      catatan: isi.catatan,
      rutin: isi.rutin || undefined,
      selesai: false,
      urutan: iItem + 1,
    });
    (it.sub ?? []).forEach((s, iSub) => {
      const isiSub = inputSubItemSopSah(s);
      subItem.push({
        id: buatId(),
        sopId: sop.id,
        itemId,
        judul: isiSub.judul,
        picNama: isiSub.picNama,
        catatan: isiSub.catatan,
        selesai: false,
        urutan: iSub + 1,
      });
    });
  });
  return { sop, item, subItem };
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

// Fungsi baca harus MURNI — tidak boleh menulis DB (sesi 22: penggantian nama
// PIC tertentu yang dulu disisipkan di sini menimpa data pengguna diam-diam).
export async function daftarItemSop(sopId: string): Promise<SopItem[]> {
  return tartibDb.sopItem.where('sopId').equals(sopId).sortBy('urutan');
}

/** Seluruh sub-tugas satu papan — UI mengelompokkannya per item induk. */
export async function daftarSubItemSop(sopId: string): Promise<SopSubItem[]> {
  const semua = await tartibDb.sopSubItem.where('sopId').equals(sopId).toArray();
  return semua.sort((a, b) => (a.itemId === b.itemId ? a.urutan - b.urutan : 0));
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
  await tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    await tartibDb.sopSubItem.where('sopId').equals(id).delete();
    await tartibDb.sopItem.where('sopId').equals(id).delete();
    await tartibDb.sop.delete(id);
  });
}

export async function duplikatSop(id: string): Promise<Sop> {
  const sumber = await ambilSop(id);
  const [items, subItems, semua] = await Promise.all([daftarItemSop(id), daftarSubItemSop(id), daftarSop()]);
  const { sop, item, subItem } = salinanSop(sumber, items, subItems, urutanBerikutnya(semua));
  await tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    await tartibDb.sop.add(sop);
    if (item.length > 0) await tartibDb.sopItem.bulkAdd(item);
    if (subItem.length > 0) await tartibDb.sopSubItem.bulkAdd(subItem);
  });
  return sop;
}

/** Simpan hasil impor dokumen sebagai SOP kustom baru — atomik (gagal satu, batal semua). */
export async function imporSopPapan(input: InputImporSop): Promise<Sop> {
  const { sop, item, subItem } = bangunStrukturImporPapan(input);
  sop.urutan = urutanBerikutnya(await daftarSop());
  await tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    await tartibDb.sop.add(sop);
    if (item.length > 0) await tartibDb.sopItem.bulkAdd(item);
    if (subItem.length > 0) await tartibDb.sopSubItem.bulkAdd(subItem);
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
    judul: isi.judul,
    picNama: isi.picNama,
    catatan: isi.catatan,
    rutin: isi.rutin || undefined,
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
  const n = await tartibDb.sopItem.update(itemId, {
    judul: isi.judul,
    picNama: isi.picNama,
    catatan: isi.catatan,
    rutin: isi.rutin || undefined,
  });
  if (n === 0) throw new SopError('Item tidak ditemukan');
}

export async function hapusItemSop(itemId: string): Promise<void> {
  const item = await tartibDb.sopItem.get(itemId);
  if (!item) throw new SopError('Item tidak ditemukan');
  // Sub-tugas milik item ikut terhapus — tidak ada sub yatim.
  await tartibDb.transaction('rw', tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    await tartibDb.sopSubItem.where('itemId').equals(itemId).delete();
    await tartibDb.sopItem.delete(itemId);
  });
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

/** Kosongkan seluruh centang satu papan (item DAN sub-tugas) — tombol "Reset Ceklis". */
export async function resetCeklis(sopId: string): Promise<number> {
  const [items, subItems] = await Promise.all([daftarItemSop(sopId), daftarSubItemSop(sopId)]);
  const kena = [...items, ...subItems].filter((i) => i.selesai);
  if (kena.length === 0) return 0;
  await tartibDb.transaction('rw', tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    await Promise.all([
      ...items.filter((i) => i.selesai).map((i) => tartibDb.sopItem.put({ ...i, selesai: false, selesaiPada: undefined })),
      ...subItems
        .filter((i) => i.selesai)
        .map((i) => tartibDb.sopSubItem.put({ ...i, selesai: false, selesaiPada: undefined })),
    ]);
  });
  return kena.length;
}

// ===== Mutasi sub-tugas (Batch Y) =====

async function pastikanItemAda(itemId: string): Promise<SopItem> {
  const item = await tartibDb.sopItem.get(itemId);
  if (!item) throw new SopError('Item tidak ditemukan');
  return item;
}

export async function tambahSubItemSop(itemId: string, input: InputSubItemSop): Promise<SopSubItem> {
  const item = await pastikanItemAda(itemId);
  const isi = inputSubItemSopSah(input);
  const sub: SopSubItem = {
    id: buatId(),
    sopId: item.sopId,
    itemId,
    judul: isi.judul,
    picNama: isi.picNama,
    catatan: isi.catatan,
    selesai: false,
    urutan: urutanBerikutnya(
      (await tartibDb.sopSubItem.where('itemId').equals(itemId).toArray()),
    ),
  };
  await tartibDb.sopSubItem.add(sub);
  return sub;
}

export async function ubahSubItemSop(subId: string, input: InputSubItemSop): Promise<void> {
  const lama = await tartibDb.sopSubItem.get(subId);
  if (!lama) throw new SopError('Sub-tugas tidak ditemukan');
  const isi = inputSubItemSopSah(input);
  const n = await tartibDb.sopSubItem.update(subId, isi);
  if (n === 0) throw new SopError('Sub-tugas tidak ditemukan');
}

export async function hapusSubItemSop(subId: string): Promise<void> {
  const sub = await tartibDb.sopSubItem.get(subId);
  if (!sub) throw new SopError('Sub-tugas tidak ditemukan');
  await tartibDb.sopSubItem.delete(subId);
}

export async function pindahSubItemSop(subId: string, arah: 'atas' | 'bawah'): Promise<void> {
  const sub = await tartibDb.sopSubItem.get(subId);
  if (!sub) throw new SopError('Sub-tugas tidak ditemukan');
  const saudara = (await tartibDb.sopSubItem.where('itemId').equals(sub.itemId).toArray()).sort(
    (a, b) => a.urutan - b.urutan,
  );
  const i = saudara.findIndex((x) => x.id === subId);
  const j = arah === 'atas' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= saudara.length) return; // sudah di tepi
  const tetangga = saudara[j];
  await tartibDb.transaction('rw', tartibDb.sopSubItem, async () => {
    await tartibDb.sopSubItem.update(sub.id, { urutan: tetangga.urutan });
    await tartibDb.sopSubItem.update(tetangga.id, { urutan: sub.urutan });
  });
}

/** Centang / uncentang satu sub-tugas. */
export async function tandaiCeklisSub(subId: string, selesai: boolean): Promise<SopSubItem> {
  const sub = await tartibDb.sopSubItem.get(subId);
  if (!sub) throw new SopError('Sub-tugas tidak ditemukan');
  const berikutnya = perubahanCeklis(sub, selesai);
  if (berikutnya === sub) return sub;
  await tartibDb.sopSubItem.put(berikutnya);
  return berikutnya;
}

// ===== Salin / pindah item & sub-tugas (sesi 22) — akses data =====
// Semua operasi di bawah membaca sumber DARI DB saat dipanggil (bukan dari
// snapshot UI) dan berjalan dalam satu transaksi: gagal di tengah = tidak ada
// yang berubah. ID yang tidak ada di tabel yang dituju → SopError, sehingga
// ID sub-tugas tidak bisa diperlakukan sebagai item dan sebaliknya.

async function pastikanSopAda(sopId: string): Promise<Sop> {
  const sop = await tartibDb.sop.get(sopId);
  if (!sop) throw new SopError('Papan tujuan tidak ditemukan');
  return sop;
}

async function subMilikItem(itemId: string): Promise<SopSubItem[]> {
  const semua = await tartibDb.sopSubItem.where('itemId').equals(itemId).toArray();
  return semua.sort((a, b) => a.urutan - b.urutan);
}

/** Duplikat item + seluruh sub-tugasnya, disisipkan TEPAT setelah aslinya; ceklis salinan kosong. */
export async function duplikatItemSop(itemId: string, opsi: { akhiran?: string } = {}): Promise<SopItem> {
  return tartibDb.transaction('rw', tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    const sumber = await pastikanItemAda(itemId);
    const [subs, saudara] = await Promise.all([subMilikItem(itemId), daftarItemSop(sumber.sopId)]);
    const { urutanBaru, geser } = sisipkanUrutan(saudara, itemId);
    const { item, subItem } = salinanItem(sumber, subs, {
      sopId: sumber.sopId,
      urutan: urutanBaru,
      akhiran: opsi.akhiran ?? AKHIRAN_SALINAN,
    });
    // Geser tetangga dulu supaya urutan baru tidak pernah kembar.
    for (const g of geser) await tartibDb.sopItem.update(g.id, { urutan: g.urutan });
    await tartibDb.sopItem.add(item);
    if (subItem.length > 0) await tartibDb.sopSubItem.bulkAdd(subItem);
    return item;
  });
}

/**
 * Salin item (+ sub) ke papan tujuan — boleh papan yang sama. Ditaruh di
 * urutan terakhir papan tujuan; akhiran "(Salinan)" hanya bila papan sama.
 * `rutin` (mis. tier bagan tempat menempel) menimpa rutin sumber bila diberi.
 */
export async function salinItemKePapan(
  itemId: string,
  sopIdTujuan: string,
  opsi: { rutin?: string; akhiran?: string } = {},
): Promise<SopItem> {
  return tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    const sumber = await pastikanItemAda(itemId);
    await pastikanSopAda(sopIdTujuan);
    const [subs, tujuan] = await Promise.all([subMilikItem(itemId), daftarItemSop(sopIdTujuan)]);
    const { item, subItem } = salinanItem(sumber, subs, {
      sopId: sopIdTujuan,
      urutan: urutanBerikutnya(tujuan),
      rutin: opsi.rutin,
      akhiran: akhiranSalinan(sumber.sopId, sopIdTujuan, opsi.akhiran),
    });
    await tartibDb.sopItem.add(item);
    if (subItem.length > 0) await tartibDb.sopSubItem.bulkAdd(subItem);
    return item;
  });
}

/**
 * PINDAHKAN item (+ sub) ke papan tujuan: baris yang sama di-update (id,
 * judul, ceklis, selesaiPada utuh), tidak ada baris baru, tidak ada akhiran.
 * Urutan = terakhir di papan tujuan (juga bila papan sama — "tempel" di
 * papan sendiri berarti kirim ke bawah/tier lain).
 */
export async function pindahkanItem(itemId: string, opsi: { sopIdTujuan: string; rutin?: string }): Promise<void> {
  await tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    const sumber = await pastikanItemAda(itemId);
    await pastikanSopAda(opsi.sopIdTujuan);
    const tujuan = (await daftarItemSop(opsi.sopIdTujuan)).filter((i) => i.id !== itemId);
    await tartibDb.sopItem.update(itemId, {
      sopId: opsi.sopIdTujuan,
      rutin: opsi.rutin === undefined ? sumber.rutin : opsi.rutin || undefined,
      urutan: urutanBerikutnya(tujuan),
    });
    if (opsi.sopIdTujuan !== sumber.sopId) {
      await tartibDb.sopSubItem.where('itemId').equals(itemId).modify({ sopId: opsi.sopIdTujuan });
    }
  });
}

/** Salin sub-tugas ke jabatan tujuan (boleh jabatan yang sama → akhiran "(Salinan)"); ceklis kosong. */
export async function salinSubItem(
  subId: string,
  itemIdTujuan: string,
  opsi: { akhiran?: string } = {},
): Promise<SopSubItem> {
  return tartibDb.transaction('rw', tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    const sumber = await tartibDb.sopSubItem.get(subId);
    if (!sumber) throw new SopError('Sub-tugas tidak ditemukan');
    const induk = await tartibDb.sopItem.get(itemIdTujuan);
    if (!induk) throw new SopError('Jabatan tujuan tidak ditemukan');
    const sub = salinanSubItem(sumber, {
      itemId: induk.id,
      sopId: induk.sopId,
      urutan: urutanBerikutnya(await subMilikItem(induk.id)),
      akhiran: akhiranSalinan(sumber.itemId, induk.id, opsi.akhiran),
    });
    await tartibDb.sopSubItem.add(sub);
    return sub;
  });
}

/** PINDAHKAN sub-tugas ke jabatan tujuan: baris yang sama di-update, nama & ceklis utuh. */
export async function pindahkanSubItem(subId: string, itemIdTujuan: string): Promise<void> {
  await tartibDb.transaction('rw', tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    const sumber = await tartibDb.sopSubItem.get(subId);
    if (!sumber) throw new SopError('Sub-tugas tidak ditemukan');
    const induk = await tartibDb.sopItem.get(itemIdTujuan);
    if (!induk) throw new SopError('Jabatan tujuan tidak ditemukan');
    const saudara = (await subMilikItem(induk.id)).filter((s) => s.id !== subId);
    await tartibDb.sopSubItem.update(subId, {
      itemId: induk.id,
      sopId: induk.sopId,
      urutan: urutanBerikutnya(saudara),
    });
  });
}
