// Importer PAPAN SOP berdiri sendiri (Batch Y) — kebalikan tulisDocxSop.
//
// Dua jalur, pola yang sama dengan importer template (Batch V/W):
// 1. Berkas ekspor Tartib membawa entry `tartib/sop.json` berisi SELURUH data
//    papan (PIC, rutin, catatan, sub-tugas) — round-trip penuh tanpa tebakan.
// 2. Berkas Word biasa jatuh ke heuristik document.xml:
//    - item = paragraf berawalan ☐ (U+2610);
//    - sub-tugas = item berawalan "↳" — melekat pada item sebelumnya;
//    - atribut dalam satu baris diurai: "— PIC: …", "— Rutin: …", "— Catatan: …"
//      (format baris milik tulisDocxSop/barisItemPapan).
//    - paragraf lain (judul, sub-judul, prosa) diabaikan dan dihitung.
//
// Fungsi murni — membaca teks XML/JSON, tanpa IndexedDB.

import type { ElXml } from './xml';
import type { JsonSopPapanTartib } from '../ekspor/tulisDocxSop';
import type { InputImporItemSop, InputSubItemSop } from '../../services/sopService';

export interface HasilImporPapan {
  judulDokumen: string;
  catatan: string | null; // hanya berkas ekspor Tartib (JSON)
  items: InputImporItemSop[];
  /** Sub "↳" tanpa item sebelumnya — tidak diimpor, daftarnya dilaporkan. */
  subTanpaInduk: string[];
  /** Paragraf bukan ☐ yang diabaikan (judul, prosa, dsb.). */
  paragrafDiabaikan: number;
  /** true bila berasal dari tartib/sop.json (round-trip penuh). */
  dariJsonTartib: boolean;
}

/** Data lengkap papan dalam berkas ekspor Tartib (entry tartib/sop.json). */
export function sopPapanDariJson(teks: string): HasilImporPapan {
  let data: unknown;
  try {
    data = JSON.parse(teks);
  } catch {
    throw new Error('Berkas ekspor Tartib rusak — tartib/sop.json bukan JSON sah');
  }
  const d = data as JsonSopPapanTartib;
  if (!d || d.format !== 'tartib-sop' || typeof d.judul !== 'string' || !Array.isArray(d.items)) {
    throw new Error('Berkas ekspor Tartib rusak — struktur papan SOP tidak dikenal');
  }
  return {
    judulDokumen: d.judul,
    catatan: d.catatan ?? null,
    dariJsonTartib: true,
    subTanpaInduk: [],
    paragrafDiabaikan: 0,
    items: d.items.map((it) => {
      const sub = (it.sub ?? []).map(
        (s): InputSubItemSop => ({
          judul: String(s.judul ?? ''),
          picNama: s.picNama || undefined,
          catatan: s.catatan || undefined,
        }),
      );
      return {
        judul: String(it.judul ?? ''),
        picNama: it.picNama || undefined,
        catatan: it.catatan || undefined,
        rutin: it.rutin || undefined,
        sub: sub.length > 0 ? sub : undefined,
      };
    }),
  };
}

/** Gabungkan seluruh teks (langsung maupun turunan) sebuah elemen. */
function teksRekursif(el: ElXml): string {
  let s = el.teks;
  for (const anak of el.anak ?? []) s += teksRekursif(anak);
  return s;
}

/**
 * Urai satu baris item menjadi atributnya. Format baris tulisDocxSop:
 * "judul — PIC: x — Rutin: y — Catatan: z". Chunk pertama = judul; chunk
 * berlabel dikenali; chunk tanpa label dianggap catatan (baris luar).
 */
export function uraiBarisPapan(teks: string): {
  judul: string;
  picNama?: string;
  rutin?: string;
  catatan?: string;
} {
  const chunk = teks.split(' — ').map((c) => c.trim());
  const judul = (chunk.shift() ?? '').trim();
  let picNama: string | undefined;
  let rutin: string | undefined;
  const catatanLuar: string[] = [];
  for (const c of chunk) {
    if (/^PIC:/i.test(c)) picNama = c.slice(4).trim() || undefined;
    else if (/^Rutin:/i.test(c)) rutin = c.slice(6).trim() || undefined;
    else if (/^Catatan:/i.test(c)) {
      const isi = c.slice(8).trim();
      if (isi) catatanLuar.push(isi);
    } else if (c !== '') catatanLuar.push(c);
  }
  return { judul, picNama, rutin, catatan: catatanLuar.length > 0 ? catatanLuar.join(' — ') : undefined };
}

/** Parse document.xml papan SOP — heuristik ☐ / ↳ (fallback non-ekspor Tartib). */
export function dokumenXmlKeSopPapan(akar: ElXml): HasilImporPapan {
  const paragraf: string[] = [];
  const kunjung = (el: ElXml) => {
    for (const anak of el.anak ?? []) {
      if (anak.nama === 'w:p') {
        const teks = teksRekursif(anak).trim();
        if (teks !== '') paragraf.push(teks);
      } else {
        kunjung(anak);
      }
    }
  };
  kunjung(akar);

  const hasil: HasilImporPapan = {
    judulDokumen: paragraf[0] ?? '',
    catatan: null,
    items: [],
    subTanpaInduk: [],
    paragrafDiabaikan: 0,
    dariJsonTartib: false,
  };

  let paragrafKe = 0;
  for (const baris of paragraf) {
    paragrafKe += 1;
    if (!baris.startsWith('☐')) {
      // Paragraf pertama = judul dokumen; sisanya prosa/sub-judul → diabaikan.
      if (paragrafKe !== 1) hasil.paragrafDiabaikan += 1;
      continue;
    }
    const teks = baris.slice(1).trim();
    const isSub = teks.startsWith('↳');
    const urai = uraiBarisPapan(isSub ? teks.slice(1).trim() : teks);
    if (urai.judul === '') {
      hasil.paragrafDiabaikan += 1;
      continue;
    }
    if (isSub) {
      const induk = hasil.items[hasil.items.length - 1];
      if (!induk) {
        hasil.subTanpaInduk.push(urai.judul);
        continue;
      }
      induk.sub = induk.sub ?? [];
      induk.sub.push({ judul: urai.judul, picNama: urai.picNama, catatan: urai.catatan });
    } else {
      hasil.items.push({ judul: urai.judul, picNama: urai.picNama, rutin: urai.rutin, catatan: urai.catatan });
    }
  }
  return hasil;
}
