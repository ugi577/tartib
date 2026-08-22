import { describe, expect, it } from 'vitest';
import { JUDUL_TITLE, PRESET_KATEGORI, susunHtmlKonfirmasi, type DataKonfirmasi } from './eKonfirmasi';

const DATA: DataKonfirmasi = {
  judulAcara: "Khataman Tasmi' 30 Juz & Maulid Nabi",
  tanggal: "Jum'at, 21 Agustus 2026 M / 8 Rabi'ul Awwal 1448 H",
  waktu: '07.00 WIB – selesai',
  tempat: 'Aula Ma\'had Askar Cansebu',
  mapsUrl: 'https://maps.app.goo.gl/abc',
  noWhatsApp: '6285223452257',
  bidang: [
    { label: 'Nama santri yang khatam', placeholder: 'mis. Ahmad' },
    { label: 'Jumlah santri yang khatam', tipe: 'pilihan', opsi: ['1', '2', '3'] },
  ],
};

describe('susunHtmlKonfirmasi', () => {
  it('title persis "e-Konfirmasi Kehadiran - Ma\'had Askar Qur\'an"', () => {
    const html = susunHtmlKonfirmasi(DATA);
    expect(html).toContain("<title>e-Konfirmasi Kehadiran - Ma'had Askar Qur'an</title>");
    expect(JUDUL_TITLE).toBe('e-Konfirmasi Kehadiran - Ma\'had Askar Qur\'an');
  });

  it('memuat judul acara, tanggal, dan info acara', () => {
    const html = susunHtmlKonfirmasi(DATA);
    expect(html).toContain("Khataman Tasmi' 30 Juz &amp; Maulid Nabi");
    expect(html).toContain("Jum'at, 21 Agustus 2026 M / 8 Rabi'ul Awwal 1448 H");
    expect(html).toContain('07.00 WIB – selesai');
    expect(html).toContain("Aula Ma'had Askar Cansebu");
    expect(html).toContain('maps.app.goo.gl/abc');
  });

  it('memuat bidang dasar (nama, kategori, jumlah) dan bidang custom', () => {
    const html = susunHtmlKonfirmasi(DATA);
    expect(html).toContain('Nama Lengkap');
    expect(html).toContain('Kategori Kedatangan');
    expect(html).toContain('Jumlah Orang');
    expect(html).toContain('Nama santri yang khatam');
    expect(html).toContain('mis. Ahmad');
    expect(html).toContain('Jumlah santri yang khatam');
    expect(html).toContain('<option value="2">2</option>');
  });

  it('meng-escape karakter HTML pada judul acara', () => {
    const html = susunHtmlKonfirmasi({ ...DATA, judulAcara: '<b>X</b> & "kutip"' });
    expect(html).not.toContain('<b>X</b>');
    expect(html).toContain('&lt;b&gt;X&lt;/b&gt;');
  });

  it('skrip WA memuat semua label bidang dan nomor tujuan', () => {
    const html = susunHtmlKonfirmasi(DATA);
    expect(html).toContain('"noWA":"6285223452257"');
    expect(html).toContain('"label":"Nama santri yang khatam"');
    expect(html).toContain("'https://wa.me/' + KONFIG.noWA");
  });

  it('tanpa maps dan nomor WA tetap sah', () => {
    const html = susunHtmlKonfirmasi({ ...DATA, mapsUrl: undefined, noWhatsApp: undefined });
    expect(html).not.toContain('maps.app.goo.gl');
    expect(html).not.toContain('"noWA":"628');
  });
});

describe('PRESET_KATEGORI', () => {
  it('punya preset untuk semua kategori baku kecuali Custom', () => {
    const nama = ['Tasyakuran Khatam', 'Maulid', 'Haflah', 'Wisuda', 'Dauroh', 'Rapat Wali Santri', 'PHBI'];
    for (const n of nama) {
      expect(PRESET_KATEGORI[n], `preset "${n}"`).toBeDefined();
      expect(PRESET_KATEGORI[n].length).toBeGreaterThan(0);
    }
    expect(PRESET_KATEGORI['Custom']).toBeUndefined();
  });
});
