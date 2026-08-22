// Service evaluasi & promosi usulan (Batch E, A-03). Evaluasi disimpan per
// divisi per acara (berjalan baik / kurang / usulan — format BRIEF §5.6).
// Promosi usulan membuat VERSI TEMPLATE BARU yang berisi seluruh struktur
// lama + satu item hasil usulan; versi lama dinonaktifkan (tetap terbaca).

import { buatId, tartibDb } from '../db/schema';
import type { Evaluasi, Fase, Template, TemplateItem } from '../types';
import { ambilFaseTemplate, ambilItemTemplate, ambilTemplate, salinStrukturTemplate, templateVersiBaru } from './templateService';

export class EvaluasiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluasiError';
  }
}

// ===== Fungsi murni (diuji tanpa IndexedDB) =====

export interface InputEvaluasi {
  divisiId: string;
  berjalanBaik: string;
  kurang: string;
  usulan: string;
}

// Trim semua teks; divisi wajib; minimal satu kolom terisi — evaluasi
// kosong seratus persen tidak menyimpan apa pun yang bisa dipelajari.
export function inputEvaluasiSah(input: InputEvaluasi): InputEvaluasi {
  const divisiId = input.divisiId.trim();
  if (!divisiId) throw new EvaluasiError('Divisi wajib dipilih');
  const bersih = {
    divisiId,
    berjalanBaik: input.berjalanBaik.trim(),
    kurang: input.kurang.trim(),
    usulan: input.usulan.trim(),
  };
  if (!bersih.berjalanBaik && !bersih.kurang && !bersih.usulan) {
    throw new EvaluasiError('Isi minimal satu kolom evaluasi');
  }
  return bersih;
}

// Fase dengan urutan terbesar — item hasil usulan ditempatkan di ujung SOP.
export function faseTerakhir(fases: readonly Fase[]): Fase | null {
  if (fases.length === 0) return null;
  return fases.reduce((maks, f) => (f.urutan > maks.urutan ? f : maks));
}

export function itemDariUsulan(usulan: string, divisiId: string, fase: Fase, urutan: number): TemplateItem {
  return {
    id: buatId(),
    templateId: fase.templateId,
    faseId: fase.id,
    divisiId,
    judul: usulan,
    catatan: 'Item hasil promosi evaluasi acara sebelumnya',
    wajib: false, // usulan baru masuk SOP — belum dipastikan wajib
    urutan,
  };
}

// ===== Akses data =====

// Upsert per (acaraId, divisiId). Bila teks usulan berubah setelah promosi,
// penanda sudahDipromosikan direset — usulan yang berubah boleh dipromosi
// ulang; usulan yang sama tidak (A-03: tidak dipromosikan dua kali).
export async function simpanEvaluasi(acaraId: string, input: InputEvaluasi): Promise<Evaluasi> {
  const bersih = inputEvaluasiSah(input);
  const lama = await tartibDb.evaluasi.where('acaraId').equals(acaraId).toArray();
  const ada = lama.find((e) => e.divisiId === bersih.divisiId);
  if (ada) {
    const perubahan: Partial<Evaluasi> = {
      berjalanBaik: bersih.berjalanBaik,
      kurang: bersih.kurang,
      usulan: bersih.usulan,
    };
    if (ada.usulan !== bersih.usulan) perubahan.sudahDipromosikan = false;
    await tartibDb.evaluasi.update(ada.id, perubahan);
    return { ...ada, ...perubahan } as Evaluasi;
  }
  const baru: Evaluasi = {
    id: buatId(),
    acaraId,
    divisiId: bersih.divisiId,
    berjalanBaik: bersih.berjalanBaik,
    kurang: bersih.kurang,
    usulan: bersih.usulan,
    sudahDipromosikan: false,
  };
  await tartibDb.evaluasi.add(baru);
  return baru;
}

export async function daftarEvaluasi(acaraId: string): Promise<Evaluasi[]> {
  return tartibDb.evaluasi.where('acaraId').equals(acaraId).sortBy('divisiId');
}

// A-03: usulan → versi template baru. Satu transaksi: nonaktifkan versi
// lama, salin struktur, tambah item usulan di fase terakhir, tandai
// evaluasi. Gagal satu → semua batal.
export async function promosikanUsulan(evaluasiId: string, templateId: string): Promise<Template> {
  const evaluasi = await tartibDb.evaluasi.get(evaluasiId);
  if (!evaluasi) throw new EvaluasiError('Evaluasi tidak ditemukan');
  if (evaluasi.sudahDipromosikan) throw new EvaluasiError('Usulan ini sudah dipromosikan — tidak bisa dua kali');
  if (!evaluasi.usulan.trim()) throw new EvaluasiError('Evaluasi ini tidak memiliki usulan');

  const sumber = await ambilTemplate(templateId);
  const [faseLama, itemLama] = await Promise.all([ambilFaseTemplate(templateId), ambilItemTemplate(templateId)]);
  const baru = templateVersiBaru(sumber);
  const salinan = salinStrukturTemplate(faseLama, itemLama, baru.id);

  const faseAkhir = faseTerakhir(salinan.fase);
  if (!faseAkhir) throw new EvaluasiError('Template tanpa fase tidak bisa menerima promosi usulan');
  const urutanAkhir = salinan.item
    .filter((i) => i.faseId === faseAkhir.id)
    .reduce((maks, i) => Math.max(maks, i.urutan), 0);
  const itemUsulan = itemDariUsulan(evaluasi.usulan.trim(), evaluasi.divisiId, faseAkhir, urutanAkhir + 1);

  await tartibDb.transaction(
    'rw',
    tartibDb.template,
    tartibDb.fase,
    tartibDb.templateItem,
    tartibDb.evaluasi,
    async () => {
      await tartibDb.template.update(sumber.id, { aktif: false }); // versi lama tetap terbaca
      await tartibDb.template.add(baru);
      if (salinan.fase.length > 0) await tartibDb.fase.bulkAdd(salinan.fase);
      if (salinan.item.length > 0) await tartibDb.templateItem.bulkAdd(salinan.item);
      await tartibDb.templateItem.add(itemUsulan);
      await tartibDb.evaluasi.update(evaluasi.id, { sudahDipromosikan: true });
    },
  );
  return baru;
}
