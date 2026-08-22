import { describe, expect, it } from 'vitest';
import {
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
