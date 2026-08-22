import { describe, expect, it } from 'vitest';
import type { StatusAcara, StatusRsvp, StatusTugas } from '../types';
import { KELAS, badgeStatusAcara, badgeStatusRsvp, badgeStatusTugas } from './kelas';

const SEMUA_ACARA: StatusAcara[] = ['DRAF', 'SIAP', 'BERJALAN', 'SELESAI', 'DIEVALUASI'];
const SEMUA_TUGAS: StatusTugas[] = ['BELUM', 'JALAN', 'SELESAI', 'BATAL'];
const SEMUA_RSVP: StatusRsvp[] = ['BELUM', 'HADIR', 'TIDAK_HADIR'];

describe('badge status', () => {
  it('setiap status acara punya badge, dan tidak ada dua status berwarna sama', () => {
    const hasil = SEMUA_ACARA.map(badgeStatusAcara);
    expect(hasil.every((k) => k.length > 0)).toBe(true);
    expect(new Set(hasil).size).toBe(SEMUA_ACARA.length);
  });

  it('setiap status tugas punya badge, dan tidak ada dua status berwarna sama', () => {
    const hasil = SEMUA_TUGAS.map(badgeStatusTugas);
    expect(new Set(hasil).size).toBe(SEMUA_TUGAS.length);
  });

  it('setiap status RSVP punya badge, dan tidak ada dua status berwarna sama', () => {
    const hasil = SEMUA_RSVP.map(badgeStatusRsvp);
    expect(new Set(hasil).size).toBe(SEMUA_RSVP.length);
  });

  it('semua badge memakai bentuk pil yang sama', () => {
    const semua = [...SEMUA_ACARA.map(badgeStatusAcara), ...SEMUA_TUGAS.map(badgeStatusTugas), ...SEMUA_RSVP.map(badgeStatusRsvp)];
    expect(semua.every((k) => k.includes('rounded-full') && k.includes('text-xs'))).toBe(true);
  });

  it('status yang bermakna sama di dua domain memakai warna yang sama', () => {
    // SELESAI di tugas dan HADIR di RSVP sama-sama "beres" → aksen.
    expect(badgeStatusTugas('SELESAI')).toBe(KELAS.badgeAksen);
    expect(badgeStatusRsvp('HADIR')).toBe(KELAS.badgeAksen);
    // BELUM selalu netral, di domain mana pun.
    expect(badgeStatusAcara('DRAF')).toBe(KELAS.badgeNetral);
    expect(badgeStatusTugas('BELUM')).toBe(KELAS.badgeNetral);
    expect(badgeStatusRsvp('BELUM')).toBe(KELAS.badgeNetral);
  });
});

describe('kelas tombol', () => {
  it('semua varian tombol memakai radius kontrol yang sama', () => {
    const tombol = [
      KELAS.tombolUtama,
      KELAS.tombolUtamaKecil,
      KELAS.tombolSekunder,
      KELAS.tombolSekunderKecil,
      KELAS.tombolHalus,
      KELAS.tombolBahaya,
      KELAS.tombolBahayaSolid,
      KELAS.tombolIkon,
    ];
    expect(tombol.every((k) => k.includes('rounded-kontrol'))).toBe(true);
  });

  it('hanya satu varian tombol memakai warna aksen pekat sebagai aksi utama', () => {
    expect(KELAS.tombolUtama).toContain('bg-aksen-600');
    expect(KELAS.tombolSekunder).not.toContain('bg-aksen');
    expect(KELAS.tombolHalus).not.toContain('bg-aksen');
  });
});
