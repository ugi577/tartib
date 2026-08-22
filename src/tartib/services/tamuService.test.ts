// Test rekap kelompok tamu (Batch D) — fungsi murni, tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { KelompokTamu, Rsvp } from '../types';
import { hitungRekapKelompok, totalRombonganHadir } from './tamuService';

function kelompok(id: string, nama: string, targetUndangan: number): KelompokTamu {
  return { id, acaraId: 'a1', nama, targetUndangan, catatan: '' };
}

function rsvp(id: string, kelompokId: string, status: Rsvp['status'], jumlahRombongan: number): Rsvp {
  return { id, acaraId: 'a1', kelompokId, namaTamu: `Tamu ${id}`, kontak: '', status, jumlahRombongan, catatan: '' };
}

const KELOMPOK = [kelompok('k1', 'Wali Santri', 100), kelompok('k2', 'Tokoh Masyarakat', 30)];

describe('hitungRekapKelompok', () => {
  it('menghitung diundang/jumlahRsvp/terkonfirmasi/totalRombongan per kelompok', () => {
    const rsvpList = [
      rsvp('r1', 'k1', 'HADIR', 2),
      rsvp('r2', 'k1', 'HADIR', 1),
      rsvp('r3', 'k1', 'TIDAK_HADIR', 1),
      rsvp('r4', 'k1', 'BELUM', 1),
      rsvp('r5', 'k2', 'HADIR', 4),
    ];
    const hasil = hitungRekapKelompok(KELOMPOK, rsvpList);
    expect(hasil).toEqual([
      { kelompok: KELOMPOK[0], diundang: 100, jumlahRsvp: 4, terkonfirmasi: 2, totalRombongan: 3 },
      { kelompok: KELOMPOK[1], diundang: 30, jumlahRsvp: 1, terkonfirmasi: 1, totalRombongan: 4 },
    ]);
  });

  it('kelompok tanpa RSVP menghasilkan nol, bukan error', () => {
    const hasil = hitungRekapKelompok(KELOMPOK, []);
    expect(hasil.every((r) => r.jumlahRsvp === 0 && r.terkonfirmasi === 0 && r.totalRombongan === 0)).toBe(true);
  });

  it('TIDAK_HADIR dan BELUM tidak menyumbang totalRombongan', () => {
    const rsvpList = [rsvp('r1', 'k1', 'TIDAK_HADIR', 5), rsvp('r2', 'k1', 'BELUM', 5)];
    const hasil = hitungRekapKelompok(KELOMPOK, rsvpList);
    expect(hasil[0].totalRombongan).toBe(0);
    expect(hasil[0].jumlahRsvp).toBe(2);
    expect(hasil[0].terkonfirmasi).toBe(0);
  });
});

describe('totalRombonganHadir', () => {
  it('menjumlahkan totalRombongan lintas kelompok (fixture 21 Agustus: 130)', () => {
    const rsvpList = [rsvp('r1', 'k1', 'HADIR', 100), rsvp('r2', 'k2', 'HADIR', 30)];
    const rekap = hitungRekapKelompok(KELOMPOK, rsvpList);
    expect(totalRombonganHadir(rekap)).toBe(130);
  });

  it('nol bila tidak ada rekap', () => {
    expect(totalRombonganHadir([])).toBe(0);
  });
});
