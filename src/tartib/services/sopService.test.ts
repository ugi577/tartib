// Test service SOP (Batch X) — fungsi murni, tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { Sop, SopItem } from '../types';
import {
  ikhtisarCeklis,
  inputItemSopSah,
  inputSopSah,
  perubahanCeklis,
  salinanSop,
  SopError,
} from './sopService';

function sop(parsial: Partial<Sop> = {}): Sop {
  return {
    id: 's1',
    judul: 'Amanah & Khidmah Santri',
    catatan: '',
    baku: true,
    urutan: 1,
    dibuatPada: '2026-08-29T00:00:00.000Z',
    ...parsial,
  };
}

function item(parsial: Partial<SopItem> = {}): SopItem {
  return {
    id: 'i1',
    sopId: 's1',
    judul: 'Imam shalat fardhu',
    picNama: '',
    catatan: '',
    selesai: false,
    urutan: 1,
    ...parsial,
  };
}

describe('inputSopSah', () => {
  it('membersihkan spasi di awal/akhir', () => {
    expect(inputSopSah({ judul: '  SOP Piket  ', catatan: ' catatan ' })).toEqual({
      judul: 'SOP Piket',
      catatan: 'catatan',
    });
  });

  it('menolak judul kosong', () => {
    expect(() => inputSopSah({ judul: '   ' })).toThrow(SopError);
    expect(() => inputSopSah({ judul: '   ' })).toThrow(/Judul SOP wajib/);
  });
});

describe('inputItemSopSah', () => {
  it('membersihkan judul, PIC, dan catatan', () => {
    expect(inputItemSopSah({ judul: ' Imam shalat ', picNama: ' Ahmad ', catatan: ' giliran A ' })).toEqual({
      judul: 'Imam shalat',
      picNama: 'Ahmad',
      catatan: 'giliran A',
    });
  });

  it('PIC dan catatan boleh kosong, judul tetap wajib', () => {
    expect(inputItemSopSah({ judul: 'Piket' })).toEqual({ judul: 'Piket', picNama: '', catatan: '' });
    expect(() => inputItemSopSah({ judul: '' })).toThrow(/wajib diisi/);
  });
});

describe('ikhtisarCeklis', () => {
  it('menghitung total, selesai, dan persen', () => {
    const items = [item({ id: 'a', selesai: true }), item({ id: 'b' }), item({ id: 'c', selesai: true }), item({ id: 'd' })];
    expect(ikhtisarCeklis(items)).toEqual({ total: 4, selesai: 2, persen: 50 });
  });

  it('papan kosong = 0%, bukan NaN', () => {
    expect(ikhtisarCeklis([])).toEqual({ total: 0, selesai: 0, persen: 0 });
  });

  it('pembulatan persen tidak pernah pecahan', () => {
    const items = [item({ id: 'a' }), item({ id: 'b' }), item({ id: 'c', selesai: true })];
    expect(ikhtisarCeklis(items).persen).toBe(33);
  });
});

describe('perubahanCeklis', () => {
  it('mengisi selesaiPada saat dicentang', () => {
    const hasil = perubahanCeklis(item(), true, '2026-08-29T10:00:00.000Z');
    expect(hasil.selesai).toBe(true);
    expect(hasil.selesaiPada).toBe('2026-08-29T10:00:00.000Z');
  });

  it('menghapus selesaiPada saat diuncentang', () => {
    const hasil = perubahanCeklis(item({ selesai: true, selesaiPada: '2026-08-29T10:00:00.000Z' }), false);
    expect(hasil.selesai).toBe(false);
    expect(hasil.selesaiPada).toBeUndefined();
  });

  it('keadaan sama → objek dikembalikan apa adanya (referensi sama)', () => {
    const terisi = item({ selesai: true, selesaiPada: '2026-08-29T10:00:00.000Z' });
    expect(perubahanCeklis(terisi, true)).toBe(terisi);
    const belum = item();
    expect(perubahanCeklis(belum, false)).toBe(belum);
  });

  it('tanpa waktu eksplisit memakai waktu sekarang (ISO)', () => {
    const hasil = perubahanCeklis(item(), true);
    expect(hasil.selesaiPada).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('salinanSop', () => {
  it('judul diberi akhiran (Salinan), baku dilepas, urutan baru dipakai', () => {
    const hasil = salinanSop(sop(), [item(), item({ id: 'i2', urutan: 2 })], 5);
    expect(hasil.sop.judul).toBe('Amanah & Khidmah Santri (Salinan)');
    expect(hasil.sop.baku).toBe(false);
    expect(hasil.sop.urutan).toBe(5);
    expect(hasil.sop.id).not.toBe('s1');
  });

  it('item disalin dengan id & sopId baru, PIC ikut, ceklis DIRESET', () => {
    const sumber = sop({ id: 's1', baku: true });
    const items = [
      item({ id: 'i1', picNama: 'Ahmad', selesai: true, selesaiPada: '2026-08-29T10:00:00.000Z' }),
      item({ id: 'i2', urutan: 2 }),
    ];
    const hasil = salinanSop(sumber, items, 2);
    expect(hasil.item).toHaveLength(2);
    expect(hasil.item.map((i) => i.selesai)).toEqual([false, false]);
    expect(hasil.item.every((i) => i.selesaiPada === undefined)).toBe(true);
    expect(hasil.item.every((i) => i.sopId === hasil.sop.id)).toBe(true);
    expect(hasil.item.every((i) => i.id !== items[0].id && i.id !== items[1].id)).toBe(true);
    expect(hasil.item[0].picNama).toBe('Ahmad');
  });
});
