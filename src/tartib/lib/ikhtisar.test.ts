// Test fungsi murni ikhtisar eksekusi (Batch T) — tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { Fase, Tugas } from '../types';
import { faseBerikutnya, faseHariIni, ikhtisarPerDivisi, ikhtisarTugas, statusWaktuFase } from './ikhtisar';

function tugas(divisiId: string, status: Tugas['status']): Tugas {
  return {
    id: `${divisiId}-${status}`,
    acaraId: 'a1',
    faseId: 'f1',
    divisiId,
    judul: 'Tugas',
    catatan: '',
    wajib: true,
    status,
    urutan: 1,
  };
}

function fase(id: string, urutan: number, offsetHari: number): Fase {
  return { id, templateId: 'a1', urutan, label: `Fase ${urutan}`, offsetHari };
}

describe('ikhtisarTugas', () => {
  it('daftar kosong menghasilkan nol semua tanpa pembagian nol', () => {
    expect(ikhtisarTugas([])).toEqual({ total: 0, belum: 0, jalan: 0, selesai: 0, batal: 0, persenSelesai: 0 });
  });

  it('menghitung per status dan persen selesai (BATAL dikecualikan dari penyebut)', () => {
    const daftar = [
      tugas('d1', 'SELESAI'),
      tugas('d1', 'SELESAI'),
      tugas('d1', 'SELESAI'),
      tugas('d1', 'SELESAI'),
      tugas('d1', 'JALAN'),
      tugas('d1', 'JALAN'),
      tugas('d1', 'BELUM'),
      tugas('d1', 'BELUM'),
      tugas('d1', 'BELUM'),
      tugas('d1', 'BATAL'),
    ];
    // 4 selesai / (10 - 1 batal) = 44,44% → floor 44
    expect(ikhtisarTugas(daftar)).toEqual({ total: 10, belum: 3, jalan: 2, selesai: 4, batal: 1, persenSelesai: 44 });
  });

  it('semua selesai = 100 persen', () => {
    const i = ikhtisarTugas([tugas('d1', 'SELESAI'), tugas('d2', 'SELESAI')]);
    expect(i.persenSelesai).toBe(100);
  });

  it('semua batal = penyebut nol, persen 0 (bukan NaN)', () => {
    const i = ikhtisarTugas([tugas('d1', 'BATAL'), tugas('d1', 'BATAL')]);
    expect(i.persenSelesai).toBe(0);
    expect(i.batal).toBe(2);
  });
});

describe('ikhtisarPerDivisi', () => {
  it('mengelompokkan per divisi, terurut asc menurut divisiId', () => {
    const hasil = ikhtisarPerDivisi([
      tugas('d2', 'SELESAI'),
      tugas('d1', 'BELUM'),
      tugas('d2', 'BELUM'),
      tugas('d1', 'SELESAI'),
    ]);
    expect(hasil).toEqual([
      { divisiId: 'd1', total: 2, selesai: 1, persenSelesai: 50 },
      { divisiId: 'd2', total: 2, selesai: 1, persenSelesai: 50 },
    ]);
  });

  it('daftar kosong menghasilkan array kosong', () => {
    expect(ikhtisarPerDivisi([])).toEqual([]);
  });
});

describe('statusWaktuFase', () => {
  it('offset 0 pada hari yang sama = HARI_INI', () => {
    expect(statusWaktuFase('2026-08-22', 0, '2026-08-22')).toBe('HARI_INI');
  });

  it('tanggal fase sudah lewat = LALU', () => {
    expect(statusWaktuFase('2026-08-22', -1, '2026-08-22')).toBe('LALU');
  });

  it('tanggal fase di depan = MENDATANG', () => {
    expect(statusWaktuFase('2026-08-22', 1, '2026-08-22')).toBe('MENDATANG');
  });

  it('geser bulan — H-7 dari 2026-09-10 jatuh tepat pada hariIni', () => {
    expect(statusWaktuFase('2026-09-10', -7, '2026-09-03')).toBe('HARI_INI');
  });
});

describe('faseHariIni', () => {
  it('memilih urutan terkecil di antara fase yang tanggalnya hari ini', () => {
    const fases = [fase('f3', 3, 0), fase('f1', 1, 0), fase('f2', 2, -5)];
    expect(faseHariIni(fases, '2026-08-22', '2026-08-22')?.id).toBe('f1');
  });

  it('null bila tidak ada fase hari ini', () => {
    expect(faseHariIni([fase('f1', 1, -30)], '2026-08-22', '2026-08-22')).toBeNull();
  });
});

describe('faseBerikutnya', () => {
  it('melewatkan fase yang sudah lewat, termasuk fase hari ini sebagai kandidat pertama', () => {
    const fases = [fase('f1', 1, -30), fase('f2', 2, 0), fase('f3', 3, 5)];
    expect(faseBerikutnya(fases, '2026-08-22', '2026-08-22')?.id).toBe('f2');
  });

  it('null bila semua fase sudah lewat', () => {
    expect(faseBerikutnya([fase('f1', 1, -2), fase('f2', 2, -1)], '2026-08-22', '2026-08-22')).toBeNull();
  });
});
