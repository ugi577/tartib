// Menerapkan preset SOP menjadi Template nyata (sesi 22, temuan audit #4).
//
// Sebelumnya "Gunakan Template Ini" pada preset SOP hanya menampilkan
// notifikasi "siap digunakan di papan acara!" lalu pindah ke Acara — tidak
// ada satu baris pun yang ditulis. Kini preset dipetakan menjadi
// InputImporTemplate (fase ber-offsetHari + item per divisi) dan disimpan
// lewat templateService.imporTemplate — jalur yang sama dengan impor dokumen,
// sehingga hasilnya muncul di tab Template dan bisa dipakai membuat acara.
//
// Bagian murni (diuji di terapkanPresetSop.test.ts tanpa IndexedDB):
// - parseOffsetHari: 'H-30 s/d H-7' → -30 (angka PERTAMA), 'Hari-H' → 0,
//   'H+1' → +1, tanpa angka → null.
// - kelompokkanFasePreset: satu label fase = satu fase, urut kemunculan;
//   fase tanpa angka mengikuti `offsetHari` item, atau bertahap -7 / 0 / +1
//   dari fase sebelumnya.
// - cocokkanDivisi: nama seksi → divisi yang ada (persis, sinonim, awalan).
// - pilihJenisAcara: nama jenis yang termuat di nama preset, lalu 'Custom' /
//   'Lainnya', lalu jenis pertama.
// Bagian io: terapkanPresetSop — buat divisi yang belum ada, lalu impor.

import { daftarDivisi, tambahDivisi } from '../../services/divisiService';
import {
  daftarJenisAcara,
  imporTemplate,
  type InputFaseImpor,
  type InputImporTemplate,
} from '../../services/templateService';
import type { Divisi, JenisAcara, Template } from '../../types';
import type { ItemSopPreset, PresetSop } from './presetSop';

// ===== Fungsi murni =====

// Cocok paling kiri menang: 'H-30 s/d H-7' → H-30. "Hari-H" tidak dianggap
// H-<angka>; "Hari H+1" tetap +1 berkat lookahead negatif pada alternatif kedua.
const POLA_OFFSET = /\bH\s*([+\-–−])\s*(\d+)|\bHari[\s\-–]*H\b(?!\s*[+\-–−]\s*\d)/i;

/** Offset hari dari label fase; null bila label tidak memuat angka maupun 'Hari-H'. */
export function parseOffsetHari(label: string): number | null {
  const m = POLA_OFFSET.exec(label);
  if (!m) return null;
  if (m[2] === undefined) return 0; // 'Hari-H' / 'Hari H'
  const n = Number(m[2]);
  return m[1] === '+' ? n : -n;
}

export interface FasePreset {
  label: string;
  offsetHari: number;
  items: ItemSopPreset[];
}

/**
 * Kelompokkan item preset per label fase (urut kemunculan pertama) dan
 * tetapkan offsetHari tiap fase: `offsetHari` eksplisit pada item menang,
 * lalu angka dari label, lalu tebakan bertahap — fase pertama tanpa angka
 * -7, fase berikutnya 0 bila fase sebelumnya masih sebelum hari-H, selain itu
 * sehari setelah fase sebelumnya.
 */
export function kelompokkanFasePreset(items: readonly ItemSopPreset[]): FasePreset[] {
  const urutan: string[] = [];
  const perFase = new Map<string, { items: ItemSopPreset[]; eksplisit: number | undefined }>();
  for (const it of items) {
    const label = it.fase.trim();
    let f = perFase.get(label);
    if (!f) {
      f = { items: [], eksplisit: undefined };
      perFase.set(label, f);
      urutan.push(label);
    }
    f.items.push(it);
    if (f.eksplisit === undefined && typeof it.offsetHari === 'number') f.eksplisit = it.offsetHari;
  }

  const hasil: FasePreset[] = [];
  let sebelumnya: number | undefined;
  for (const label of urutan) {
    const f = perFase.get(label)!;
    let offset = f.eksplisit ?? parseOffsetHari(label);
    if (offset === null) {
      if (sebelumnya === undefined) offset = -7;
      else if (sebelumnya < 0) offset = 0;
      else offset = sebelumnya + 1;
    }
    hasil.push({ label, offsetHari: offset, items: f.items });
    sebelumnya = offset;
  }
  return hasil;
}

// Nama seksi preset → nama divisi baku (BRIEF Bagian 8) yang maknanya sama.
const SINONIM_SEKSI: Readonly<Record<string, string>> = {
  acara: 'Acara & MC',
  'acara & mc': 'Acara & MC',
  mc: 'Acara & MC',
  sekretariat: 'Sekretaris',
  perlengkapan: 'Perlengkapan & Sound',
  sound: 'Perlengkapan & Sound',
  'among tamu': 'Penerima Tamu',
  penyambutan: 'Penerima Tamu',
  dokumentasi: 'Dokumentasi & Live',
  media: 'Dokumentasi & Live',
  pimpinan: 'Ketua Panitia',
  ketua: 'Ketua Panitia',
  parkir: 'Parkir & Sandal',
};

function rapikan(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Cari divisi yang sudah ada untuk satu nama seksi: nama persis (abaikan
 * kapital), lalu tabel sinonim, lalu divisi yang namanya diawali nama seksi
 * ('Perlengkapan' → 'Perlengkapan & Sound'). undefined bila perlu dibuat.
 */
export function cocokkanDivisi(seksi: string, divisi: readonly Divisi[]): Divisi | undefined {
  const kunci = rapikan(seksi);
  if (!kunci) return undefined;
  const persis = divisi.find((d) => rapikan(d.nama) === kunci);
  if (persis) return persis;
  const sinonim = SINONIM_SEKSI[kunci];
  if (sinonim) {
    const lewatSinonim = divisi.find((d) => rapikan(d.nama) === rapikan(sinonim));
    if (lewatSinonim) return lewatSinonim;
  }
  return divisi.find((d) => rapikan(d.nama).startsWith(`${kunci} `));
}

/** Nama seksi unik dalam preset, urut kemunculan (dasar pembuatan divisi baru). */
export function daftarSeksiPreset(p: PresetSop): string[] {
  const hasil: string[] = [];
  for (const it of p.items) {
    const nama = it.seksi.trim();
    if (nama && !hasil.some((s) => rapikan(s) === rapikan(nama))) hasil.push(nama);
  }
  return hasil;
}

/**
 * Jenis acara untuk template hasil preset: jenis yang namanya termuat di
 * nama preset ('Dauroh / Kajian Akbar' → 'Dauroh'), lalu 'Custom'/'Lainnya',
 * lalu jenis pertama yang aktif. undefined bila belum ada jenis sama sekali.
 */
export function pilihJenisAcara(p: PresetSop, daftar: readonly JenisAcara[]): JenisAcara | undefined {
  const aktif = daftar.filter((j) => j.aktif);
  const kandidat = aktif.length > 0 ? aktif : daftar;
  const namaPreset = rapikan(p.nama);
  const cocokNama = kandidat.find((j) => {
    const n = rapikan(j.nama);
    return n.length >= 4 && namaPreset.includes(n);
  });
  if (cocokNama) return cocokNama;
  const umum = kandidat.find((j) => ['custom', 'lainnya', 'lain-lain', 'umum'].includes(rapikan(j.nama)));
  return umum ?? kandidat[0];
}

export interface PetaPresetSop {
  jenisAcaraId: string;
  /** Id divisi untuk satu nama seksi — semua seksi preset harus terpetakan. */
  divisiIdUntuk: (seksi: string) => string | undefined;
}

/**
 * Bangun InputImporTemplate dari preset (murni). Melempar Error bila ada
 * seksi yang tidak terpetakan ke divisi — terapkanPresetSop memastikan
 * semuanya ada lebih dulu.
 */
export function bangunInputImporDariPresetSop(p: PresetSop, peta: PetaPresetSop): InputImporTemplate {
  const fases: InputFaseImpor[] = kelompokkanFasePreset(p.items).map((f) => ({
    label: f.label,
    offsetHari: f.offsetHari,
    items: f.items.map((it) => {
      const divisiId = peta.divisiIdUntuk(it.seksi);
      if (!divisiId) throw new Error(`Seksi "${it.seksi}" belum terpetakan ke divisi`);
      return {
        judul: it.judul,
        catatan: it.catatan ?? '',
        divisiId,
        wajib: it.wajib ?? true,
      };
    }),
  }));
  return { jenisAcaraId: peta.jenisAcaraId, nama: p.nama, catatan: p.deskripsi, fases };
}

// ===== Akses data (io) =====

export interface HasilTerapkanPresetSop {
  template: Template;
  jumlahFase: number;
  jumlahItem: number;
  /** Nama divisi yang dibuat karena belum ada (mis. 'Kurikulum', 'Transportasi'). */
  divisiBaru: string[];
}

/**
 * Terapkan preset SOP: cocokkan/buat divisi per seksi, pilih jenis acara,
 * lalu simpan sebagai template baru (atomik di imporTemplate). Template
 * bernama sama boleh ada lebih dari satu — pengguna bebas menghapus di tab
 * Template.
 */
export async function terapkanPresetSop(p: PresetSop): Promise<HasilTerapkanPresetSop> {
  const jenis = pilihJenisAcara(p, await daftarJenisAcara());
  if (!jenis) throw new Error('Jenis acara belum tersedia — buka tab Template sekali agar data awal terpasang');

  const divisi = await daftarDivisi();
  const peta = new Map<string, string>();
  const divisiBaru: string[] = [];
  for (const seksi of daftarSeksiPreset(p)) {
    const ada = cocokkanDivisi(seksi, divisi);
    if (ada) {
      peta.set(rapikan(seksi), ada.id);
      continue;
    }
    // Berurutan (bukan Promise.all) agar urutan divisi tidak bertabrakan.
    const baru = await tambahDivisi({ nama: seksi });
    divisi.push(baru);
    peta.set(rapikan(seksi), baru.id);
    divisiBaru.push(baru.nama);
  }

  const input = bangunInputImporDariPresetSop(p, {
    jenisAcaraId: jenis.id,
    divisiIdUntuk: (seksi) => peta.get(rapikan(seksi)),
  });
  const template = await imporTemplate(input);
  return {
    template,
    jumlahFase: input.fases.length,
    jumlahItem: input.fases.reduce((n, f) => n + f.items.length, 0),
    divisiBaru,
  };
}
