// Service template (Batch B) — satu-satunya jalur baca/tulis data template
// dari UI. Semua akses Dexie dari komponen wajib lewat service layer
// (PRD §3 pola wajib); fungsi murni di sini diuji tanpa IndexedDB.
import { buatId, tartibDb } from '../db/schema';
import { parseRumusQty, RumusError } from '../lib/rumusQty';
import { urutanBerikutnya } from '../lib/urutan';
import type { Fase, JenisAcara, Template, TemplateItem } from '../types';

export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

// Konteks dummy untuk validasi ekspresi rumusQty saat item disimpan:
// hanya perlu sah secara sintaks, tidak peduli hasil angkanya.
const KONTEKS_CEK_RUMUS = { porsi: 1, santri: 1, panitia: 1, rsvp: 1 };

function validasiRumusQty(rumus: string | undefined): void {
  if (!rumus || rumus.trim() === '') return;
  try {
    parseRumusQty(rumus, KONTEKS_CEK_RUMUS);
  } catch (e) {
    if (e instanceof RumusError) throw new TemplateError(`Rumus tidak sah: ${e.message}`);
    throw e;
  }
}

function wajibIsi(nilai: string, label: string): string {
  const bersih = nilai.trim();
  if (!bersih) throw new TemplateError(`${label} wajib diisi`);
  return bersih;
}

// ===== Fungsi murni (diuji di templateService.test.ts) =====

export interface StrukturSalinan {
  fase: Fase[];
  item: TemplateItem[];
}

// Menyalin struktur fase+item ke target (duplikat / versi baru / snapshot acara).
// Semua id baru; faseId item dipetakan ke salinan fase-nya.
export function salinStrukturTemplate(
  faseLama: readonly Fase[],
  itemLama: readonly TemplateItem[],
  targetTemplateId: string,
): StrukturSalinan {
  const idFaseBaru = new Map<string, string>();
  const fase = faseLama.map((f) => {
    const id = buatId();
    idFaseBaru.set(f.id, id);
    return { ...f, id, templateId: targetTemplateId };
  });
  const item = itemLama.map((i) => {
    const faseId = idFaseBaru.get(i.faseId);
    if (!faseId) {
      throw new TemplateError(`Item "${i.judul}" merujuk fase yang tidak ikut disalin (${i.faseId})`);
    }
    return { ...i, id: buatId(), templateId: targetTemplateId, faseId };
  });
  return { fase, item };
}

// Duplikat: versi 1, nama default "… (Salinan)" (bisa diganti), aktif.
export function templateUntukDuplikat(sumber: Template, nama?: string): Template {
  return {
    ...sumber,
    id: buatId(),
    versi: 1,
    nama: (nama ?? '').trim() || `${sumber.nama} (Salinan)`,
    aktif: true,
    dibuatPada: new Date().toISOString(),
  };
}

// Versi baru: versi + 1, aktif. Sumber TIDAK diubah di sini — penonaktifan
// versi lama dilakukan transaksi di versiBaruTemplate (versi lama tetap
// terbaca, sesuai Gate B).
export function templateVersiBaru(sumber: Template): Template {
  return {
    ...sumber,
    id: buatId(),
    versi: sumber.versi + 1,
    aktif: true,
    dibuatPada: new Date().toISOString(),
  };
}

// ===== Akses data (io) =====

export async function daftarJenisAcara(): Promise<JenisAcara[]> {
  const semua = await tartibDb.jenisAcara.toArray();
  return semua.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
}

export async function buatTemplate(input: { jenisAcaraId: string; nama: string; catatan?: string }): Promise<Template> {
  const jenisAcara = await tartibDb.jenisAcara.get(input.jenisAcaraId);
  if (!jenisAcara) throw new TemplateError('Jenis acara tidak ditemukan');
  const template: Template = {
    id: buatId(),
    jenisAcaraId: jenisAcara.id,
    versi: 1,
    nama: wajibIsi(input.nama, 'Nama template'),
    catatan: input.catatan ?? '',
    dibuatPada: new Date().toISOString(),
    aktif: true,
  };
  await tartibDb.template.add(template);
  return template;
}

export async function ambilTemplate(id: string): Promise<Template> {
  const template = await tartibDb.template.get(id);
  if (!template) throw new TemplateError('Template tidak ditemukan');
  return template;
}

export async function daftarTemplate(opsi: { hanyaAktif?: boolean } = {}): Promise<Template[]> {
  const semua = await tartibDb.template.orderBy('dibuatPada').reverse().toArray();
  return opsi.hanyaAktif ? semua.filter((t) => t.aktif) : semua;
}

export async function ambilFaseTemplate(templateId: string): Promise<Fase[]> {
  return tartibDb.fase.where('templateId').equals(templateId).sortBy('urutan');
}

export async function ambilItemTemplate(templateId: string): Promise<TemplateItem[]> {
  const semua = await tartibDb.templateItem.where('templateId').equals(templateId).toArray();
  return semua.sort((a, b) => (a.faseId === b.faseId ? a.urutan - b.urutan : 0));
}

async function salinKeTemplateBaru(templateId: string, buatBaru: (sumber: Template) => Template): Promise<Template> {
  const sumber = await ambilTemplate(templateId);
  const [faseLama, itemLama] = await Promise.all([ambilFaseTemplate(templateId), ambilItemTemplate(templateId)]);
  const baru = buatBaru(sumber);
  const salinan = salinStrukturTemplate(faseLama, itemLama, baru.id);
  await tartibDb.transaction('rw', tartibDb.template, tartibDb.fase, tartibDb.templateItem, async () => {
    await tartibDb.template.add(baru);
    if (salinan.fase.length > 0) await tartibDb.fase.bulkAdd(salinan.fase);
    if (salinan.item.length > 0) await tartibDb.templateItem.bulkAdd(salinan.item);
  });
  return baru;
}

export async function duplikatTemplate(templateId: string, nama?: string): Promise<Template> {
  return salinKeTemplateBaru(templateId, (sumber) => templateUntukDuplikat(sumber, nama));
}

export async function versiBaruTemplate(templateId: string): Promise<Template> {
  const sumber = await ambilTemplate(templateId);
  const [faseLama, itemLama] = await Promise.all([ambilFaseTemplate(templateId), ambilItemTemplate(templateId)]);
  const baru = templateVersiBaru(sumber);
  const salinan = salinStrukturTemplate(faseLama, itemLama, baru.id);
  await tartibDb.transaction('rw', tartibDb.template, tartibDb.fase, tartibDb.templateItem, async () => {
    await tartibDb.template.update(sumber.id, { aktif: false }); // versi lama tetap terbaca (Gate B)
    await tartibDb.template.add(baru);
    if (salinan.fase.length > 0) await tartibDb.fase.bulkAdd(salinan.fase);
    if (salinan.item.length > 0) await tartibDb.templateItem.bulkAdd(salinan.item);
  });
  return baru;
}

export async function arsipTemplate(templateId: string): Promise<void> {
  const n = await tartibDb.template.update(templateId, { aktif: false });
  if (n === 0) throw new TemplateError('Template tidak ditemukan');
}

export async function hapusTemplate(templateId: string): Promise<void> {
  const template = await tartibDb.template.get(templateId);
  if (!template) throw new TemplateError('Template tidak ditemukan');
  // Seluruh struktur milik template (fase + item) ikut terhapus dalam satu
  // transaksi. Acara yang sudah dibuat tidak terpengaruh: fase & tugas acara
  // adalah salinan snapshot (lihat acaraService, K-03).
  await tartibDb.transaction('rw', tartibDb.template, tartibDb.fase, tartibDb.templateItem, async () => {
    await tartibDb.templateItem.where('templateId').equals(templateId).delete();
    await tartibDb.fase.where('templateId').equals(templateId).delete();
    await tartibDb.template.delete(templateId);
  });
}

// ===== Mutasi fase =====

export async function tambahFase(templateId: string, input: { label: string; offsetHari: number }): Promise<Fase> {
  await ambilTemplate(templateId);
  const fases = await ambilFaseTemplate(templateId);
  const fase: Fase = {
    id: buatId(),
    templateId,
    urutan: urutanBerikutnya(fases),
    label: wajibIsi(input.label, 'Label fase'),
    offsetHari: input.offsetHari,
  };
  await tartibDb.fase.add(fase);
  return fase;
}

export async function ubahFase(faseId: string, input: { label: string; offsetHari: number }): Promise<void> {
  const n = await tartibDb.fase.update(faseId, {
    label: wajibIsi(input.label, 'Label fase'),
    offsetHari: input.offsetHari,
  });
  if (n === 0) throw new TemplateError('Fase tidak ditemukan');
}

export async function hapusFase(faseId: string): Promise<void> {
  const fase = await tartibDb.fase.get(faseId);
  if (!fase) throw new TemplateError('Fase tidak ditemukan');
  // Item milik fase ikut terhapus. Acara yang sudah dibuat tidak terpengaruh:
  // fase & tugas acara adalah salinan snapshot (lihat acaraService, K-03).
  const sisa = (await ambilFaseTemplate(fase.templateId)).filter((f) => f.id !== faseId);
  await tartibDb.transaction('rw', tartibDb.fase, tartibDb.templateItem, async () => {
    await tartibDb.templateItem.where('faseId').equals(faseId).delete();
    await tartibDb.fase.delete(faseId);
    for (let i = 0; i < sisa.length; i += 1) {
      await tartibDb.fase.update(sisa[i].id, { urutan: i + 1 });
    }
  });
}

export async function pindahFase(faseId: string, arah: 'atas' | 'bawah'): Promise<void> {
  const fase = await tartibDb.fase.get(faseId);
  if (!fase) throw new TemplateError('Fase tidak ditemukan');
  const fases = await ambilFaseTemplate(fase.templateId);
  const i = fases.findIndex((f) => f.id === faseId);
  const j = arah === 'atas' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= fases.length) return; // sudah di tepi
  const tetangga = fases[j];
  await tartibDb.transaction('rw', tartibDb.fase, async () => {
    await tartibDb.fase.update(fase.id, { urutan: tetangga.urutan });
    await tartibDb.fase.update(tetangga.id, { urutan: fase.urutan });
  });
}

// ===== Mutasi item =====

export interface InputItem {
  judul: string;
  catatan?: string;
  divisiId: string;
  wajib: boolean;
  rumusQty?: string;
}

function pastikanDivisiAda(divisiId: string): Promise<boolean> {
  return tartibDb.divisi.get(divisiId).then((d) => d !== undefined);
}

async function bangunItem(faseId: string, input: InputItem): Promise<TemplateItem> {
  const fase = await tartibDb.fase.get(faseId);
  if (!fase) throw new TemplateError('Fase tidak ditemukan');
  if (!(await pastikanDivisiAda(input.divisiId))) throw new TemplateError('Divisi tidak ditemukan');
  validasiRumusQty(input.rumusQty);
  const itemsFase = (await ambilItemTemplate(fase.templateId)).filter((i) => i.faseId === faseId);
  return {
    id: buatId(),
    templateId: fase.templateId,
    faseId,
    divisiId: input.divisiId,
    judul: wajibIsi(input.judul, 'Judul item'),
    catatan: input.catatan ?? '',
    wajib: input.wajib,
    rumusQty: input.rumusQty?.trim() || undefined,
    urutan: urutanBerikutnya(itemsFase),
  };
}

export async function tambahItem(faseId: string, input: InputItem): Promise<TemplateItem> {
  const item = await bangunItem(faseId, input);
  await tartibDb.templateItem.add(item);
  return item;
}

export async function ubahItem(itemId: string, input: InputItem): Promise<void> {
  const lama = await tartibDb.templateItem.get(itemId);
  if (!lama) throw new TemplateError('Item tidak ditemukan');
  const baru = await bangunItem(lama.faseId, input);
  const n = await tartibDb.templateItem.update(itemId, {
    divisiId: baru.divisiId,
    judul: baru.judul,
    catatan: baru.catatan,
    wajib: baru.wajib,
    rumusQty: baru.rumusQty,
  });
  if (n === 0) throw new TemplateError('Item tidak ditemukan');
}

export async function hapusItem(itemId: string): Promise<void> {
  const item = await tartibDb.templateItem.get(itemId);
  if (!item) throw new TemplateError('Item tidak ditemukan');
  await tartibDb.templateItem.delete(itemId);
}

export async function pindahItem(itemId: string, arah: 'atas' | 'bawah'): Promise<void> {
  const item = await tartibDb.templateItem.get(itemId);
  if (!item) throw new TemplateError('Item tidak ditemukan');
  const itemsFase = (await ambilItemTemplate(item.templateId)).filter((i) => i.faseId === item.faseId);
  const i = itemsFase.findIndex((x) => x.id === itemId);
  const j = arah === 'atas' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= itemsFase.length) return; // sudah di tepi
  const tetangga = itemsFase[j];
  await tartibDb.transaction('rw', tartibDb.templateItem, async () => {
    await tartibDb.templateItem.update(item.id, { urutan: tetangga.urutan });
    await tartibDb.templateItem.update(tetangga.id, { urutan: item.urutan });
  });
}

// ===== Impor SOP dari dokumen (Batch V) =====

export interface InputFaseImpor {
  label: string;
  offsetHari: number;
  items: InputItem[];
}

export interface InputImporTemplate {
  jenisAcaraId: string;
  nama: string;
  catatan?: string;
  fases: InputFaseImpor[];
}

export interface StrukturImpor {
  template: Template;
  fases: Fase[];
  items: TemplateItem[];
}

/**
 * Bangun template + fase + item hasil impor (murni, diuji tanpa IndexedDB).
 * Semua validasi (nama/label/judul wajib, divisi dikenal, rumusQty sah)
 * berjalan di sini sehingga transaksi penyimpanan tidak bisa gagal di tengah.
 */
export function bangunStrukturImpor(
  input: InputImporTemplate,
  divisiIds: ReadonlySet<string>,
  jenisAcaraIdValid: string,
): StrukturImpor {
  const template: Template = {
    id: buatId(),
    jenisAcaraId: jenisAcaraIdValid,
    versi: 1,
    nama: wajibIsi(input.nama, 'Nama template'),
    catatan: input.catatan?.trim() ?? '',
    dibuatPada: new Date().toISOString(),
    aktif: true,
  };
  const fases: Fase[] = [];
  const items: TemplateItem[] = [];

  input.fases.forEach((f, iFase) => {
    const faseId = buatId();
    fases.push({
      id: faseId,
      templateId: template.id,
      urutan: iFase + 1,
      label: wajibIsi(f.label, 'Label fase'),
      offsetHari: f.offsetHari,
    });
    f.items.forEach((it, iItem) => {
      if (!divisiIds.has(it.divisiId)) throw new TemplateError('Divisi tidak ditemukan');
      validasiRumusQty(it.rumusQty);
      items.push({
        id: buatId(),
        templateId: template.id,
        faseId,
        divisiId: it.divisiId,
        judul: wajibIsi(it.judul, 'Judul item'),
        catatan: it.catatan ?? '',
        wajib: it.wajib,
        rumusQty: it.rumusQty?.trim() || undefined,
        urutan: iItem + 1,
      });
    });
  });

  return { template, fases, items };
}

/** Simpan hasil impor dokumen sebagai template baru — atomik (gagal satu, batal semua). */
export async function imporTemplate(input: InputImporTemplate): Promise<Template> {
  const jenisAcara = await tartibDb.jenisAcara.get(input.jenisAcaraId);
  if (!jenisAcara) throw new TemplateError('Jenis acara tidak ditemukan');
  const divisiIds = new Set((await tartibDb.divisi.toArray()).map((d) => d.id));
  const { template, fases, items } = bangunStrukturImpor(input, divisiIds, jenisAcara.id);

  await tartibDb.transaction('rw', tartibDb.template, tartibDb.fase, tartibDb.templateItem, async () => {
    await tartibDb.template.add(template);
    if (fases.length > 0) await tartibDb.fase.bulkAdd(fases);
    if (items.length > 0) await tartibDb.templateItem.bulkAdd(items);
  });
  return template;
}
