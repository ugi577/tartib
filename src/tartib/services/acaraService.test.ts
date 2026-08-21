// Test fungsi murni snapshot acara (K-03/K-11/A-02) — tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { Fase, TemplateItem } from '../types';
import { AcaraError, siapkanSnapshotAcara } from './acaraService';

function fase(id: string, templateId: string, urutan: number, label: string, offsetHari: number): Fase {
  return { id, templateId, urutan, label, offsetHari };
}

function item(
  id: string,
  templateId: string,
  faseId: string,
  divisiId: string,
  judul: string,
  urutan: number,
  wajib = true,
): TemplateItem {
  return { id, templateId, faseId, divisiId, judul, catatan: '', wajib, urutan };
}

const FASE_LAMA = [
  fase('f1', 'tpl1', 1, 'Persiapan', -30),
  fase('f2', 'tpl1', 2, 'Hari H', 0),
];

const ITEM_LAMA = [
  item('i1', 'tpl1', 'f1', 'd1', 'Buat surat undangan', 1),
  item('i2', 'tpl1', 'f1', 'd2', 'Sewa tenda', 2),
  item('i3', 'tpl1', 'f2', 'd1', 'Sambutan panitia', 1),
];

describe('siapkanSnapshotAcara', () => {
  it('menyalin seluruh item sebagai tugas berstatus BELUM', () => {
    const s = siapkanSnapshotAcara(FASE_LAMA, ITEM_LAMA, 'acara1');
    expect(s.tugas).toHaveLength(3);
    expect(s.tugas.map((t) => t.judul)).toEqual(['Buat surat undangan', 'Sewa tenda', 'Sambutan panitia']);
    expect(s.tugas.map((t) => t.status)).toEqual(['BELUM', 'BELUM', 'BELUM']);
    expect(s.tugas.map((t) => t.urutan)).toEqual([1, 2, 1]);
    expect(s.tugas.map((t) => t.wajib)).toEqual([true, true, true]);
    expect(s.tugas.every((t) => t.acaraId === 'acara1' && t.id !== '')).toBe(true);
    expect(s.tugas.every((t) => t.selesaiPada === undefined)).toBe(true);
  });

  it('menyalin fase ke baris milik acara (K-11) dengan id baru', () => {
    const s = siapkanSnapshotAcara(FASE_LAMA, ITEM_LAMA, 'acara1');
    expect(s.fase).toHaveLength(2);
    expect(s.fase.map((f) => f.label)).toEqual(['Persiapan', 'Hari H']);
    expect(s.fase.map((f) => f.offsetHari)).toEqual([-30, 0]);
    expect(s.fase.map((f) => f.urutan)).toEqual([1, 2]);
    expect(s.fase.every((f) => f.templateId === 'acara1' && f.id !== '')).toBe(true);
    expect(new Set(s.fase.map((f) => f.id)).size).toBe(2);
  });

  it('memetakan faseId tugas ke salinan fase acara, bukan fase template', () => {
    const s = siapkanSnapshotAcara(FASE_LAMA, ITEM_LAMA, 'acara1');
    const idAcara = new Map(s.fase.map((f) => f.label).map((label, i) => [label, s.fase[i].id]));
    const t1 = s.tugas[0];
    expect(t1.faseId).toBe(idAcara.get('Persiapan'));
    expect(t1.faseId).not.toBe('f1');
    const t3 = s.tugas[2];
    expect(t3.faseId).toBe(idAcara.get('Hari H'));
  });

  it('mencantumkan divisi bertugas unik sesuai urutan kemunculan item', () => {
    const s = siapkanSnapshotAcara(FASE_LAMA, ITEM_LAMA, 'acara1');
    expect(s.divisiBertugas).toEqual(['d1', 'd2']);
  });

  it('tidak mengubah hasil saat input dimutasi setelah snapshot (A-02 isolasi)', () => {
    const faseSalinan = FASE_LAMA.map((f) => ({ ...f }));
    const itemSalinan = ITEM_LAMA.map((i) => ({ ...i }));
    const s = siapkanSnapshotAcara(faseSalinan, itemSalinan, 'acara1');
    // Edit template sesudah acara dibuat — harus tidak terlihat di snapshot.
    faseSalinan[0].label = 'DIUBAH';
    faseSalinan[0].offsetHari = 999;
    faseSalinan[1].id = 'f2-DIUBAH';
    itemSalinan[0].judul = 'DIUBAH';
    itemSalinan[1].wajib = false;
    itemSalinan[2].divisiId = 'd-X';
    expect(s.fase[0].label).toBe('Persiapan');
    expect(s.fase[0].offsetHari).toBe(-30);
    expect(s.tugas[0].judul).toBe('Buat surat undangan');
    expect(s.tugas[1].wajib).toBe(true);
    expect(s.tugas[2].divisiId).toBe('d1');
    expect(s.divisiBertugas).toEqual(['d1', 'd2']);
  });

  it('melempar AcaraError bila item merujuk fase yang tidak disalin', () => {
    const itemYatim = [item('iX', 'tpl1', 'f-TIDAK-ADA', 'd1', 'Item yatim', 1)];
    expect(() => siapkanSnapshotAcara(FASE_LAMA, itemYatim, 'acara1')).toThrow(AcaraError);
    expect(() => siapkanSnapshotAcara(FASE_LAMA, itemYatim, 'acara1')).toThrow(/merujuk fase/);
  });

  it('menghasilkan snapshot kosong untuk template tanpa fase', () => {
    const s = siapkanSnapshotAcara([], [], 'acara1');
    expect(s.fase).toEqual([]);
    expect(s.tugas).toEqual([]);
    expect(s.divisiBertugas).toEqual([]);
  });
});
