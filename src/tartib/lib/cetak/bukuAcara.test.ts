// Test fungsi murni buku acara (Batch F) — tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { Acara, Divisi, Fase, Tugas } from '../../types';
import { susunBukuAcara } from './bukuAcara';

const acara: Acara = {
  id: 'a1',
  nama: 'Khatam Tasmi',
  jenisAcaraId: 'j1',
  templateId: 't1',
  templateVersi: 3,
  tanggal: '2026-09-21',
  jamMulai: '08:00',
  jamSelesai: '12:00',
  lokasi: 'Aula Utama',
  status: 'SIAP',
  dibuatPada: '2026-01-01T00:00:00.000Z',
};

const divisi: Divisi[] = [
  { id: 'd1', nama: 'Konsumsi', tanggungJawab: 'Makan', urutan: 1, baku: true },
  { id: 'd2', nama: 'Kebersihan', tanggungJawab: 'Bersih', urutan: 2, baku: true },
];

const fases: Fase[] = [
  { id: 'f1', templateId: 't1', urutan: 1, label: 'Persiapan', offsetHari: -7 },
  { id: 'f2', templateId: 't1', urutan: 2, label: 'Hari H', offsetHari: 0 },
];

function tugas(divisiId: string, faseId: string, urutan: number, judul = 'Tugas', catatan = ''): Tugas {
  return {
    id: `${divisiId}-${faseId}-${urutan}`,
    acaraId: 'a1',
    faseId,
    divisiId,
    judul,
    catatan,
    wajib: true,
    status: 'BELUM',
    urutan,
  };
}

describe('susunBukuAcara', () => {
  it('kop terisi dari acara dan jenisNama, jam digabung dengan en-dash', () => {
    const buku = susunBukuAcara({ acara, jenisNama: 'Tasyakuran', fases, divisi, tugas: [] });
    expect(buku.kop).toEqual({
      nama: 'Khatam Tasmi',
      jenisNama: 'Tasyakuran',
      tanggal: '2026-09-21',
      jam: '08:00–12:00',
      lokasi: 'Aula Utama',
      templateVersi: 3,
      status: 'SIAP',
    });
  });

  it('jam kosong bila acara tanpa jam mulai', () => {
    const tanpaJam = { ...acara, jamMulai: '', jamSelesai: '' };
    const buku = susunBukuAcara({ acara: tanpaJam, jenisNama: 'X', fases, divisi, tugas: [] });
    expect(buku.kop.jam).toBe('');
  });

  it('satu bagian per fase terurut urutan, tanggal fase dihitung dari offset', () => {
    const buku = susunBukuAcara({ acara, jenisNama: 'X', fases, divisi, tugas: [] });
    expect(buku.bagian.map((b) => b.faseLabel)).toEqual(['Persiapan', 'Hari H']);
    expect(buku.bagian[0].tanggalFase).toBe('2026-09-14'); // H-7
    expect(buku.bagian[1].tanggalFase).toBe('2026-09-21'); // hari-H
  });

  it('tugas dikelompokkan per divisi (urut divisi baku), tugas urut nomor urut', () => {
    const buku = susunBukuAcara({
      acara,
      jenisNama: 'X',
      fases,
      divisi,
      tugas: [
        tugas('d2', 'f1', 2, 'Rapikan aula'),
        tugas('d1', 'f1', 2, 'Siapkan snack'),
        tugas('d1', 'f1', 1, 'Beli nasi'),
        tugas('d2', 'f2', 1, 'Sapu setelah acara'),
      ],
    });
    const bagian1 = buku.bagian[0];
    expect(bagian1.kelompok.map((k) => k.divisiNama)).toEqual(['Konsumsi', 'Kebersihan']);
    expect(bagian1.kelompok[0].tugas.map((t) => t.judul)).toEqual(['Beli nasi', 'Siapkan snack']);
    expect(bagian1.kelompok[1].tugas.map((t) => t.judul)).toEqual(['Rapikan aula']);
    expect(buku.bagian[1].kelompok[0].tugas.map((t) => t.judul)).toEqual(['Sapu setelah acara']);
  });

  it('fase tanpa tugas tetap menjadi bagian dengan kelompok kosong (struktur SOP utuh)', () => {
    const fasesKosong: Fase[] = [{ id: 'f9', templateId: 't1', urutan: 9, label: 'Purnabakti', offsetHari: 1 }];
    const buku = susunBukuAcara({ acara, jenisNama: 'X', fases: fasesKosong, divisi, tugas: [] });
    expect(buku.bagian).toHaveLength(1);
    expect(buku.bagian[0].kelompok).toEqual([]);
  });

  it('divisi tanpa tugas di sebuah fase tidak muncul di fase itu', () => {
    const buku = susunBukuAcara({
      acara,
      jenisNama: 'X',
      fases,
      divisi,
      tugas: [tugas('d1', 'f1', 1, 'Beli nasi')],
    });
    expect(buku.bagian[0].kelompok.map((k) => k.divisiId)).toEqual(['d1']);
    expect(buku.bagian[1].kelompok).toEqual([]);
  });

  it('fase tidak urut di input tetap keluar urut sesuai urutan fase', () => {
    const fasesAcak: Fase[] = [
      { id: 'f2', templateId: 't1', urutan: 2, label: 'Hari H', offsetHari: 0 },
      { id: 'f1', templateId: 't1', urutan: 1, label: 'Persiapan', offsetHari: -7 },
    ];
    const buku = susunBukuAcara({ acara, jenisNama: 'X', fases: fasesAcak, divisi, tugas: [] });
    expect(buku.bagian.map((b) => b.faseLabel)).toEqual(['Persiapan', 'Hari H']);
  });
});
