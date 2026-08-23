import { describe, expect, it } from 'vitest';
import {
  AMBANG_HARI_PENGINGAT,
  bacaWaktuCadangan,
  catatWaktuCadangan,
  KUNCI_CADANGAN_TERAKHIR,
  statusPengingatCadangan,
} from './cadanganPengingat';
import type { Penyimpanan } from './gdrive';

function penyimpanan(awal: Record<string, string> = {}): Penyimpanan & { isi: Record<string, string> } {
  const isi = { ...awal };
  return {
    isi,
    getItem: (k) => (k in isi ? isi[k] : null),
    setItem: (k, v) => {
      isi[k] = v;
    },
    removeItem: (k) => {
      delete isi[k];
    },
  };
}

const HARI_INI = new Date('2026-08-23T10:00:00.000Z');

describe('catatWaktuCadangan & bacaWaktuCadangan', () => {
  it('menyimpan ISO dan membacanya kembali utuh', () => {
    const p = penyimpanan();
    catatWaktuCadangan(new Date('2026-08-01T03:04:05.000Z'), p);
    expect(p.isi[KUNCI_CADANGAN_TERAKHIR]).toBe('2026-08-01T03:04:05.000Z');
    expect(bacaWaktuCadangan(p)).toBe('2026-08-01T03:04:05.000Z');
  });

  it('kosong dan rusak sama-sama dibaca null', () => {
    expect(bacaWaktuCadangan(penyimpanan())).toBeNull();
    expect(bacaWaktuCadangan(penyimpanan({ [KUNCI_CADANGAN_TERAKHIR]: 'bukan-tanggal' }))).toBeNull();
  });
});

describe('statusPengingatCadangan', () => {
  it('belum pernah cadangan → perlu diingatkan', () => {
    const s = statusPengingatCadangan(null, HARI_INI);
    expect(s.umurHari).toBeNull();
    expect(s.perluIngatkan).toBe(true);
  });

  it('cadangan hari ini → tidak perlu diingatkan', () => {
    const s = statusPengingatCadangan('2026-08-23T02:00:00.000Z', HARI_INI);
    expect(s.umurHari).toBe(0);
    expect(s.perluIngatkan).toBe(false);
  });

  it(`umur ${AMBANG_HARI_PENGINGAT - 1} hari belum menggatkan; ${AMBANG_HARI_PENGINGAT} hari sudah`, () => {
    const s13 = statusPengingatCadangan('2026-08-10T09:00:00.000Z', HARI_INI);
    expect(s13.umurHari).toBe(13);
    expect(s13.perluIngatkan).toBe(false);
    const s14 = statusPengingatCadangan('2026-08-09T09:00:00.000Z', HARI_INI);
    expect(s14.umurHari).toBe(14);
    expect(s14.perluIngatkan).toBe(true);
  });

  it('waktu dari masa depan tidak menghasilkan umur negatif', () => {
    const s = statusPengingatCadangan('2026-08-30T10:00:00.000Z', HARI_INI);
    expect(s.umurHari).toBe(0);
    expect(s.perluIngatkan).toBe(false);
  });
});
