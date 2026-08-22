// Test fungsi murni lembar tugas per PIC (Batch F) — tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { Acara, AcaraDivisi, Divisi, Fase, Tugas } from '../../types';
import { susunLembarTugas } from './lembarTugas';

const acara: Acara = {
  id: 'a1',
  nama: 'Khatam Tasmi',
  jenisAcaraId: 'j1',
  templateId: 't1',
  templateVersi: 1,
  tanggal: '2026-09-21',
  jamMulai: '08:00',
  jamSelesai: '12:00',
  lokasi: 'Aula',
  status: 'SIAP',
  dibuatPada: '2026-01-01T00:00:00.000Z',
};

const divisi: Divisi[] = [
  { id: 'd1', nama: 'Konsumsi', tanggungJawab: 'Makan', urutan: 1, baku: true },
  { id: 'd2', nama: 'Kebersihan', tanggungJawab: 'Bersih', urutan: 2, baku: true },
  { id: 'd3', nama: 'Dokumentasi', tanggungJawab: 'Foto', urutan: 3, baku: true },
];

const fases: Fase[] = [
  { id: 'f1', templateId: 't1', urutan: 1, label: 'Persiapan', offsetHari: -7 },
  { id: 'f2', templateId: 't1', urutan: 2, label: 'Hari H', offsetHari: 0 },
];

function tugas(divisiId: string, faseId: string, urutan: number, judul = 'Tugas'): Tugas {
  return {
    id: `${divisiId}-${faseId}-${urutan}`,
    acaraId: 'a1',
    faseId,
    divisiId,
    judul,
    catatan: '',
    wajib: true,
    status: 'BELUM',
    urutan,
  };
}

function barisDivisi(divisiId: string, picNama: string, picKontak = ''): AcaraDivisi {
  return { id: `ad-${divisiId}`, acaraId: 'a1', divisiId, picNama, picKontak, catatan: '' };
}

describe('susunLembarTugas', () => {
  it('satu lembar per PIC berisi hanya tugas divisinya, diurutkan per fase lalu urutan tugas', () => {
    const hasil = susunLembarTugas({
      acara,
      fases,
      divisi,
      acaraDivisi: [barisDivisi('d1', 'Budi'), barisDivisi('d2', 'Siti')],
      tugas: [
        tugas('d2', 'f1', 2, 'Rapikan aula'),
        tugas('d1', 'f1', 1, 'Beli nasi'),
        tugas('d2', 'f2', 1, 'Sapu setelah acara'),
        tugas('d1', 'f1', 2, 'Siapkan snack'),
      ],
    });
    expect(hasil).toHaveLength(2);
    expect(hasil[0].picNama).toBe('Budi');
    expect(hasil[0].divisiNama).toBe('Konsumsi');
    expect(hasil[0].tugas.map((t) => t.judul)).toEqual(['Beli nasi', 'Siapkan snack']);
    expect(hasil[1].picNama).toBe('Siti');
    expect(hasil[1].divisiNama).toBe('Kebersihan');
    // Tugas divisi lain tidak bocor ke lembar PIC lain.
    expect(hasil[1].tugas.map((t) => t.judul)).toEqual(['Rapikan aula', 'Sapu setelah acara']);
  });

  it('lembar urut sesuai urutan divisi baku, bukan urutan baris acaraDivisi', () => {
    const hasil = susunLembarTugas({
      acara,
      fases,
      divisi,
      acaraDivisi: [barisDivisi('d3', 'Rina'), barisDivisi('d1', 'Budi')],
      tugas: [],
    });
    expect(hasil.map((l) => l.picNama)).toEqual(['Budi', 'Rina']);
  });

  it('baris PIC dengan nama kosong tidak menghasilkan lembar', () => {
    const hasil = susunLembarTugas({
      acara,
      fases,
      divisi,
      acaraDivisi: [barisDivisi('d1', ''), barisDivisi('d2', 'Siti')],
      tugas: [],
    });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].picNama).toBe('Siti');
  });

  it('lembar tetap muncul walau divisinya belum punya tugas (daftar kosong)', () => {
    const hasil = susunLembarTugas({
      acara,
      fases,
      divisi,
      acaraDivisi: [barisDivisi('d3', 'Rina')],
      tugas: [tugas('d1', 'f1', 1)],
    });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].tugas).toEqual([]);
  });

  it('tugas dari fase yang tidak dikenal ditaruh paling akhir', () => {
    const hasil = susunLembarTugas({
      acara,
      fases,
      divisi,
      acaraDivisi: [barisDivisi('d1', 'Budi')],
      tugas: [tugas('d1', 'f2', 1, 'Hari H'), tugas('d1', 'f-hilang', 5, 'Tanpa fase')],
    });
    expect(hasil[0].tugas.map((t) => t.judul)).toEqual(['Hari H', 'Tanpa fase']);
    expect(hasil[0].tugas[1].faseLabel).toBe('Fase tidak ditemukan');
  });

  it('kontak PIC ikut dibawa ke lembar', () => {
    const hasil = susunLembarTugas({
      acara,
      fases,
      divisi,
      acaraDivisi: [barisDivisi('d1', 'Budi', '0812-3456')],
      tugas: [],
    });
    expect(hasil[0].picKontak).toBe('0812-3456');
  });
});
