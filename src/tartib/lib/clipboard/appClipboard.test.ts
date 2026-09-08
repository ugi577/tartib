import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ambilKlip,
  ambilKlipTipe,
  bersihkanKlip,
  labelKlip,
  simpanKlip,
  subscribeKlip,
} from './appClipboard';

describe('appClipboard — papan klip internal bertipe', () => {
  beforeEach(() => {
    bersihkanKlip();
  });

  it('kosong pada awalnya; simpanKlip mengisi dengan isCut=false sebagai bawaan', () => {
    expect(ambilKlip()).toBeNull();
    const k = simpanKlip({ tipe: 'jabatan', id: 'j-1', sopId: 's-1', judul: 'KETUA' });
    expect(k.tipe).toBe('jabatan');
    expect(k.isCut).toBe(false);
    expect(typeof k.waktu).toBe('string');
    expect(ambilKlip()).toEqual(k);
  });

  it('Potong ditandai isCut=true', () => {
    simpanKlip({ tipe: 'sub-tugas', id: 'sub-9', itemId: 'j-1', sopId: 's-1', judul: 'Menyiapkan Mik', isCut: true });
    expect(ambilKlip()?.isCut).toBe(true);
  });

  it('ambilKlipTipe hanya mengembalikan klip bila tipenya cocok', () => {
    simpanKlip({ tipe: 'sub-tugas', id: 'sub-9', itemId: 'j-1', sopId: 's-1', judul: 'Mik' });
    expect(ambilKlipTipe('sub-tugas')?.itemId).toBe('j-1');
    expect(ambilKlipTipe('jabatan')).toBeNull();
    expect(ambilKlipTipe('kbm')).toBeNull();
  });

  it('klip kbm menyimpan salinan entri (bukan referensi yang sama)', () => {
    const entri = { id: 'e1', hari: 'Senin' as const, jamKe: 1, kelas: 'VII-A', mapel: 'Fiqih' };
    simpanKlip({ tipe: 'kbm', entri });
    const k = ambilKlipTipe('kbm');
    expect(k?.entri).toEqual(entri);
    expect(k?.entri).not.toBe(entri);
  });

  it('pendengar dipanggil saat klip diisi dan dibersihkan; berhenti setelah unsubscribe', () => {
    const fn = vi.fn();
    const lepas = subscribeKlip(fn);
    simpanKlip({ tipe: 'jabatan', id: 'j-1', sopId: 's-1', judul: 'KETUA' });
    bersihkanKlip();
    bersihkanKlip(); // sudah kosong — tidak menyiarkan lagi
    expect(fn).toHaveBeenCalledTimes(2);
    lepas();
    simpanKlip({ tipe: 'jabatan', id: 'j-2', sopId: 's-1', judul: 'WAKIL' });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('labelKlip menyebut jenis, judul, dan aksi', () => {
    expect(labelKlip(simpanKlip({ tipe: 'jabatan', id: 'j', sopId: 's', judul: 'KETUA', isCut: true }))).toBe(
      'Jabatan "KETUA" dipotong',
    );
    expect(labelKlip(simpanKlip({ tipe: 'sub-tugas', id: 'x', itemId: 'j', sopId: 's', judul: 'Mik' }))).toBe(
      'Tugas "Mik" disalin',
    );
    expect(
      labelKlip(simpanKlip({ tipe: 'kbm', entri: { id: 'e', hari: 'Senin', jamKe: 1, kelas: 'A', mapel: 'Fiqih' } })),
    ).toBe('Sesi "Fiqih" disalin');
  });
});
