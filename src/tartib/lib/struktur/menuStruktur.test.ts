// Test builder menu struktur (sesi 22) — murni, tanpa React/IndexedDB.
import { describe, expect, it } from 'vitest';
import type { ItemKlip } from '../clipboard/appClipboard';
import type { SopItem, SopSubItem } from '../../types';
import {
  bangunMenuArea,
  bangunMenuJabatan,
  bangunMenuSub,
  LABEL_BAGAN,
  LABEL_DAFTAR,
  type AksiMenuJabatan,
  type AksiMenuSub,
} from './menuStruktur';

function item(parsial: Partial<SopItem> = {}): SopItem {
  return { id: 'i1', sopId: 's1', judul: 'BENDAHARA', picNama: '', catatan: '', selesai: false, urutan: 1, ...parsial };
}

function sub(parsial: Partial<SopSubItem> = {}): SopSubItem {
  return { id: 'b1', sopId: 's1', itemId: 'i1', judul: 'Catat kas', picNama: '', catatan: '', selesai: false, urutan: 1, ...parsial };
}

const WAKTU = '2026-09-08T00:00:00.000Z';

function klipJabatan(isCut = false, id = 'i-lain'): ItemKlip {
  return { tipe: 'jabatan', id, sopId: 's1', judul: 'KETUA', isCut, waktu: WAKTU };
}

function klipSub(isCut = false, itemId = 'i-lain'): ItemKlip {
  return { tipe: 'sub-tugas', id: 'b-lain', itemId, sopId: 's1', judul: 'Rapat pekanan', isCut, waktu: WAKTU };
}

function aksiJabatan(): AksiMenuJabatan & { dipanggil: string[] } {
  const dipanggil: string[] = [];
  const buat = (nama: string) => () => {
    dipanggil.push(nama);
  };
  return {
    dipanggil,
    salin: buat('salin'),
    potong: buat('potong'),
    tempel: buat('tempel'),
    duplikat: buat('duplikat'),
    tambahSub: buat('tambahSub'),
    ubah: buat('ubah'),
    hapus: buat('hapus'),
  };
}

function aksiSub(): AksiMenuSub {
  const kosong = () => {};
  return { salin: kosong, potong: kosong, tempel: kosong, duplikat: kosong, ubah: kosong, hapus: kosong, centang: kosong };
}

describe('bangunMenuJabatan', () => {
  it('tanpa klip: Tempel nonaktif berlabel "Tempel"; tidak ada properti shortcut di mana pun', () => {
    const menu = bangunMenuJabatan({ item: item(), subs: [], klip: null, label: LABEL_BAGAN, aksi: aksiJabatan() });
    const tempel = menu.find((m) => m.label.startsWith('Tempel'));
    expect(tempel).toBeDefined();
    expect(tempel?.disabled).toBe(true);
    expect(tempel?.label).toBe('Tempel');
    expect(menu.every((m) => !('shortcut' in m))).toBe(true);
  });

  it('klip jabatan disalin: label menyebut isi klip, aktif, dan memanggil aksi.tempel', () => {
    const aksi = aksiJabatan();
    const menu = bangunMenuJabatan({ item: item(), subs: [], klip: klipJabatan(false), label: LABEL_BAGAN, aksi });
    const tempel = menu.find((m) => m.label.startsWith('Tempel'));
    expect(tempel?.label).toBe('Tempel jabatan "KETUA"');
    expect(tempel?.disabled).toBe(false);
    tempel?.onClick();
    expect(aksi.dipanggil).toEqual(['tempel']);
  });

  it('klip jabatan dipotong: label "Pindahkan … ke sini"; nonaktif bila sumber = tujuan', () => {
    const lain = bangunMenuJabatan({ item: item({ id: 'i1' }), subs: [], klip: klipJabatan(true, 'i-lain'), label: LABEL_BAGAN, aksi: aksiJabatan() });
    expect(lain.find((m) => m.label.startsWith('Pindahkan'))).toMatchObject({
      label: 'Pindahkan jabatan "KETUA" ke sini',
      disabled: false,
    });
    const diri = bangunMenuJabatan({ item: item({ id: 'i1' }), subs: [], klip: klipJabatan(true, 'i1'), label: LABEL_BAGAN, aksi: aksiJabatan() });
    expect(diri.find((m) => m.label.startsWith('Pindahkan'))?.disabled).toBe(true);
  });

  it('klip tugas dipotong pada jabatan: "Pindahkan tugas … ke sini"; nonaktif bila sudah di jabatan itu', () => {
    const menu = bangunMenuJabatan({ item: item({ id: 'i1' }), subs: [], klip: klipSub(true, 'i-lain'), label: LABEL_BAGAN, aksi: aksiJabatan() });
    expect(menu.find((m) => m.label.startsWith('Pindahkan'))).toMatchObject({
      label: 'Pindahkan tugas "Rapat pekanan" ke sini',
      disabled: false,
    });
    const sama = bangunMenuJabatan({ item: item({ id: 'i1' }), subs: [], klip: klipSub(true, 'i1'), label: LABEL_BAGAN, aksi: aksiJabatan() });
    expect(sama.find((m) => m.label.startsWith('Pindahkan'))?.disabled).toBe(true);
  });

  it('klip lintas tipe (kbm) tidak pernah bisa ditempel sebagai jabatan/tugas', () => {
    const klipKbm: ItemKlip = {
      tipe: 'kbm',
      entri: { id: 'e1', hari: 'Senin', jamKe: 1, kelas: 'VII-A', mapel: 'Nahwu' },
      isCut: false,
      waktu: WAKTU,
    };
    const menu = bangunMenuJabatan({ item: item(), subs: [], klip: klipKbm, label: LABEL_BAGAN, aksi: aksiJabatan() });
    expect(menu.find((m) => m.label.startsWith('Tempel'))?.disabled).toBe(true);
  });

  it('kosakata mengikuti label (Jabatan/Tugas vs Item/Sub-tugas); pemisah di posisi 4 & 7; Hapus terakhir & bahaya', () => {
    const bagan = bangunMenuJabatan({ item: item(), subs: [], klip: null, label: LABEL_BAGAN, aksi: aksiJabatan() });
    const daftar = bangunMenuJabatan({ item: item(), subs: [], klip: null, label: LABEL_DAFTAR, aksi: aksiJabatan() });
    expect(bagan.map((m) => m.label)).toEqual([
      'Salin Jabatan',
      'Potong Jabatan',
      'Duplikat Jabatan',
      'Tempel',
      '',
      '+ Tambah Tugas',
      'Ubah Jabatan',
      '',
      'Hapus Jabatan',
    ]);
    expect(daftar[0].label).toBe('Salin Item');
    expect(daftar[5].label).toBe('+ Tambah Sub-tugas');
    expect(daftar[8].label).toBe('Hapus Item');
    expect(bagan[4].pemisah).toBe(true);
    expect(bagan[7].pemisah).toBe(true);
    expect(bagan[8].bahaya).toBe(true);
  });
});

describe('bangunMenuSub', () => {
  it('hanya menerima klip tugas; klip jabatan → Tempel nonaktif', () => {
    const jabatan = bangunMenuSub({ induk: item(), sub: sub(), klip: klipJabatan(false), label: LABEL_BAGAN, aksi: aksiSub() });
    expect(jabatan.find((m) => m.label.startsWith('Tempel'))?.disabled).toBe(true);
    const tugas = bangunMenuSub({ induk: item({ id: 'i1' }), sub: sub(), klip: klipSub(false, 'i-lain'), label: LABEL_BAGAN, aksi: aksiSub() });
    expect(tugas.find((m) => m.label.startsWith('Tempel'))).toMatchObject({
      label: 'Tempel tugas "Rapat pekanan" di sini',
      disabled: false,
    });
  });

  it('label centang mengikuti keadaan sub; tanpa aksi.centang baris itu tidak ada', () => {
    const belum = bangunMenuSub({ induk: item(), sub: sub({ selesai: false }), klip: null, label: LABEL_BAGAN, aksi: aksiSub() });
    expect(belum.some((m) => m.label === 'Tandai selesai')).toBe(true);
    const sudah = bangunMenuSub({ induk: item(), sub: sub({ selesai: true }), klip: null, label: LABEL_BAGAN, aksi: aksiSub() });
    expect(sudah.some((m) => m.label === 'Tandai belum selesai')).toBe(true);
    const tanpa = bangunMenuSub({ induk: item(), sub: sub(), klip: null, label: LABEL_DAFTAR, aksi: { ...aksiSub(), centang: undefined } });
    expect(tanpa.some((m) => m.label.startsWith('Tandai'))).toBe(false);
    expect(tanpa[tanpa.length - 1].label).toBe('Hapus Sub-tugas');
  });
});

describe('bangunMenuArea', () => {
  const aksi = { tambah: () => {}, tempel: () => {}, bukaSemua: () => {}, modeDaftar: () => {} };

  it('hanya menerima klip jabatan; klip tugas → nonaktif dengan petunjuk', () => {
    const tugas = bangunMenuArea({ klip: klipSub(false), label: LABEL_BAGAN, aksi });
    expect(tugas[1].disabled).toBe(true);
    expect(tugas[1].label).toContain('pilih jabatan tujuan');
    const pindah = bangunMenuArea({ klip: klipJabatan(true), label: LABEL_BAGAN, aksi });
    expect(pindah[1]).toMatchObject({ label: 'Pindahkan jabatan "KETUA" ke papan ini', disabled: false });
    const salin = bangunMenuArea({ klip: klipJabatan(false), label: LABEL_BAGAN, aksi });
    expect(salin[1].label).toBe('Tempel jabatan "KETUA" di papan ini');
  });

  it('Buka/Tutup semua mengikuti keadaan; item opsional hilang bila aksinya tidak diberi', () => {
    const terbuka = bangunMenuArea({ klip: null, label: LABEL_BAGAN, semuaTerbuka: true, aksi });
    expect(terbuka.map((m) => m.label)).toEqual(['+ Tambah Jabatan', 'Tempel', '', 'Tutup semua tugas', 'Mode daftar & cetak']);
    const minimal = bangunMenuArea({ klip: null, label: LABEL_DAFTAR, aksi: { tambah: () => {}, tempel: () => {} } });
    expect(minimal.map((m) => m.label)).toEqual(['+ Tambah Item', 'Tempel']);
  });
});
