// Test fungsi murni cadangan (susun/baca/hitung) — tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import {
  bacaCadangan,
  CadanganError,
  hitungBaris,
  namaBerkasCadangan,
  susunCadangan,
  TABEL_CADANGAN,
  VERSI_CADANGAN,
  type IsiCadangan,
} from './cadanganService';

function isiKosong(): IsiCadangan {
  const isi = {} as IsiCadangan;
  for (const nama of TABEL_CADANGAN) (isi as unknown as Record<string, unknown[]>)[nama] = [];
  return isi;
}

function isiContoh(): IsiCadangan {
  const isi = isiKosong();
  isi.divisi = [{ id: 'd1', nama: 'Konsumsi', tanggungJawab: '', urutan: 1, baku: true }];
  isi.template = [
    {
      id: 't1',
      jenisAcaraId: 'j1',
      nama: 'Tasyakuran',
      versi: 1,
      aktif: true,
      catatan: '',
      dibuatPada: '2026-08-22T00:00:00.000Z',
    },
  ];
  return isi;
}

describe('susunCadangan', () => {
  it('menandai berkas dengan nama aplikasi, versi, dan waktu', () => {
    const c = susunCadangan(isiKosong(), '2026-08-22T10:00:00.000Z');
    expect(c.aplikasi).toBe('tartib');
    expect(c.versi).toBe(VERSI_CADANGAN);
    expect(c.dibuatPada).toBe('2026-08-22T10:00:00.000Z');
  });
});

describe('hitungBaris', () => {
  it('menjumlah seluruh tabel', () => {
    expect(hitungBaris(isiKosong())).toBe(0);
    expect(hitungBaris(isiContoh())).toBe(2);
  });
});

describe('bacaCadangan', () => {
  it('bolak-balik dengan susunCadangan', () => {
    const asli = susunCadangan(isiContoh(), '2026-08-22T10:00:00.000Z');
    const kembali = bacaCadangan(JSON.stringify(asli));
    expect(kembali).toEqual(asli);
  });

  it('menolak berkas yang bukan JSON', () => {
    expect(() => bacaCadangan('bukan json')).toThrow(CadanganError);
  });

  it('menolak JSON dari aplikasi lain', () => {
    expect(() => bacaCadangan(JSON.stringify({ aplikasi: 'lain', versi: 1, isi: {} }))).toThrow(
      /bukan cadangan Tartib/,
    );
  });

  it('menolak versi yang tidak didukung', () => {
    const c = { ...susunCadangan(isiKosong(), ''), versi: 99 };
    expect(() => bacaCadangan(JSON.stringify(c))).toThrow(/tidak didukung/);
  });

  it('menolak berkas dengan tabel yang hilang', () => {
    const c = susunCadangan(isiKosong(), '');
    const rusak = JSON.parse(JSON.stringify(c)) as { isi: Record<string, unknown> };
    delete rusak.isi.tugas;
    expect(() => bacaCadangan(JSON.stringify(rusak))).toThrow(/"tugas"/);
  });

  it('menolak baris tanpa id — tidak bisa dipulihkan', () => {
    const isi = isiKosong();
    (isi as unknown as Record<string, unknown[]>).divisi = [{ nama: 'Tanpa id' }];
    expect(() => bacaCadangan(JSON.stringify(susunCadangan(isi, '')))).toThrow(/tanpa id/);
  });
});

describe('namaBerkasCadangan', () => {
  it('memakai tanggal ISO', () => {
    expect(namaBerkasCadangan('2026-08-22T10:00:00.000Z')).toBe('tartib-cadangan-2026-08-22.json');
  });

  it('tetap memberi nama walau waktu kosong', () => {
    expect(namaBerkasCadangan('')).toBe('tartib-cadangan-tanpa-tanggal.json');
  });
});
