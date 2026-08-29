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

  it('ikut menghitung tabel SOP (Batch X)', () => {
    const isi = isiKosong();
    isi.sop = [
      { id: 's1', judul: 'Amanah & Khidmah Santri', catatan: '', baku: true, urutan: 1, dibuatPada: '2026-08-29T00:00:00.000Z' },
    ];
    isi.sopItem = [
      { id: 'i1', sopId: 's1', judul: 'Imam shalat fardhu', picNama: 'Ahmad', catatan: '', selesai: true, urutan: 1 },
    ];
    expect(hitungBaris(isi)).toBe(2);
  });
});

describe('bacaCadangan', () => {
  it('bolak-balik dengan susunCadangan', () => {
    const asli = susunCadangan(isiContoh(), '2026-08-22T10:00:00.000Z');
    const kembali = bacaCadangan(JSON.stringify(asli));
    expect(kembali).toEqual(asli);
  });

  it('bolak-balik dengan isi tabel SOP terisi', () => {
    const isi = isiContoh();
    isi.sop = [
      { id: 's1', judul: 'SOP Piket', catatan: '', baku: false, urutan: 1, dibuatPada: '2026-08-29T00:00:00.000Z' },
    ];
    isi.sopItem = [
      { id: 'i1', sopId: 's1', judul: 'Sapu keliling', picNama: '', catatan: '', selesai: false, urutan: 1 },
    ];
    const asli = susunCadangan(isi, '2026-08-29T10:00:00.000Z');
    expect(bacaCadangan(JSON.stringify(asli))).toEqual(asli);
  });

  /** Berkas cadangan v1: belum mengenal tabel SOP sama sekali. */
  function cadanganV1(isiTanpaSop: Record<string, unknown>): string {
    return JSON.stringify({ aplikasi: 'tartib', versi: 1, dibuatPada: '2026-08-22T10:00:00.000Z', isi: isiTanpaSop });
  }

  it('menerima cadangan lama v1 tanpa bagian SOP — bagian SOP dibaca kosong', () => {
    const isi = isiKosong();
    isi.divisi = [{ id: 'd1', nama: 'Konsumsi', tanggungJawab: '', urutan: 1, baku: true }];
    const isiMentah = { ...isi } as unknown as Record<string, unknown>;
    delete isiMentah.sop;
    delete isiMentah.sopItem;
    const kembali = bacaCadangan(cadanganV1(isiMentah));
    expect(kembali.versi).toBe(1);
    expect(kembali.isi.sop).toEqual([]);
    expect(kembali.isi.sopItem).toEqual([]);
    expect(kembali.isi.divisi).toHaveLength(1);
  });

  it('cadangan v1 yang kehilangan tabel lama tetap ditolak', () => {
    const isi = isiKosong() as unknown as Record<string, unknown>;
    delete isi.evaluasi;
    expect(() => bacaCadangan(cadanganV1(isi))).toThrow(/"evaluasi"/);
  });

  it('menerima cadangan v2 tanpa bagian sub-tugas — dibaca kosong (Batch Y)', () => {
    const isi = isiKosong();
    isi.sop = [
      { id: 's1', judul: 'Amanah & Khidmah Santri', catatan: '', baku: true, urutan: 1, dibuatPada: '2026-08-29T00:00:00.000Z' },
    ];
    const isiMentah = { ...isi } as unknown as Record<string, unknown>;
    delete isiMentah.sopSubItem;
    const kembali = bacaCadangan(
      JSON.stringify({ aplikasi: 'tartib', versi: 2, dibuatPada: '2026-08-29T10:00:00.000Z', isi: isiMentah }),
    );
    expect(kembali.versi).toBe(2);
    expect(kembali.isi.sopSubItem).toEqual([]);
    expect(kembali.isi.sop).toHaveLength(1);
  });

  it('v2 yang kehilangan bagian SOP (bukan sub-tugas) tetap ditolak', () => {
    const isi = isiKosong() as unknown as Record<string, unknown>;
    delete isi.sop;
    expect(() =>
      bacaCadangan(JSON.stringify({ aplikasi: 'tartib', versi: 2, dibuatPada: '', isi })),
    ).toThrow(/"sop"/);
  });

  it('round-trip v3 dengan sub-tugas terisi', () => {
    const isi = isiKosong();
    isi.sopSubItem = [
      { id: 'b1', sopId: 's1', itemId: 'i1', judul: 'Set azan', picNama: 'Fauzan', catatan: '', selesai: false, urutan: 1 },
    ];
    const asli = susunCadangan(isi, '2026-08-29T10:00:00.000Z');
    expect(bacaCadangan(JSON.stringify(asli))).toEqual(asli);
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
