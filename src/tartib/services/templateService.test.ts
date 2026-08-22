import { describe, expect, it } from 'vitest';
import {
  bangunStrukturImpor,
  salinStrukturTemplate,
  templateUntukDuplikat,
  templateVersiBaru,
  TemplateError,
} from './templateService';
import type { Fase, Template, TemplateItem } from '../types';

function contohFase(): Fase[] {
  return [
    { id: 'f1', templateId: 't1', urutan: 1, label: 'Persiapan H-30', offsetHari: -30 },
    { id: 'f2', templateId: 't1', urutan: 2, label: 'Hari H', offsetHari: 0 },
  ];
}

function contohItem(): TemplateItem[] {
  return [
    {
      id: 'i1', templateId: 't1', faseId: 'f1', divisiId: 'd1',
      judul: 'Rapat pembentukan panitia', catatan: 'Tentukan ketua', wajib: true, urutan: 1,
    },
    {
      id: 'i2', templateId: 't1', faseId: 'f2', divisiId: 'd5',
      judul: 'Hidangkan konsumsi', catatan: 'sesuai porsi', wajib: true, rumusQty: 'porsi', urutan: 1,
    },
  ];
}

function contohTemplate(): Template {
  return {
    id: 't1', jenisAcaraId: 'j1', versi: 1, nama: 'Tasyakuran Khatam',
    catatan: '', dibuatPada: '2026-08-01T00:00:00.000Z', aktif: true,
  };
}

describe('salinStrukturTemplate', () => {
  it('menyalin fase & item dengan id baru dan faseId terpetakan', () => {
    const hasil = salinStrukturTemplate(contohFase(), contohItem(), 't2');
    expect(hasil.fase).toHaveLength(2);
    expect(hasil.item).toHaveLength(2);
    expect(hasil.fase.every((f) => f.id !== 'f1' && f.id !== 'f2')).toBe(true);
    expect(hasil.fase.every((f) => f.templateId === 't2')).toBe(true);
    expect(hasil.item.every((i) => i.id !== 'i1' && i.id !== 'i2' && i.templateId === 't2')).toBe(true);
    const idFase1 = hasil.fase.find((f) => f.urutan === 1)!.id;
    const idFase2 = hasil.fase.find((f) => f.urutan === 2)!.id;
    expect(hasil.item.find((i) => i.judul === 'Rapat pembentukan panitia')!.faseId).toBe(idFase1);
    expect(hasil.item.find((i) => i.judul === 'Hidangkan konsumsi')!.faseId).toBe(idFase2);
  });

  it('mempertahankan urutan, wajib, dan rumusQty', () => {
    const hasil = salinStrukturTemplate(contohFase(), contohItem(), 't2');
    const konsumsi = hasil.item.find((i) => i.judul === 'Hidangkan konsumsi')!;
    expect(konsumsi.wajib).toBe(true);
    expect(konsumsi.rumusQty).toBe('porsi');
    expect(konsumsi.urutan).toBe(1);
    expect(hasil.fase.find((f) => f.label === 'Persiapan H-30')!.offsetHari).toBe(-30);
  });

  it('melempar TemplateError bila item merujuk fase yang tidak disalin', () => {
    const itemYatim = [{ ...contohItem()[0], faseId: 'f999' }];
    expect(() => salinStrukturTemplate(contohFase(), itemYatim, 't2')).toThrow(TemplateError);
  });
});

describe('templateUntukDuplikat', () => {
  it('versi 1 aktif dengan nama salinan; sumber tidak berubah', () => {
    const sumber = contohTemplate();
    const baru = templateUntukDuplikat(sumber);
    expect(baru.id).not.toBe(sumber.id);
    expect(baru.versi).toBe(1);
    expect(baru.aktif).toBe(true);
    expect(baru.nama).toBe('Tasyakuran Khatam (Salinan)');
    expect(sumber.versi).toBe(1);
    expect(sumber.aktif).toBe(true);
  });

  it('menerima nama kustom', () => {
    expect(templateUntukDuplikat(contohTemplate(), 'Maulid 2027').nama).toBe('Maulid 2027');
  });
});

describe('templateVersiBaru', () => {
  it('menaikkan versi; sumber utuh sehingga versi lama tetap terbaca (Gate B)', () => {
    const sumber = contohTemplate();
    const baru = templateVersiBaru(sumber);
    expect(baru.id).not.toBe(sumber.id);
    expect(baru.versi).toBe(2);
    expect(baru.aktif).toBe(true);
    expect(sumber.versi).toBe(1);
    expect(sumber.aktif).toBe(true);
  });
});

describe('bangunStrukturImpor', () => {
  const divisiIds = new Set(['d1', 'd5']);

  it('membangun template, fase, dan item dengan urutan & keterhubungan benar', () => {
    const { template, fases, items } = bangunStrukturImpor(
      {
        jenisAcaraId: 'j1',
        nama: 'SOP Acara Mahad',
        catatan: 'dari dokumen',
        fases: [
          {
            label: 'Penetapan',
            offsetHari: -30,
            items: [
              { judul: 'Tetapkan tanggal', divisiId: 'd1', wajib: true },
              { judul: 'Tentukan anggaran', divisiId: 'd5', wajib: false, rumusQty: 'porsi' },
            ],
          },
          { label: 'Hari-H', offsetHari: 0, items: [{ judul: 'Sambut tamu', divisiId: 'd1', wajib: true }] },
        ],
      },
      divisiIds,
      'j1',
    );
    expect(template.nama).toBe('SOP Acara Mahad');
    expect(template.jenisAcaraId).toBe('j1');
    expect(template.versi).toBe(1);
    expect(template.aktif).toBe(true);
    expect(template.catatan).toBe('dari dokumen');
    expect(fases.map((f) => [f.label, f.offsetHari, f.urutan])).toEqual([
      ['Penetapan', -30, 1],
      ['Hari-H', 0, 2],
    ]);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ faseId: fases[0].id, judul: 'Tetapkan tanggal', urutan: 1, wajib: true });
    expect(items[1]).toMatchObject({ faseId: fases[0].id, urutan: 2, rumusQty: 'porsi' });
    expect(items[2]).toMatchObject({ faseId: fases[1].id, urutan: 1 });
    // Semua item menunjuk template yang sama.
    for (const i of items) expect(i.templateId).toBe(template.id);
  });

  it('menolak divisi yang tidak dikenal', () => {
    expect(() =>
      bangunStrukturImpor(
        { jenisAcaraId: 'j1', nama: 'X', fases: [{ label: 'F', offsetHari: 0, items: [{ judul: 'T', divisiId: 'tidak-ada', wajib: true }] }] },
        divisiIds,
        'j1',
      ),
    ).toThrow(TemplateError);
  });

  it('menolak judul kosong dan rumusQty tidak sah', () => {
    expect(() =>
      bangunStrukturImpor(
        { jenisAcaraId: 'j1', nama: 'X', fases: [{ label: 'F', offsetHari: 0, items: [{ judul: '   ', divisiId: 'd1', wajib: true }] }] },
        divisiIds,
        'j1',
      ),
    ).toThrow(/Judul item/);
    expect(() =>
      bangunStrukturImpor(
        { jenisAcaraId: 'j1', nama: 'X', fases: [{ label: 'F', offsetHari: 0, items: [{ judul: 'T', divisiId: 'd1', wajib: true, rumusQty: 'alert(1)' }] }] },
        divisiIds,
        'j1',
      ),
    ).toThrow(TemplateError);
  });
});
