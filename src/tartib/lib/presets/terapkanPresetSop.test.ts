import { describe, expect, it } from 'vitest';
import type { Divisi, JenisAcara } from '../../types';
import { DAFTAR_PRESET_SOP, PRESET_SOP_RESEPSI, type ItemSopPreset, type PresetSop } from './presetSop';
import {
  bangunInputImporDariPresetSop,
  cocokkanDivisi,
  daftarSeksiPreset,
  kelompokkanFasePreset,
  parseOffsetHari,
  pilihJenisAcara,
} from './terapkanPresetSop';

function item(fase: string, seksi = 'Acara', judul = 'Tugas', offsetHari?: number): ItemSopPreset {
  return { fase, seksi, judul, wajib: true, offsetHari };
}

function divisi(nama: string, urutan: number): Divisi {
  return { id: `d-${urutan}`, nama, tanggungJawab: '', urutan, baku: true };
}

const DIVISI_BAKU: Divisi[] = [
  divisi('Ketua Panitia', 1),
  divisi('Sekretaris', 2),
  divisi('Bendahara', 3),
  divisi('Acara & MC', 4),
  divisi('Konsumsi', 5),
  divisi('Perlengkapan & Sound', 6),
  divisi('Penerima Tamu', 7),
  divisi('Dokumentasi & Live', 10),
  divisi('Kesehatan', 11),
];

function jenis(nama: string, aktif = true): JenisAcara {
  return { id: `j-${nama.toLowerCase()}`, nama, deskripsi: '', aktif };
}

describe('parseOffsetHari', () => {
  it('mengambil angka PERTAMA pada rentang H-30 s/d H-7', () => {
    expect(parseOffsetHari('Fase Persiapan (H-30 s/d H-7)')).toBe(-30);
  });

  it('membaca H-1 dan H+1 di tengah label', () => {
    expect(parseOffsetHari('Fase Gladi & H-1')).toBe(-1);
    expect(parseOffsetHari('Pasca Acara (H+1)')).toBe(1);
    expect(parseOffsetHari('Kepulangan & H+1')).toBe(1);
  });

  it('Hari-H / Hari H bernilai 0 dan tidak dibaca sebagai H-<angka>', () => {
    expect(parseOffsetHari('Hari-H (Akad & Resepsi)')).toBe(0);
    expect(parseOffsetHari('Hari H')).toBe(0);
    expect(parseOffsetHari('Hari-H Keberangkatan')).toBe(0);
  });

  it('"Hari H+1" tetap +1, bukan 0', () => {
    expect(parseOffsetHari('Hari H+1')).toBe(1);
  });

  it('menerima spasi di sekitar tanda dan tanda minus panjang', () => {
    expect(parseOffsetHari('Persiapan H - 14')).toBe(-14);
    expect(parseOffsetHari('Pra-Ujian (H–7)')).toBe(-7);
  });

  it('null bila label tidak memuat angka maupun Hari-H', () => {
    expect(parseOffsetHari('Penutupan & Evaluasi')).toBeNull();
    expect(parseOffsetHari('Pasca Ujian (Koreksi & Nilai)')).toBeNull();
    expect(parseOffsetHari('')).toBeNull();
  });
});

describe('kelompokkanFasePreset', () => {
  it('satu label = satu fase, urut kemunculan pertama, item tetap berurutan', () => {
    const hasil = kelompokkanFasePreset([
      item('Hari-H', 'Acara', 'A'),
      item('Fase Persiapan (H-7)', 'Konsumsi', 'B'),
      item('Hari-H', 'Konsumsi', 'C'),
    ]);
    expect(hasil.map((f) => [f.label, f.offsetHari])).toEqual([
      ['Hari-H', 0],
      ['Fase Persiapan (H-7)', -7],
    ]);
    expect(hasil[0].items.map((i) => i.judul)).toEqual(['A', 'C']);
  });

  it('fase tanpa angka: bertahap -7, 0, +1', () => {
    const hasil = kelompokkanFasePreset([item('Persiapan'), item('Pelaksanaan'), item('Evaluasi')]);
    expect(hasil.map((f) => f.offsetHari)).toEqual([-7, 0, 1]);
  });

  it('fase tanpa angka setelah Hari-H menjadi sehari sesudahnya', () => {
    const hasil = kelompokkanFasePreset([item('H-14'), item('Hari-H Pelaksanaan'), item('Pasca Ujian'), item('Pleno')]);
    expect(hasil.map((f) => f.offsetHari)).toEqual([-14, 0, 1, 2]);
  });

  it('offsetHari eksplisit pada item mengalahkan angka di label', () => {
    const hasil = kelompokkanFasePreset([item('Penutupan & Evaluasi', 'Acara', 'A', 3), item('Hari-H', 'Acara', 'B', -2)]);
    expect(hasil.map((f) => f.offsetHari)).toEqual([3, -2]);
  });
});

describe('cocokkanDivisi', () => {
  it('nama persis (abaikan kapital & spasi ganda)', () => {
    expect(cocokkanDivisi('konsumsi', DIVISI_BAKU)?.nama).toBe('Konsumsi');
    expect(cocokkanDivisi('  Bendahara ', DIVISI_BAKU)?.nama).toBe('Bendahara');
  });

  it('sinonim seksi preset ke divisi baku', () => {
    expect(cocokkanDivisi('Sekretariat', DIVISI_BAKU)?.nama).toBe('Sekretaris');
    expect(cocokkanDivisi('Among Tamu', DIVISI_BAKU)?.nama).toBe('Penerima Tamu');
    expect(cocokkanDivisi('Penyambutan', DIVISI_BAKU)?.nama).toBe('Penerima Tamu');
    expect(cocokkanDivisi('Media', DIVISI_BAKU)?.nama).toBe('Dokumentasi & Live');
    expect(cocokkanDivisi('Pimpinan', DIVISI_BAKU)?.nama).toBe('Ketua Panitia');
  });

  it('awalan nama divisi ("Perlengkapan" → "Perlengkapan & Sound")', () => {
    expect(cocokkanDivisi('Perlengkapan', DIVISI_BAKU)?.nama).toBe('Perlengkapan & Sound');
    expect(cocokkanDivisi('Acara', DIVISI_BAKU)?.nama).toBe('Acara & MC');
    expect(cocokkanDivisi('Dokumentasi', DIVISI_BAKU)?.nama).toBe('Dokumentasi & Live');
  });

  it('undefined bila tidak ada padanan — harus dibuat baru', () => {
    expect(cocokkanDivisi('Kurikulum', DIVISI_BAKU)).toBeUndefined();
    expect(cocokkanDivisi('Transportasi', DIVISI_BAKU)).toBeUndefined();
    expect(cocokkanDivisi('', DIVISI_BAKU)).toBeUndefined();
  });
});

describe('daftarSeksiPreset', () => {
  it('unik, urut kemunculan, abaikan beda kapital', () => {
    const p: PresetSop = {
      ...PRESET_SOP_RESEPSI,
      items: [item('H-1', 'Acara'), item('H-1', 'acara'), item('H-1', 'Konsumsi'), item('H-1', 'Acara')],
    };
    expect(daftarSeksiPreset(p)).toEqual(['Acara', 'Konsumsi']);
  });
});

describe('pilihJenisAcara', () => {
  const DAFTAR = [jenis('Tasyakuran Khatam'), jenis('Dauroh'), jenis('Custom')];
  const dauroh: PresetSop = { ...PRESET_SOP_RESEPSI, nama: 'Dauroh / Kajian Akbar Islami' };

  it('nama jenis yang termuat di nama preset', () => {
    expect(pilihJenisAcara(dauroh, DAFTAR)?.nama).toBe('Dauroh');
  });

  it('jatuh ke Custom bila tidak ada yang cocok, lalu ke jenis pertama', () => {
    expect(pilihJenisAcara(PRESET_SOP_RESEPSI, DAFTAR)?.nama).toBe('Custom');
    expect(pilihJenisAcara(PRESET_SOP_RESEPSI, [jenis('Maulid'), jenis('Wisuda')])?.nama).toBe('Maulid');
  });

  it('mengabaikan jenis nonaktif; undefined bila kosong', () => {
    expect(pilihJenisAcara(dauroh, [jenis('Dauroh', false), jenis('Custom')])?.nama).toBe('Custom');
    expect(pilihJenisAcara(dauroh, [])).toBeUndefined();
  });
});

describe('bangunInputImporDariPresetSop', () => {
  const peta = {
    jenisAcaraId: 'j-custom',
    divisiIdUntuk: (seksi: string) => cocokkanDivisi(seksi, DIVISI_BAKU)?.id,
  };

  it('memetakan preset Resepsi menjadi 4 fase ber-offset dengan 16 item', () => {
    const input = bangunInputImporDariPresetSop(PRESET_SOP_RESEPSI, peta);
    expect(input.nama).toBe(PRESET_SOP_RESEPSI.nama);
    expect(input.catatan).toBe(PRESET_SOP_RESEPSI.deskripsi);
    expect(input.jenisAcaraId).toBe('j-custom');
    expect(input.fases.map((f) => [f.label, f.offsetHari])).toEqual([
      ['Fase Persiapan (H-30 s/d H-7)', -30],
      ['Fase Gladi & H-1', -1],
      ['Hari-H (Akad & Resepsi)', 0],
      ['Pasca Acara (H+1)', 1],
    ]);
    expect(input.fases.reduce((n, f) => n + f.items.length, 0)).toBe(16);
    const undangan = input.fases[0].items.find((i) => i.judul.startsWith('Penyebaran undangan'))!;
    expect(undangan).toMatchObject({ divisiId: 'd-2', wajib: false, catatan: '' });
  });

  it('wajib bawaan true bila preset tidak menyebut', () => {
    const p: PresetSop = { ...PRESET_SOP_RESEPSI, items: [{ fase: 'Hari-H', seksi: 'Konsumsi', judul: 'Hidangkan' }] };
    expect(bangunInputImporDariPresetSop(p, peta).fases[0].items[0].wajib).toBe(true);
  });

  it('melempar bila ada seksi yang belum terpetakan ke divisi', () => {
    const p: PresetSop = { ...PRESET_SOP_RESEPSI, items: [item('Hari-H', 'Kurikulum')] };
    expect(() => bangunInputImporDariPresetSop(p, peta)).toThrow(/Kurikulum/);
  });

  it('seluruh preset bawaan: offset fase tidak pernah mundur dan tiap fase punya item', () => {
    for (const p of DAFTAR_PRESET_SOP) {
      const fases = kelompokkanFasePreset(p.items);
      expect(fases.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < fases.length; i += 1) {
        expect(fases[i].offsetHari).toBeGreaterThanOrEqual(fases[i - 1].offsetHari);
      }
      for (const f of fases) expect(f.items.length).toBeGreaterThan(0);
    }
  });
});
