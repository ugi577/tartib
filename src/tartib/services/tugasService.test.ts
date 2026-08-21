// Test transisi status tugas (C-2) — fungsi murni, tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { Tugas } from '../types';
import { perubahanStatusTugas } from './tugasService';

function tugas(status: Tugas['status'], selesaiPada?: string): Tugas {
  return {
    id: 't1',
    acaraId: 'a1',
    faseId: 'f1',
    divisiId: 'd1',
    judul: 'Sewa tenda',
    catatan: '',
    wajib: true,
    status,
    selesaiPada,
    urutan: 1,
  };
}

describe('perubahanStatusTugas', () => {
  it('mengisi selesaiPada saat menjadi SELESAI', () => {
    const hasil = perubahanStatusTugas(tugas('JALAN'), 'SELESAI', '2026-08-22T10:00:00.000Z');
    expect(hasil.status).toBe('SELESAI');
    expect(hasil.selesaiPada).toBe('2026-08-22T10:00:00.000Z');
  });

  it('menghapus selesaiPada saat meninggalkan SELESAI', () => {
    const hasil = perubahanStatusTugas(tugas('SELESAI', '2026-08-22T10:00:00.000Z'), 'BATAL');
    expect(hasil.status).toBe('BATAL');
    expect(hasil.selesaiPada).toBeUndefined();
  });

  it('tidak menyentuh selesaiPada pada transisi antar status belum selesai', () => {
    const hasil = perubahanStatusTugas(tugas('BELUM'), 'JALAN');
    expect(hasil.status).toBe('JALAN');
    expect(hasil.selesaiPada).toBeUndefined();
  });

  it('status sama → objek dikembalikan tanpa perubahan (referensi sama)', () => {
    const t = tugas('JALAN');
    expect(perubahanStatusTugas(t, 'JALAN')).toBe(t);
    const tSelesai = tugas('SELESAI', '2026-08-22T10:00:00.000Z');
    expect(perubahanStatusTugas(tSelesai, 'SELESAI')).toBe(tSelesai);
    expect(perubahanStatusTugas(tSelesai, 'SELESAI').selesaiPada).toBe('2026-08-22T10:00:00.000Z');
  });

  it('selesaiPada default = waktu sekarang (ISO) bila tidak diberikan', () => {
    const hasil = perubahanStatusTugas(tugas('BELUM'), 'SELESAI');
    expect(typeof hasil.selesaiPada).toBe('string');
    expect(hasil.selesaiPada).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('siklus penuh BELUM → JALAN → SELESAI → BATAL → SELESAI', () => {
    let t = perubahanStatusTugas(tugas('BELUM'), 'JALAN');
    expect(t.status).toBe('JALAN');
    t = perubahanStatusTugas(t, 'SELESAI', '2026-08-22T11:00:00.000Z');
    expect(t.status).toBe('SELESAI');
    expect(t.selesaiPada).toBe('2026-08-22T11:00:00.000Z');
    t = perubahanStatusTugas(t, 'BATAL');
    expect(t.status).toBe('BATAL');
    expect(t.selesaiPada).toBeUndefined();
    t = perubahanStatusTugas(t, 'SELESAI', '2026-08-22T12:00:00.000Z');
    expect(t.status).toBe('SELESAI');
    expect(t.selesaiPada).toBe('2026-08-22T12:00:00.000Z');
  });

  it('mempertahankan bidang lain saat status berubah', () => {
    const asli = tugas('BELUM');
    const hasil = perubahanStatusTugas(asli, 'SELESAI', '2026-08-22T10:00:00.000Z');
    expect(hasil.id).toBe('t1');
    expect(hasil.acaraId).toBe('a1');
    expect(hasil.faseId).toBe('f1');
    expect(hasil.divisiId).toBe('d1');
    expect(hasil.judul).toBe('Sewa tenda');
    expect(hasil.wajib).toBe(true);
    expect(hasil.urutan).toBe(1);
  });
});
