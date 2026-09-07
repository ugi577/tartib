import { describe, it, expect, beforeEach } from 'vitest';
import { salinItem, potongItem, ambilKlipAktif, bersihkanKlip } from './appClipboard';

describe('appClipboard', () => {
  beforeEach(() => {
    bersihkanKlip();
  });

  it('menyimpan dan mengambil item yang disalin (Copy)', () => {
    expect(ambilKlipAktif()).toBeNull();

    salinItem('jabatan', { id: 'j-1', judul: 'Ketua' }, 'Ketua OSIS', 'j-1');

    const klip = ambilKlipAktif();
    expect(klip).not.toBeNull();
    expect(klip?.tipe).toBe('jabatan');
    expect(klip?.data).toEqual({ id: 'j-1', judul: 'Ketua' });
    expect(klip?.teks).toBe('Ketua OSIS');
    expect(klip?.isCut).toBe(false);
    expect(klip?.sumberId).toBe('j-1');
  });

  it('menyimpan dan menandai item yang dipotong (Cut)', () => {
    potongItem('sub-tugas', { id: 'sub-9', judul: 'Menyiapkan Mik' }, 'Menyiapkan Mik', 'sub-9');

    const klip = ambilKlipAktif();
    expect(klip).not.toBeNull();
    expect(klip?.tipe).toBe('sub-tugas');
    expect(klip?.isCut).toBe(true);
    expect(klip?.sumberId).toBe('sub-9');
  });

  it('membersihkan klip dengan bersihkanKlip()', () => {
    salinItem('kbm', { mapel: 'Fiqih' }, 'Fiqih');
    expect(ambilKlipAktif()).not.toBeNull();

    bersihkanKlip();
    expect(ambilKlipAktif()).toBeNull();
  });
});
