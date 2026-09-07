import { describe, it, expect, beforeEach } from 'vitest';
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
