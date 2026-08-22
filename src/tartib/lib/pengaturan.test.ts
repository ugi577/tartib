import { describe, expect, it } from 'vitest';
import {
  bacaPengaturan,
  barisKop,
  bersihkanPengaturan,
  hapusPengaturan,
  KUNCI_PENGATURAN,
  PENGATURAN_BAKU,
  simpanPengaturan,
} from './pengaturan';
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

describe('bersihkanPengaturan', () => {
  it('mengembalikan nilai baku untuk masukan bukan objek', () => {
    expect(bersihkanPengaturan(null)).toEqual(PENGATURAN_BAKU);
    expect(bersihkanPengaturan('teks')).toEqual(PENGATURAN_BAKU);
  });

  it('memangkas spasi dan membatasi panjang teks kop', () => {
    const p = bersihkanPengaturan({ organisasi: '  Ma’had Askar Qur’an  ', keteranganKop: 'x'.repeat(200) });
    expect(p.organisasi).toBe('Ma’had Askar Qur’an');
    expect(p.keteranganKop).toHaveLength(120);
  });

  it('mengklem angka di luar batas dan membulatkan pecahan', () => {
    const p = bersihkanPengaturan({ porsiCadangan: -5, porsiBufferPersen: 999 });
    expect(p.porsiCadangan).toBe(0);
    expect(p.porsiBufferPersen).toBe(200);
    expect(bersihkanPengaturan({ porsiCadangan: 12.6 }).porsiCadangan).toBe(13);
  });

  it('memakai nilai baku bila tipe salah', () => {
    const p = bersihkanPengaturan({ porsiCadangan: 'banyak', adaTimPencuci: 'ya' });
    expect(p.porsiCadangan).toBe(PENGATURAN_BAKU.porsiCadangan);
    expect(p.adaTimPencuci).toBe(PENGATURAN_BAKU.adaTimPencuci);
  });

  it('menerima angka dalam bentuk string (input HTML number)', () => {
    expect(bersihkanPengaturan({ porsiBufferPersen: '30' }).porsiBufferPersen).toBe(30);
  });
});

describe('baca/simpan pengaturan', () => {
  it('penyimpanan kosong menghasilkan nilai baku', () => {
    expect(bacaPengaturan(penyimpanan())).toEqual(PENGATURAN_BAKU);
  });

  it('JSON rusak tidak melempar — jatuh ke nilai baku', () => {
    expect(bacaPengaturan(penyimpanan({ [KUNCI_PENGATURAN]: '{rusak' }))).toEqual(PENGATURAN_BAKU);
  });

  it('bolak-balik: yang disimpan sama dengan yang dibaca', () => {
    const p = penyimpanan();
    const disimpan = simpanPengaturan(
      { organisasi: 'Panitia Khataman', keteranganKop: 'Cabang Pusat', porsiCadangan: 20, porsiBufferPersen: 30, adaTimPencuci: false },
      p,
    );
    expect(bacaPengaturan(p)).toEqual(disimpan);
  });

  it('menyimpan bentuk yang sudah dibersihkan, bukan masukan mentah', () => {
    const p = penyimpanan();
    simpanPengaturan({ ...PENGATURAN_BAKU, organisasi: '  Ma’had  ', porsiCadangan: -3 }, p);
    expect(JSON.parse(p.isi[KUNCI_PENGATURAN])).toMatchObject({ organisasi: 'Ma’had', porsiCadangan: 0 });
  });

  it('hapusPengaturan mengembalikan pembacaan ke nilai baku', () => {
    const p = penyimpanan();
    simpanPengaturan({ ...PENGATURAN_BAKU, organisasi: 'X' }, p);
    hapusPengaturan(p);
    expect(bacaPengaturan(p)).toEqual(PENGATURAN_BAKU);
  });
});

describe('barisKop', () => {
  it('membuang baris kosong', () => {
    expect(barisKop({ ...PENGATURAN_BAKU, organisasi: 'Lembaga', keteranganKop: '' })).toEqual(['Lembaga']);
    expect(barisKop(PENGATURAN_BAKU)).toEqual([]);
  });
});
