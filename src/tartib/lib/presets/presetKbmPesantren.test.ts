import { describe, it, expect, beforeEach } from 'vitest';
import type { ModelJadwalKbm } from '../../types/kbm';
import { DAFTAR_HARI_KBM } from '../kbm/hari';
import {
  PRESET_KBM_PESANTREN_2026_2027,
  DAFTAR_PRESET_KBM,
  bacaSemuaKatalogKbm,
  bacaDaftarTemplateKbmKustom,
  simpanTemplateKbmKustom,
  hapusTemplateKbmKustom,
  eksporJadwalJson,
  imporJadwalJson,
  KUNCI_STORAGE_TEMPLATE_KBM_KUSTOM,
} from './index';

describe('PRESET_KBM_PESANTREN_2026_2027', () => {
  it('memiliki 21 baris sesi waktu dan 7 hari penuh sesuai gambar', () => {
    expect(PRESET_KBM_PESANTREN_2026_2027.id).toBe('kbm-pesantren-2026-2027');
    expect(PRESET_KBM_PESANTREN_2026_2027.tahunAjaran).toBe('TAHUN AJARAN 2026-2027');
    expect(PRESET_KBM_PESANTREN_2026_2027.daftarHari).toHaveLength(7);
    expect(PRESET_KBM_PESANTREN_2026_2027.daftarJam).toHaveLength(21);
  });

  it('memiliki 8 nomor sesi resmi (1 sampai 8) pada daftar jam', () => {
    const nomorList = PRESET_KBM_PESANTREN_2026_2027.daftarJam
      .map((j) => j.nomorSesi)
      .filter((n): n is number => typeof n === 'number');

    expect(nomorList).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('memuat kegiatan kunci seperti Qiyamullail, Sabqi, Taklim, dan Tidur Malam', () => {
    const mapels = PRESET_KBM_PESANTREN_2026_2027.entri.map((e) => e.mapel);
    expect(mapels.some((m) => m.includes('Qiyamullail'))).toBe(true);
    expect(mapels.some((m) => m.includes('TAKLIM FIQIH'))).toBe(true);
    expect(mapels.some((m) => m.includes('Majelis SABQI PAGI'))).toBe(true);
    expect(mapels.some((m) => m.includes('Majelis MUROJAAH SABQI'))).toBe(true);
    expect(mapels.some((m) => m.includes('WAJIB TIDUR MALAM'))).toBe(true);
    expect(mapels.some((m) => m.includes('QOILULAH'))).toBe(true);
  });

  it('terdaftar sebagai pilihan pertama di DAFTAR_PRESET_KBM', () => {
    expect(DAFTAR_PRESET_KBM[0].id).toBe('kbm-pesantren-2026-2027');
  });

  it("memakai nama hari kanonik ('Jumat', bukan \"Jum'at\") di daftarHari dan entri", () => {
    expect(PRESET_KBM_PESANTREN_2026_2027.daftarHari).toEqual(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']);
    expect(PRESET_KBM_PESANTREN_2026_2027.entri.some((e) => e.hari === 'Jumat')).toBe(true);
  });
});

describe('Semua preset KBM bawaan', () => {
  it('hanya memakai nama hari kanonik', () => {
    for (const p of DAFTAR_PRESET_KBM) {
      for (const h of p.daftarHari) expect(DAFTAR_HARI_KBM).toContain(h);
      for (const e of p.entri) expect(p.daftarHari).toContain(e.hari);
    }
  });

  it('nomor baris `ke` unik per preset dan setiap entri merujuk baris yang ada', () => {
    for (const p of DAFTAR_PRESET_KBM) {
      const semuaKe = p.daftarJam.map((j) => j.ke);
      expect(new Set(semuaKe).size).toBe(semuaKe.length);
      for (const e of p.entri) expect(semuaKe).toContain(e.jamKe);
    }
  });

  it('tidak memuat nama pribadi guru — hanya peran generik atau kosong (aplikasi publik)', () => {
    // Sapaan yang lazim mendahului nama orang; peran generik ("Guru PAI",
    // "Musyrif Halaqah", "Pengampu Nahwu") tidak memakai sapaan ini.
    const polaNamaPribadi = /\b(Ust\.|Bu|Pak|Drs\.|Miss|Mr\.|KH\.|Kiai|Habib|Gus|Ning)\s+\S/;
    for (const p of DAFTAR_PRESET_KBM) {
      for (const e of p.entri) expect(e.guru ?? '').not.toMatch(polaNamaPribadi);
    }
  });
});

describe('Kustomisasi & Serialisasi Template Jadwal', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(KUNCI_STORAGE_TEMPLATE_KBM_KUSTOM);
    }
  });

  it('dapat mengekspor dan mengimpor jadwal JSON tanpa kehilangan data', () => {
    const jsonStr = eksporJadwalJson(PRESET_KBM_PESANTREN_2026_2027);
    expect(typeof jsonStr).toBe('string');

    const hasilImpor = imporJadwalJson(jsonStr);
    expect(hasilImpor.judul).toBe(PRESET_KBM_PESANTREN_2026_2027.judul);
    expect(hasilImpor.daftarHari).toEqual(PRESET_KBM_PESANTREN_2026_2027.daftarHari);
    expect(hasilImpor.daftarJam).toHaveLength(21);
    expect(hasilImpor.kustom).toBe(true);
  });

  it("menormalkan ejaan hari saat impor (\"Jum'at\" → 'Jumat', 'Minggu' → 'Ahad') dan membuang hari tak dikenal", () => {
    const teks = JSON.stringify({
      id: 'kbm-impor-uji',
      judul: 'Uji',
      daftarHari: ['Senin', "Jum'at", 'Minggu', 'Libur'],
      daftarJam: [{ ke: 1, label: '07.00' }],
      entri: [
        { id: 'a', hari: "Jum'at", jamKe: 1, kelas: 'A', mapel: 'Khutbah' },
        { id: 'b', hari: 'Libur', jamKe: 1, kelas: 'A', mapel: 'Buang' },
      ],
    });
    const hasil = imporJadwalJson(teks);
    expect(hasil.daftarHari).toEqual(['Senin', 'Jumat', 'Ahad']);
    expect(hasil.entri.map((e) => e.hari)).toEqual(['Jumat']);
    expect(hasil.id).toBe('kbm-impor-uji');
    expect(hasil.asalId).toBeUndefined();
  });

  it('impor JSON yang ber-id preset bawaan mendapat id baru dan asalId = preset itu', () => {
    const hasil = imporJadwalJson(eksporJadwalJson(PRESET_KBM_PESANTREN_2026_2027));
    expect(hasil.id).not.toBe(PRESET_KBM_PESANTREN_2026_2027.id);
    expect(hasil.asalId).toBe(PRESET_KBM_PESANTREN_2026_2027.id);
    expect(hasil.kustom).toBe(true);
  });

  it('impor menolak teks yang bukan JSON / bukan jadwal / tanpa hari dikenal dengan pesan yang jelas', () => {
    expect(() => imporJadwalJson('{bukan json')).toThrow(/bukan JSON/);
    expect(() => imporJadwalJson('{"judul":"x"}')).toThrow(/tidak valid/);
    expect(() => imporJadwalJson('{"daftarHari":["Libur"],"daftarJam":[],"entri":[]}')).toThrow(/nama hari/);
  });

  it('template kustom lama di storage yang masih memuat "Jum\'at" dinormalkan saat dibaca', () => {
    const legacy = JSON.parse(
      JSON.stringify({
        ...PRESET_KBM_PESANTREN_2026_2027,
        id: 'kbm-kustom-legacy',
        daftarHari: ['Senin', "Jum'at"],
        entri: [{ id: 'l1', hari: "Jum'at", jamKe: 1, kelas: 'A', mapel: 'Lama' }],
      }),
    ) as ModelJadwalKbm;
    simpanTemplateKbmKustom(legacy);
    const dibaca = bacaDaftarTemplateKbmKustom().find((t) => t.id === 'kbm-kustom-legacy');
    expect(dibaca?.daftarHari).toEqual(['Senin', 'Jumat']);
    expect(dibaca?.entri[0].hari).toBe('Jumat');
    hapusTemplateKbmKustom('kbm-kustom-legacy');
  });

  it('dapat menyimpan dan menghapus template kustom di storage', () => {
    const templateBaru = {
      ...PRESET_KBM_PESANTREN_2026_2027,
      id: 'kbm-kustom-tes-1',
      judul: 'Jadwal Santri Kustom Tes',
    };

    simpanTemplateKbmKustom(templateBaru);
    const tersimpan = bacaDaftarTemplateKbmKustom();
    expect(tersimpan.some((t) => t.id === 'kbm-kustom-tes-1')).toBe(true);

    const semua = bacaSemuaKatalogKbm();
    expect(semua.some((t) => t.id === 'kbm-kustom-tes-1')).toBe(true);

    hapusTemplateKbmKustom('kbm-kustom-tes-1');
    const setelahHapus = bacaDaftarTemplateKbmKustom();
    expect(setelahHapus.some((t) => t.id === 'kbm-kustom-tes-1')).toBe(false);
  });
});
