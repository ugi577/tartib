import { describe, expect, it } from 'vitest';
import { DIVISI_BAKU, JENIS_ACARA_BAKU, SOP_AMANAH_BAKU, TEMPLATE_CONTOH, TEMPLATE_PANDUAN } from './seed';
import { parseRumusQty } from '../lib/rumusQty';

describe('seed divisi baku', () => {
  it('berisi tepat 13 divisi', () => {
    expect(DIVISI_BAKU).toHaveLength(13);
  });

  it('nama divisi unik', () => {
    const nama = DIVISI_BAKU.map((d) => d.nama);
    expect(new Set(nama).size).toBe(nama.length);
  });

  it('mencakup divisi kunci dari BRIEF Bagian 8', () => {
    const nama = DIVISI_BAKU.map((d) => d.nama);
    expect(nama).toContain('Ketua Panitia');
    expect(nama).toContain('Sekretaris');
    expect(nama).toContain('Bendahara');
    expect(nama).toContain('Konsumsi');
    expect(nama).toContain('Dokumentasi & Live');
    expect(nama).toContain('Aroma & Suasana');
  });
});

describe('seed jenis acara', () => {
  it('berisi 8 jenis acara', () => {
    expect(JENIS_ACARA_BAKU).toHaveLength(8);
  });

  it('mencakup Tasyakuran Khatam dan Custom', () => {
    const nama = JENIS_ACARA_BAKU.map((j) => j.nama);
    expect(nama).toContain('Tasyakuran Khatam');
    expect(nama).toContain('Custom');
  });

  it('nama jenis acara unik', () => {
    const nama = JENIS_ACARA_BAKU.map((j) => j.nama);
    expect(new Set(nama).size).toBe(nama.length);
  });
});

describe('seed template contoh', () => {
  it('memiliki 4 fase berurutan H-30, H-7, H-0, H+1', () => {
    expect(TEMPLATE_CONTOH.fase.map((f) => ({ urutan: f.urutan, label: f.label, offsetHari: f.offsetHari }))).toEqual([
      { urutan: 1, label: 'Persiapan H-30', offsetHari: -30 },
      { urutan: 2, label: 'Persiapan H-7', offsetHari: -7 },
      { urutan: 3, label: 'Hari H', offsetHari: 0 },
      { urutan: 4, label: 'Evaluasi H+1', offsetHari: 1 },
    ]);
  });

  it('setiap fase punya minimal satu item', () => {
    for (const fase of TEMPLATE_CONTOH.fase) {
      expect(fase.items.length, `fase "${fase.label}" tanpa item`).toBeGreaterThan(0);
    }
  });

  it('setiap item merujuk divisi yang sah (urutan 1..13)', () => {
    for (const fase of TEMPLATE_CONTOH.fase) {
      for (const item of fase.items) {
        expect(item.divisiUrutan, `item "${item.judul}"`).toBeGreaterThanOrEqual(1);
        expect(item.divisiUrutan, `item "${item.judul}"`).toBeLessThanOrEqual(DIVISI_BAKU.length);
      }
    }
  });

  it('setiap rumusQty di template contoh dapat diparse (A-04)', () => {
    const konteks = { porsi: 100, santri: 50, panitia: 20, rsvp: 60 };
    for (const fase of TEMPLATE_CONTOH.fase) {
      for (const item of fase.items) {
        if (item.rumusQty !== undefined) {
          expect(typeof parseRumusQty(item.rumusQty, konteks), `rumus "${item.rumusQty}"`).toBe('number');
        }
      }
    }
  });
});

describe('seed template panduan manual (sesi 15)', () => {
  it('fase berurutan dengan offset monotonik dari H-30 sampai H+1', () => {
    expect(TEMPLATE_PANDUAN.fase.map((f) => f.offsetHari)).toEqual([-30, -14, -7, -1, 0, 1]);
    expect(TEMPLATE_PANDUAN.fase.map((f) => f.urutan)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('setiap fase punya minimal satu item dan merujuk divisi yang sah', () => {
    for (const fase of TEMPLATE_PANDUAN.fase) {
      expect(fase.items.length, `fase "${fase.label}" tanpa item`).toBeGreaterThan(0);
      for (const item of fase.items) {
        expect(item.divisiUrutan, `item "${item.judul}"`).toBeGreaterThanOrEqual(1);
        expect(item.divisiUrutan, `item "${item.judul}"`).toBeLessThanOrEqual(DIVISI_BAKU.length);
        expect(item.judul.trim(), `item fase "${fase.label}" kosong`).not.toBe('');
      }
    }
  });

  it('setiap item diawali "Contoh:" — teksnya jadi panduan pengisian manual', () => {
    for (const fase of TEMPLATE_PANDUAN.fase) {
      for (const item of fase.items) {
        expect(item.judul.startsWith('Contoh:'), `item "${item.judul}" tidak diawali "Contoh:"`).toBe(true);
      }
    }
  });

  it('jenis acaranya ada di daftar jenis baku (Custom)', () => {
    expect(JENIS_ACARA_BAKU.map((j) => j.nama)).toContain(TEMPLATE_PANDUAN.jenisAcaraNama);
  });

  it('total item template contoh minimal 20', () => {
    const total = TEMPLATE_CONTOH.fase.reduce((acc, f) => acc + f.items.length, 0);
    expect(total).toBeGreaterThanOrEqual(20);
  });
});

describe('seed papan amanah baku (Batch X)', () => {
  it('memiliki judul, catatan, dan minimal 8 amanah', () => {
    expect(SOP_AMANAH_BAKU.judul.trim()).not.toBe('');
    expect(SOP_AMANAH_BAKU.catatan.trim()).not.toBe('');
    expect(SOP_AMANAH_BAKU.items.length).toBeGreaterThanOrEqual(8);
  });

  it('judul amanah unik dan tidak ada yang kosong', () => {
    const judul = SOP_AMANAH_BAKU.items.map((i) => i.judul.trim());
    expect(judul.every((j) => j !== ''), 'ada amanah tanpa judul').toBe(true);
    expect(new Set(judul).size).toBe(judul.length);
  });

  it('mencakup amanah khidmah inti madrasah', () => {
    const judul = SOP_AMANAH_BAKU.items.map((i) => i.judul);
    expect(judul.some((j) => j.toLowerCase().includes('imam'))).toBe(true);
    expect(judul.some((j) => j.toLowerCase().includes('muadzin'))).toBe(true);
    expect(judul.some((j) => j.toLowerCase().includes('kebersihan'))).toBe(true);
  });
});
