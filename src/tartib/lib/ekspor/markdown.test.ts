// Test fungsi murni ekspor Markdown (Batch F) — tanpa IndexedDB.
import { describe, expect, it } from 'vitest';
import type { BukuAcara } from '../cetak/bukuAcara';
import { bukuAcaraKeMarkdown } from './markdown';

const buku: BukuAcara = {
  kop: {
    nama: 'Khatam Tasmi',
    jenisNama: 'Tasyakuran',
    tanggal: '2026-09-21',
    jam: '08:00–12:00',
    lokasi: 'Aula Utama',
    templateVersi: 3,
    status: 'SIAP',
  },
  bagian: [
    {
      faseUrutan: 1,
      faseLabel: 'Persiapan',
      offsetHari: -7,
      tanggalFase: '2026-09-14',
      kelompok: [
        {
          divisiId: 'd1',
          divisiNama: 'Konsumsi',
          tugas: [
            { urutan: 1, judul: 'Beli nasi', catatan: '100 porsi', wajib: true, status: 'SELESAI' },
            { urutan: 2, judul: 'Siapkan snack', catatan: '', wajib: false, status: 'BELUM' },
          ],
        },
      ],
    },
    {
      faseUrutan: 2,
      faseLabel: 'Hari H',
      offsetHari: 0,
      tanggalFase: '2026-09-21',
      kelompok: [],
    },
  ],
};

describe('bukuAcaraKeMarkdown', () => {
  it('dimulai dengan judul tingkat satu berisi nama acara', () => {
    const md = bukuAcaraKeMarkdown(buku, '22 Agustus 2026');
    expect(md.startsWith('# SOP ACARA — Khatam Tasmi\n')).toBe(true);
  });

  it('kop berisi jenis, tanggal, waktu, lokasi, versi, status, dan tanggal cetak', () => {
    const md = bukuAcaraKeMarkdown(buku, '22 Agustus 2026');
    expect(md).toContain('Tasyakuran · Hari-H 21 September 2026 · Waktu 08:00–12:00 · Lokasi Aula Utama');
    expect(md).toContain('Template v3 · Status SIAP · Dicetak 22 Agustus 2026');
  });

  it('setiap fase menjadi heading dua dengan label offset dan tanggal fase', () => {
    const md = bukuAcaraKeMarkdown(buku, '22 Agustus 2026');
    expect(md).toContain('## 1. Persiapan (H-7, 14 September 2026)');
    expect(md).toContain('## 2. Hari H (Hari H, 21 September 2026)');
  });

  it('tugas tampil sebagai item daftar dengan divisi, catatan, wajib, dan status', () => {
    const md = bukuAcaraKeMarkdown(buku, '22 Agustus 2026');
    expect(md).toContain('### Konsumsi');
    expect(md).toContain('- Beli nasi — 100 porsi _(wajib)_ Status: SELESAI');
    expect(md).toContain('- Siapkan snack Status: BELUM');
  });

  it('fase tanpa tugas diberi keterangan eksplisit', () => {
    const md = bukuAcaraKeMarkdown(buku, '22 Agustus 2026');
    expect(md).toContain('_Tidak ada tugas pada fase ini._');
  });

  it('menghasilkan teks UTF-8 yang berakhir baris baru dan tanpa spasi sisa', () => {
    const md = bukuAcaraKeMarkdown(buku, '22 Agustus 2026');
    expect(md.endsWith('\n')).toBe(true);
    expect(md.split('\n').every((l) => l === l.trimEnd())).toBe(true);
    // Bisa dikodekan ulang ke UTF-8 (bukan string rusak).
    expect(() => new TextEncoder().encode(md)).not.toThrow();
  });

  it('baris opsional (waktu/lokasi) dihilangkan bila kosong', () => {
    const tanpa = {
      ...buku,
      kop: { ...buku.kop, jam: '', lokasi: '' },
    };
    const md = bukuAcaraKeMarkdown(tanpa, '22 Agustus 2026');
    expect(md).toContain('Tasyakuran · Hari-H 21 September 2026');
    expect(md).not.toContain('Waktu');
    expect(md).not.toContain('Lokasi');
  });
});
