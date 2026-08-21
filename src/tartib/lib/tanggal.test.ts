// Test utilitas tanggal (Batch C) — Gate C: "Tanggal tiap fase terhitung
// benar dari tanggal acara" diuji lewat geserTanggal murni.
import { describe, expect, it } from 'vitest';
import {
  formatOffsetHari,
  formatTanggalIndonesia,
  geserTanggal,
  tanggalHariIni,
  TanggalError,
} from './tanggal';

describe('geserTanggal', () => {
  it('offset 0 mengembalikan tanggal sama', () => {
    expect(geserTanggal('2026-08-22', 0)).toBe('2026-08-22');
  });

  it('offset negatif menghitung mundur (H-30, H-7)', () => {
    expect(geserTanggal('2026-08-22', -30)).toBe('2026-07-23');
    expect(geserTanggal('2026-08-22', -7)).toBe('2026-08-15');
  });

  it('offset positif menghitung maju (H+1)', () => {
    expect(geserTanggal('2026-08-22', 1)).toBe('2026-08-23');
  });

  it('melewati pergantian tahun', () => {
    expect(geserTanggal('2026-01-01', -1)).toBe('2025-12-31');
    expect(geserTanggal('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('menghormati tahun kabisat', () => {
    expect(geserTanggal('2028-02-28', 1)).toBe('2028-02-29');
    expect(geserTanggal('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('menolak format atau tanggal tak sah', () => {
    expect(() => geserTanggal('22-08-2026', 0)).toThrow(TanggalError);
    expect(() => geserTanggal('2026-13-01', 0)).toThrow(TanggalError);
    expect(() => geserTanggal('2026-02-30', 0)).toThrow(TanggalError);
    expect(() => geserTanggal('', 0)).toThrow(TanggalError);
  });

  it('menolak offset bukan bilangan bulat', () => {
    expect(() => geserTanggal('2026-08-22', 1.5)).toThrow(TanggalError);
    expect(() => geserTanggal('2026-08-22', Number.NaN)).toThrow(TanggalError);
  });
});

describe('formatTanggalIndonesia', () => {
  it('memformat dalam bahasa Indonesia', () => {
    expect(formatTanggalIndonesia('2026-08-22')).toBe('22 Agustus 2026');
    expect(formatTanggalIndonesia('2026-01-01')).toBe('1 Januari 2026');
  });

  it('menolak tanggal tak sah', () => {
    expect(() => formatTanggalIndonesia('2026-02-30')).toThrow(TanggalError);
  });
});

describe('formatOffsetHari', () => {
  it('melabeli Hari H dan offset relatif', () => {
    expect(formatOffsetHari(0)).toBe('Hari H');
    expect(formatOffsetHari(-30)).toBe('H-30');
    expect(formatOffsetHari(-7)).toBe('H-7');
    expect(formatOffsetHari(1)).toBe('H+1');
    expect(formatOffsetHari(2)).toBe('H+2');
  });
});

describe('tanggalHariIni', () => {
  it('berformat YYYY-MM-DD yang sah dan dapat digeser', () => {
    const hariIni = tanggalHariIni();
    expect(hariIni).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(geserTanggal(hariIni, 0)).toBe(hariIni);
  });
});
