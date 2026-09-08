// Test service SOP (Batch X/Y) — fungsi murni, tanpa IndexedDB.
// Sesi 22: perhitungan urutan penyisipan & salinan item/sub-tugas yang dipakai
// operasi transaksional duplikat/salin/pindah.
import { describe, expect, it } from 'vitest';
import type { Sop, SopItem, SopSubItem } from '../types';
import {
  AKHIRAN_SALINAN,
  akhiranSalinan,
  bangunStrukturImporPapan,
  ikhtisarCeklis,
  inputItemSopSah,
  inputSubItemSopSah,
  inputSopSah,
  perubahanCeklis,
  salinanItem,
  salinanSop,
  salinanSubItem,
  sisipkanUrutan,
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

function sub(parsial: Partial<SopSubItem> = {}): SopSubItem {
  return {
    id: 'b1',
    sopId: 's1',
    itemId: 'i1',
    judul: 'Set azan Maghrib',
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
  it('membersihkan judul, PIC, catatan, dan rutin', () => {
    expect(
      inputItemSopSah({ judul: ' Imam shalat ', picNama: ' Ahmad ', catatan: ' giliran A ', rutin: ' Harian ' }),
    ).toEqual({ judul: 'Imam shalat', picNama: 'Ahmad', catatan: 'giliran A', rutin: 'Harian' });
  });

  it('PIC, catatan, dan rutin boleh kosong, judul tetap wajib', () => {
    expect(inputItemSopSah({ judul: 'Piket' })).toEqual({
      judul: 'Piket',
      picNama: '',
      catatan: '',
      rutin: '',
    });
    expect(() => inputItemSopSah({ judul: '' })).toThrow(/wajib diisi/);
  });
});

describe('inputSubItemSopSah', () => {
  it('membersihkan sub-tugas; judul wajib', () => {
    expect(inputSubItemSopSah({ judul: ' Set azan ', picNama: 'Fauzan' })).toEqual({
      judul: 'Set azan',
      picNama: 'Fauzan',
      catatan: '',
    });
    expect(() => inputSubItemSopSah({ judul: '  ' })).toThrow(/sub-tugas wajib diisi/);
  });
});

describe('ikhtisarCeklis', () => {
  it('menghitung total, selesai, dan persen', () => {
    const items = [item({ id: 'a', selesai: true }), item({ id: 'b' }), item({ id: 'c', selesai: true }), item({ id: 'd' })];
    expect(ikhtisarCeklis(items)).toEqual({ total: 4, selesai: 2, persen: 50 });
  });

  it('menghitung campuran item dan sub-tugas (Batch Y)', () => {
    const rows = [item({ selesai: true }), sub({ selesai: true }), sub({ id: 'b2' })];
    expect(ikhtisarCeklis(rows)).toEqual({ total: 3, selesai: 2, persen: 67 });
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

  it('juga bekerja untuk sub-tugas (Batch Y)', () => {
    const hasil = perubahanCeklis(sub(), true, '2026-08-29T11:00:00.000Z');
    expect(hasil.selesai).toBe(true);
    expect(hasil.selesaiPada).toBe('2026-08-29T11:00:00.000Z');
  });

  it('tanpa waktu eksplisit memakai waktu sekarang (ISO)', () => {
    const hasil = perubahanCeklis(item(), true);
    expect(hasil.selesaiPada).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('salinanSop', () => {
  it('judul diberi akhiran (Salinan), baku dilepas, urutan baru dipakai', () => {
    const hasil = salinanSop(sop(), [item(), item({ id: 'i2', urutan: 2 })], [], 5);
    expect(hasil.sop.judul).toBe('Amanah & Khidmah Santri (Salinan)');
    expect(hasil.sop.baku).toBe(false);
    expect(hasil.sop.urutan).toBe(5);
    expect(hasil.sop.id).not.toBe('s1');
  });

  it('item disalin dengan id & sopId baru, PIC & rutin ikut, ceklis DIRESET', () => {
    const sumber = sop({ id: 's1', baku: true });
    const items = [
      item({ id: 'i1', picNama: 'Ahmad', rutin: 'Harian', selesai: true, selesaiPada: '2026-08-29T10:00:00.000Z' }),
      item({ id: 'i2', urutan: 2 }),
    ];
    const hasil = salinanSop(sumber, items, [], 2);
    expect(hasil.item).toHaveLength(2);
    expect(hasil.item.map((i) => i.selesai)).toEqual([false, false]);
    expect(hasil.item.every((i) => i.selesaiPada === undefined)).toBe(true);
    expect(hasil.item.every((i) => i.sopId === hasil.sop.id)).toBe(true);
    expect(hasil.item.every((i) => i.id !== items[0].id && i.id !== items[1].id)).toBe(true);
    expect(hasil.item[0].picNama).toBe('Ahmad');
    expect(hasil.item[0].rutin).toBe('Harian');
  });

  it('sub-tugas ikut disalin ke item induk yang benar, ceklis direstrukturisasi ulang (Batch Y)', () => {
    const sumber = sop({ id: 's1' });
    const items = [item({ id: 'i1' }), item({ id: 'i2', urutan: 2 })];
    const subs = [
      sub({ id: 'b1', itemId: 'i1', picNama: 'Fauzan', selesai: true }),
      sub({ id: 'b2', itemId: 'i2', urutan: 1 }),
    ];
    const hasil = salinanSop(sumber, items, subs, 3);
    expect(hasil.subItem).toHaveLength(2);
    const indukBaru = new Map([
      ['i1', hasil.item[0].id],
      ['i2', hasil.item[1].id],
    ]);
    expect(hasil.subItem[0].itemId).toBe(indukBaru.get('i1'));
    expect(hasil.subItem[1].itemId).toBe(indukBaru.get('i2'));
    expect(hasil.subItem.every((s) => s.sopId === hasil.sop.id)).toBe(true);
    expect(hasil.subItem.every((s) => s.selesai === false && s.selesaiPada === undefined)).toBe(true);
    expect(hasil.subItem[0].picNama).toBe('Fauzan');
  });
});

describe('bangunStrukturImporPapan (Batch Y)', () => {
  it('membangun papan kustom + item + sub dengan urutan rapi', () => {
    const hasil = bangunStrukturImporPapan({
      judul: ' SOP Jaga Malam ',
      catatan: 'prosedur malam',
      items: [
        { judul: 'Keliling asrama', picNama: 'Fauzan', rutin: 'Harian', sub: [{ judul: 'Catat tamu' }] },
        { judul: 'Lapor ke temanasma' },
      ],
    });
    expect(hasil.sop.judul).toBe('SOP Jaga Malam');
    expect(hasil.sop.baku).toBe(false);
    expect(hasil.item.map((i) => ({ judul: i.judul, urutan: i.urutan }))).toEqual([
      { judul: 'Keliling asrama', urutan: 1 },
      { judul: 'Lapor ke temanasma', urutan: 2 },
    ]);
    expect(hasil.item[0].picNama).toBe('Fauzan');
    expect(hasil.item[0].rutin).toBe('Harian');
    expect(hasil.subItem).toHaveLength(1);
    expect(hasil.subItem[0].itemId).toBe(hasil.item[0].id);
    expect(hasil.subItem[0].urutan).toBe(1);
    expect(hasil.item.every((i) => i.selesai === false)).toBe(true);
  });

  it('menolak judul papan atau judul item kosong', () => {
    expect(() => bangunStrukturImporPapan({ judul: '  ', items: [] })).toThrow(SopError);
    expect(() => bangunStrukturImporPapan({ judul: 'SOP', items: [{ judul: '' }] })).toThrow(SopError);
  });
});

// ===== Sesi 22: salin / pindah item & sub-tugas =====

describe('akhiranSalinan (sesi 22)', () => {
  it('wadah sama → "(Salinan)", wadah beda → judul apa adanya', () => {
    expect(akhiranSalinan('s1', 's1')).toBe(AKHIRAN_SALINAN);
    expect(akhiranSalinan('s1', 's2')).toBe('');
  });

  it('akhiran eksplisit (termasuk kosong) selalu menang', () => {
    expect(akhiranSalinan('s1', 's1', '')).toBe('');
    expect(akhiranSalinan('s1', 's2', ' (2)')).toBe(' (2)');
  });
});

describe('sisipkanUrutan (sesi 22)', () => {
  const daftar = [
    { id: 'a', urutan: 1 },
    { id: 'b', urutan: 2 },
    { id: 'c', urutan: 3 },
    { id: 'd', urutan: 4 },
  ];

  it('menyisipkan tepat setelah acuan dan menggeser baris sesudahnya', () => {
    expect(sisipkanUrutan(daftar, 'b')).toEqual({
      urutanBaru: 3,
      geser: [
        { id: 'c', urutan: 4 },
        { id: 'd', urutan: 5 },
      ],
    });
  });

  it('acuan di paling bawah → tidak ada yang digeser', () => {
    expect(sisipkanUrutan(daftar, 'd')).toEqual({ urutanBaru: 5, geser: [] });
  });

  it('daftar tidak terurut dan nomor berlubang tetap benar (urut berdasarkan urutan, bukan posisi array)', () => {
    const acak = [
      { id: 'z', urutan: 10 },
      { id: 'x', urutan: 2 },
      { id: 'y', urutan: 7 },
    ];
    expect(sisipkanUrutan(acak, 'x')).toEqual({
      urutanBaru: 3,
      geser: [
        { id: 'y', urutan: 4 },
        { id: 'z', urutan: 5 },
      ],
    });
  });

  it('nomor kembar dari data lama ikut terurai', () => {
    const kembar = [
      { id: 'a', urutan: 1 },
      { id: 'b', urutan: 1 },
      { id: 'c', urutan: 2 },
    ];
    const hasil = sisipkanUrutan(kembar, 'a');
    expect(hasil.urutanBaru).toBe(2);
    expect(hasil.geser).toEqual([
      { id: 'b', urutan: 3 },
      { id: 'c', urutan: 4 },
    ]);
  });

  it('acuan tidak ada → SopError', () => {
    expect(() => sisipkanUrutan(daftar, 'tidak-ada')).toThrow(SopError);
  });
});

describe('salinanItem (sesi 22)', () => {
  const sumber = item({
    id: 'i1',
    sopId: 's1',
    judul: 'BENDAHARA',
    picNama: 'Fulan',
    rutin: 'Pengurus Inti',
    selesai: true,
    selesaiPada: '2026-09-01T00:00:00.000Z',
    urutan: 2,
  });
  const subs = [
    sub({ id: 'b1', itemId: 'i1', judul: 'Catat kas', selesai: true, selesaiPada: '2026-09-01T00:00:00.000Z', urutan: 1 }),
    sub({ id: 'b2', itemId: 'i1', judul: 'Lapor bulanan', urutan: 2 }),
  ];

  it('id baru, sopId & urutan tujuan, judul berakhiran (Salinan), ceklis DIRESET, PIC & rutin ikut', () => {
    const hasil = salinanItem(sumber, subs, { sopId: 's1', urutan: 3 });
    expect(hasil.item.id).not.toBe('i1');
    expect(hasil.item.sopId).toBe('s1');
    expect(hasil.item.urutan).toBe(3);
    expect(hasil.item.judul).toBe('BENDAHARA (Salinan)');
    expect(hasil.item.selesai).toBe(false);
    expect(hasil.item.selesaiPada).toBeUndefined();
    expect(hasil.item.picNama).toBe('Fulan');
    expect(hasil.item.rutin).toBe('Pengurus Inti');
  });

  it('sub-tugas ikut dengan id baru, menunjuk item baru, sopId tujuan, urutan asli, ceklis direset', () => {
    const hasil = salinanItem(sumber, subs, { sopId: 's2', urutan: 1, akhiran: '' });
    expect(hasil.subItem).toHaveLength(2);
    expect(hasil.subItem.every((s) => s.itemId === hasil.item.id && s.sopId === 's2')).toBe(true);
    expect(hasil.subItem.map((s) => s.id)).not.toContain('b1');
    expect(hasil.subItem.map((s) => s.urutan)).toEqual([1, 2]);
    expect(hasil.subItem.every((s) => s.selesai === false && s.selesaiPada === undefined)).toBe(true);
    expect(hasil.item.judul).toBe('BENDAHARA'); // akhiran '' = judul apa adanya
  });

  it('rutin bisa ditimpa (tier tempat menempel) atau dikosongkan; undefined = rutin sumber', () => {
    expect(salinanItem(sumber, [], { sopId: 's1', urutan: 9, rutin: 'Divisi' }).item.rutin).toBe('Divisi');
    expect(salinanItem(sumber, [], { sopId: 's1', urutan: 9, rutin: '' }).item.rutin).toBeUndefined();
    expect(salinanItem(sumber, [], { sopId: 's1', urutan: 9 }).item.rutin).toBe('Pengurus Inti');
  });

  it('menolak sub-tugas milik item lain (bukti snapshot basi)', () => {
    const asing = sub({ id: 'b9', itemId: 'i-lain' });
    expect(() => salinanItem(sumber, [asing], { sopId: 's1', urutan: 3 })).toThrow(SopError);
  });
});

describe('salinanSubItem (sesi 22)', () => {
  const sumber = sub({
    id: 'b1',
    itemId: 'i1',
    sopId: 's1',
    judul: 'Set azan',
    picNama: 'Fauzan',
    selesai: true,
    selesaiPada: 'x',
    urutan: 4,
  });

  it('id baru, induk & papan tujuan, urutan tujuan, ceklis direset, PIC ikut', () => {
    const hasil = salinanSubItem(sumber, { itemId: 'i2', sopId: 's2', urutan: 1, akhiran: '' });
    expect(hasil.id).not.toBe('b1');
    expect(hasil.itemId).toBe('i2');
    expect(hasil.sopId).toBe('s2');
    expect(hasil.urutan).toBe(1);
    expect(hasil.judul).toBe('Set azan');
    expect(hasil.selesai).toBe(false);
    expect(hasil.selesaiPada).toBeUndefined();
    expect(hasil.picNama).toBe('Fauzan');
  });

  it('tanpa akhiran eksplisit judul diberi (Salinan)', () => {
    expect(salinanSubItem(sumber, { itemId: 'i1', sopId: 's1', urutan: 5 }).judul).toBe('Set azan (Salinan)');
  });
});
