import { describe, expect, it } from 'vitest';
import {
  DAFTAR_KERTAS,
  KUNCI_KERTAS,
  aturanPage,
  bacaPilihanKertas,
  dimensiKertas,
  labelDimensi,
  mmKePx,
  normalisasiIdKertas,
  simpanPilihanKertas,
} from './kertas';

function simpananPalsu(awal: Record<string, string> = {}) {
  const data = { ...awal };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe('kertas — satu sumber ukuran cetak', () => {
  it('F4/Folio = 215 × 330 mm (ukuran folio Indonesia), A4 = 210 × 297', () => {
    expect(dimensiKertas('f4')).toEqual({ lebarMm: 215, tinggiMm: 330, marginMm: 10 });
    expect(dimensiKertas('a4')).toEqual({ lebarMm: 210, tinggiMm: 297, marginMm: 10 });
  });

  it('landscape menukar lebar & tinggi; kertas gulung mengabaikan orientasi', () => {
    expect(dimensiKertas('a4', 'landscape')).toEqual({ lebarMm: 297, tinggiMm: 210, marginMm: 10 });
    expect(dimensiKertas('thermal80', 'landscape')).toEqual({ lebarMm: 80, tinggiMm: null, marginMm: 2 });
  });

  it('aturan @page eksplisit dalam mm, tidak bersarang, gulung memakai tinggi nominal 297', () => {
    expect(aturanPage('a4')).toBe('@page { size: 210mm 297mm; margin: 10mm; }');
    expect(aturanPage('f4', 'landscape')).toBe('@page { size: 330mm 215mm; margin: 10mm; }');
    expect(aturanPage('thermal58')).toBe('@page { size: 58mm 297mm; margin: 2mm; }');
    expect(aturanPage('a5', 'portrait', 6)).toBe('@page { size: 148mm 210mm; margin: 6mm; }');
  });

  it('konversi mm → px memakai 96 dpi CSS', () => {
    expect(mmKePx(25.4)).toBeCloseTo(96, 6);
    expect(mmKePx(210)).toBeCloseTo(793.7, 1);
  });

  it('setiap kertas punya label & margin positif, id unik', () => {
    const ids = new Set(DAFTAR_KERTAS.map((k) => k.id));
    expect(ids.size).toBe(DAFTAR_KERTAS.length);
    for (const k of DAFTAR_KERTAS) {
      expect(k.label.length).toBeGreaterThan(0);
      expect(k.marginMm).toBeGreaterThan(0);
      expect(k.lebarMm).toBeGreaterThan(0);
    }
  });

  it('normalisasi id: nama lama "thermal" → thermal80, nilai asing → baku', () => {
    expect(normalisasiIdKertas('thermal')).toBe('thermal80');
    expect(normalisasiIdKertas('f4')).toBe('f4');
    expect(normalisasiIdKertas('b5')).toBe('a4');
    expect(normalisasiIdKertas(undefined, 'a5')).toBe('a5');
  });

  it('labelDimensi menyebut ukuran & orientasi dalam bahasa Indonesia', () => {
    expect(labelDimensi('a4')).toBe('A4 · 210 × 297 mm · tegak');
    expect(labelDimensi('f4', 'landscape')).toBe('F4 / Folio · 330 × 215 mm · mendatar');
    expect(labelDimensi('thermal80')).toBe('Thermal 80mm · lebar 80 mm · gulung');
  });

  it('preferensi perangkat: round-trip, nilai rusak/asing jatuh ke baku, tanpa simpanan aman', () => {
    const s = simpananPalsu();
    simpanPilihanKertas(s, { id: 'legal', orientasi: 'landscape' });
    expect(JSON.parse(s.data[KUNCI_KERTAS])).toEqual({ id: 'legal', orientasi: 'landscape' });
    expect(bacaPilihanKertas(s)).toEqual({ id: 'legal', orientasi: 'landscape' });

    expect(bacaPilihanKertas(simpananPalsu({ [KUNCI_KERTAS]: '{bukan json' }))).toEqual({ id: 'a4', orientasi: 'portrait' });
    expect(bacaPilihanKertas(simpananPalsu({ [KUNCI_KERTAS]: '{"id":"thermal","orientasi":"miring"}' }))).toEqual({
      id: 'thermal80',
      orientasi: 'portrait',
    });
    expect(bacaPilihanKertas(null, { id: 'f4', orientasi: 'portrait' })).toEqual({ id: 'f4', orientasi: 'portrait' });
  });
});
