// Pemetaan document.xml DOCX → struktur SOP Tartib (Batch V).
//
// Berdasarkan struktur nyata "BUKU PANDUAN SOP ACARA — Ma'had Askar Qur'an":
// - Fase: paragraf tebal (semua run <w:b/>) berawalan offset H (H-30, Hari-H, H+1).
// - Item: paragraf berawalan ☐ (U+2610) — dilampirkan ke fase aktif terakhir.
// - "BAGIAN n — ..." mengosongkan fase aktif (item di luar linimasa diabaikan,
//   mis. ceklis perlengkapan Bagian 4).
// - Sub-judul tebal tanpa pola H dan prosa biasa tidak diimpor.
//
// Pembagian divisi per item adalah TEBAKAN kata kunci (tebakDivisi) karena
// dokumen sumber tidak mencantumkan divisi pada tiap item; hasil null berarti
// UI memakai divisi bawaan dan menampilkan peringatan.

import type { ElXml } from './xml';

export interface ItemImpor {
  judul: string;
  /** Nama divisi tebakan dari kata kunci; null = tidak dikenal. */
  divisiTebakan: string | null;
  /** Hanya terisi pada impor berkas ekspor Tartib (tartib/template.json). */
  catatan?: string;
  wajib?: boolean;
  rumusQty?: string;
}

export interface FaseImpor {
  label: string;
  offsetHari: number;
  items: ItemImpor[];
  urutan?: number;
}

/** Item ☐ yang muncul di luar fase — teksnya DIPERTAHANKAN supaya pratinjau bisa memperlihatkan apa saja yang dibuang (auditabilitas; tindak lanjut audit impor). */
export interface ItemLuarLinimasa {
  teks: string;
  /** Heading "BAGIAN n — …" tempat item ini berada; null bila sebelum bagian mana pun. */
  bagian: string | null;
}

export interface HasilImporDokumen {
  judulDokumen: string;
  subJudul: string | null;
  fases: FaseImpor[];
  /** Item ☐ di luar fase (mis. ceklis perlengkapan) — tidak diimpor, tapi daftarnya disimpan untuk pratinjau. */
  itemLuarLinimasa: ItemLuarLinimasa[];
  /** Paragraf prosa/heading lain yang tidak diimpor. */
  paragrafDiabaikan: number;
  /** Hanya untuk impor berkas ekspor Tartib (JSON) — catatan template asli. */
  catatan?: string;
  /** Hanya untuk impor berkas ekspor Tartib (JSON) — nama jenis acara asli. */
  jenisAcaraNama?: string;
}

/** Data lengkap template dalam berkas ekspor Tartib (entry tartib/template.json). */
export interface JsonTemplateTartib {
  format: 'tartib-template';
  versiFormat: number;
  nama: string;
  jenisAcara?: string;
  catatan?: string;
  versi?: number;
  fases: Array<{
    urutan?: number;
    label: string;
    offsetHari: number;
    items: Array<{
      urutan?: number;
      judul: string;
      divisi?: string;
      catatan?: string;
      wajib?: boolean;
      rumusQty?: string;
    }>;
  }>;
}

/**
 * Baca data lengkap template dari entry tartib/template.json berkas ekspor
 * Tartib (round-trip penuh — sesi 15). Dipakai sebelum heuristik document.xml
 * sehingga ekspor → impor tidak kehilangan divisi/catatan/wajib/rumusQty.
 */
export function sopDariJson(teks: string): HasilImporDokumen {
  let data: unknown;
  try {
    data = JSON.parse(teks);
  } catch {
    throw new Error('Berkas ekspor Tartib rusak — bukan JSON sah');
  }
  const d = data as JsonTemplateTartib;
  if (!d || d.format !== 'tartib-template' || typeof d.nama !== 'string' || !Array.isArray(d.fases)) {
    throw new Error('Berkas ekspor Tartib rusak — struktur tidak dikenal');
  }

  const fases: FaseImpor[] = d.fases.map((f) => {
    const offset = Number(f.offsetHari);
    if (!Number.isFinite(offset)) throw new Error('Berkas ekspor Tartib rusak — offsetHari tidak sah');
    return {
      label: String(f.label ?? ''),
      offsetHari: offset,
      urutan: f.urutan,
      items: (f.items ?? []).map((it) => ({
        judul: String(it.judul ?? ''),
        divisiTebakan: it.divisi || null,
        catatan: it.catatan,
        wajib: it.wajib,
        rumusQty: it.rumusQty,
      })),
    };
  });

  return {
    judulDokumen: d.nama,
    subJudul: d.jenisAcara ?? null,
    fases,
    itemLuarLinimasa: [],
    paragrafDiabaikan: 0,
    catatan: d.catatan,
    jenisAcaraNama: d.jenisAcara,
  };
}

/** Gabungkan seluruh teks (langsung maupun turunan) sebuah elemen. */
function teksRekursif(el: ElXml): string {
  let s = el.teks;
  for (const a of el.anak) s += teksRekursif(a);
  return s;
}

function anakLangganan(el: ElXml, nama: string): ElXml[] {
  return el.anak.filter((a) => a.nama.endsWith(`:${nama}`) || a.nama === nama);
}

function punyaTurunan(el: ElXml, nama: string): boolean {
  if (el.nama === nama || el.nama.endsWith(`:${nama}`)) return true;
  return el.anak.some((a) => punyaTurunan(a, nama));
}

function teksParagraf(p: ElXml): string {
  return teksRekursif(p).replace(/\s+/g, ' ').trim();
}

/** true bila seluruh run teks paragraf ditandai tebal (w:b di dalam w:rPr). */
function paragrafTebal(p: ElXml): boolean {
  const runs = anakLangganan(p, 'r');
  if (runs.length === 0) return false;
  return runs.every((r) => punyaTurunan(r, 'b'));
}

/** Parsing offset hari dari awalan "H-30", "H+1", "Hari-H", "H 0". */
export function offsetDariLabel(teks: string): number | null {
  const m = /^H\s*([-+]?\d+)/i.exec(teks);
  if (m) return Number(m[1]);
  if (/^Hari[\s-]?H\b/i.test(teks)) return 0;
  return null;
}

/** Buang simbol peringatan (⚠/⚠️) dari teks — emoji itu kerap tertulis di
 * heading dokumen sumber (mis. "Kunci pengisi acara ⚠️") dan hanya mengotori
 * label hasil impor (sesi 15, laporan Ahmed). Spasi di sekitarnya dipadatkan
 * jadi satu agar tidak menyisakan spasi ganda. */
function buangSimbolPeringatan(teks: string): string {
  return teks.replace(/\s*[\u26A0\u26A1]\uFE0F?\s*/g, ' ').trim();
}

/** Label fase tanpa awalan offset ("H-30 — Penetapan" → "Penetapan"). */
export function labelFaseBersih(teks: string): string {
  const bersih = buangSimbolPeringatan(
    teks
      .replace(/^H\s*[-+]?\d+\s*[—-]\s*/i, '')
      .replace(/^Hari[\s-]?H\s*[—-]\s*/i, ''),
  );
  return bersih.trim() || teks.trim();
}

// Kata kunci → divisi baku (urutan penting: yang lebih spesifik lebih dulu —
// mis. "rundown … tanpa tamu" harus Acara & MC, bukan Penerima Tamu).
const TEBAKAN_DIVISI: ReadonlyArray<readonly [RegExp, string]> = [
  [/bukhur|pengharum|kipas|arom/i, 'Aroma & Suasana'],
  [/parkir|sandal/i, 'Parkir & Sandal'],
  [/sound|listrik|genset|tenda|karpet|kursi|mic|baterai|kabel|token listrik|pinjam/i, 'Perlengkapan & Sound'],
  [/konsumsi|makan|minum|piring|gelas|pencuci|hidang|porsi/i, 'Konsumsi'],
  [/jamaah putri|area putri|putri/i, 'Koordinator Jamaah Putri'],
  [/dokumentasi|foto|video|streaming|kamera|live/i, 'Dokumentasi & Live'],
  [/p3k|obat|kesehatan|klinik/i, 'Kesehatan'],
  [/sampah|sapu|kebersihan/i, 'Kebersihan'],
  [/buku tamu|sambut/i, 'Penerima Tamu'],
  [/rundown|\bmc\b|tilawah|pengisi|gladi|doa|maulid|naskah/i, 'Acara & MC'],
  [/undangan|surat|rekap|konfirmasi/i, 'Sekretaris'],
  [/anggaran|belanja|amplop|laporan|keuangan/i, 'Bendahara'],
  [/tamu/i, 'Penerima Tamu'],
  [/panitia/i, 'Ketua Panitia'],
];

/** Tebak divisi baku dari judul item; null bila tidak ada kata kunci yang cocok. */
export function tebakDivisi(judul: string): string | null {
  for (const [pola, nama] of TEBAKAN_DIVISI) {
    if (pola.test(judul)) return nama;
  }
  return null;
}

function ekstrakJudul(teks: string): string {
  return buangSimbolPeringatan(teks).replace(/^☐\s*/, '').trim();
}

/** Ubah document.xml (hasil parseXmlLite) menjadi struktur SOP. */
export function dokumenXmlKeSop(akar: ElXml): HasilImporDokumen {
  const body = anakLangganan(akar, 'body')[0];
  if (!body) throw new Error('Dokumen bukan .docx Word (tidak ada w:body)');

  const hasil: HasilImporDokumen = {
    judulDokumen: '',
    subJudul: null,
    fases: [],
    itemLuarLinimasa: [],
    paragrafDiabaikan: 0,
  };

  let faseAktif: FaseImpor | null = null;
  let bagianAktif: string | null = null;

  for (const blok of body.anak) {
    if (blok.nama.endsWith(':tbl')) continue; // tabel (struktur panitia dsb.) tidak diimpor
    if (!blok.nama.endsWith(':p')) continue;

    const teks = teksParagraf(blok);
    if (teks === '') continue;

    // Batas bagian: fase aktif dikosongkan supaya item di luar linimasa tidak
    // menempel ke fase terakhir; heading bagiannya dicatat sebagai konteks.
    if (/^BAGIAN\s+\d+/i.test(teks)) {
      faseAktif = null;
      bagianAktif = teks;
      continue;
    }

    // Dua paragraf pertama menjadi judul dokumen & sub-judul (mis. nama lembaga).
    if (hasil.judulDokumen === '') {
      hasil.judulDokumen = teks;
      continue;
    }
    if (hasil.subJudul === null && offsetDariLabel(teks) === null && !teks.startsWith('☐')) {
      hasil.subJudul = teks;
      continue;
    }

    const offset = offsetDariLabel(teks);
    if (paragrafTebal(blok) && offset !== null) {
      faseAktif = { label: labelFaseBersih(teks), offsetHari: offset, items: [] };
      hasil.fases.push(faseAktif);
      continue;
    }

    if (teks.startsWith('☐')) {
      const judul = ekstrakJudul(teks);
      if (judul === '') continue;
      if (!faseAktif) {
        hasil.itemLuarLinimasa.push({ teks: judul, bagian: bagianAktif });
        continue;
      }
      faseAktif.items.push({ judul, divisiTebakan: tebakDivisi(judul) });
      continue;
    }

    hasil.paragrafDiabaikan += 1;
  }

  return hasil;
}
