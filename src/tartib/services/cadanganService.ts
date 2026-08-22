// Cadangan & pemulihan data (sesi 16) — seluruh isi IndexedDB dalam satu
// berkas .json. Alasan keberadaannya: Tartib menyimpan data HANYA di
// perangkat (tanpa akun, tanpa server), jadi hapus data browser = data acara
// hilang tanpa jejak. Berkas cadangan adalah satu-satunya jalan keluar.
//
// Fungsi murni (susunCadangan / bacaCadangan) dipisah dari operasi Dexie agar
// bisa diuji tanpa IndexedDB — pola yang sama dengan service lain (K-03).

import { tartibDb, type TartibDb } from '../db/schema';
import type {
  Acara,
  AcaraDivisi,
  Divisi,
  Evaluasi,
  Fase,
  JenisAcara,
  KelompokTamu,
  Perlengkapan,
  Rsvp,
  Template,
  TemplateItem,
  Tugas,
} from '../types';

export class CadanganError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CadanganError';
  }
}

export interface IsiCadangan {
  jenisAcara: JenisAcara[];
  template: Template[];
  fase: Fase[];
  templateItem: TemplateItem[];
  divisi: Divisi[];
  acara: Acara[];
  acaraDivisi: AcaraDivisi[];
  tugas: Tugas[];
  kelompokTamu: KelompokTamu[];
  rsvp: Rsvp[];
  perlengkapan: Perlengkapan[];
  evaluasi: Evaluasi[];
}

export interface Cadangan {
  aplikasi: 'tartib';
  versi: number;
  dibuatPada: string; // ISO 8601
  isi: IsiCadangan;
}

export const VERSI_CADANGAN = 1;

/** Urutan tabel dipakai untuk validasi, hitung baris, dan pemulihan. */
export const TABEL_CADANGAN: ReadonlyArray<keyof IsiCadangan> = [
  'jenisAcara',
  'template',
  'fase',
  'templateItem',
  'divisi',
  'acara',
  'acaraDivisi',
  'tugas',
  'kelompokTamu',
  'rsvp',
  'perlengkapan',
  'evaluasi',
];

export function susunCadangan(isi: IsiCadangan, dibuatPada: string): Cadangan {
  return { aplikasi: 'tartib', versi: VERSI_CADANGAN, dibuatPada, isi };
}

/** Total baris seluruh tabel — dipakai untuk pesan "N baris dipulihkan". */
export function hitungBaris(isi: IsiCadangan): number {
  return TABEL_CADANGAN.reduce((jml, t) => jml + isi[t].length, 0);
}

/**
 * Parse + validasi berkas cadangan. Melempar CadanganError dengan pesan yang
 * bisa langsung ditampilkan — berkas asing tidak boleh menimpa data pengguna.
 */
export function bacaCadangan(teks: string): Cadangan {
  let obj: unknown;
  try {
    obj = JSON.parse(teks);
  } catch {
    throw new CadanganError('Berkas ini bukan JSON yang sah — pastikan memilih berkas cadangan Tartib.');
  }
  if (typeof obj !== 'object' || obj === null) {
    throw new CadanganError('Isi berkas cadangan tidak dikenali.');
  }
  const c = obj as Record<string, unknown>;
  if (c.aplikasi !== 'tartib') {
    throw new CadanganError('Berkas ini bukan cadangan Tartib.');
  }
  if (c.versi !== VERSI_CADANGAN) {
    throw new CadanganError(
      `Versi cadangan ${String(c.versi)} tidak didukung aplikasi ini (versi ${VERSI_CADANGAN}).`,
    );
  }
  if (typeof c.isi !== 'object' || c.isi === null) {
    throw new CadanganError('Berkas cadangan tidak berisi data.');
  }
  const isiMentah = c.isi as Record<string, unknown>;
  const isi = {} as IsiCadangan;
  for (const nama of TABEL_CADANGAN) {
    const baris = isiMentah[nama];
    if (!Array.isArray(baris)) {
      throw new CadanganError(`Berkas cadangan tidak lengkap — bagian "${nama}" hilang atau rusak.`);
    }
    // Baris tanpa id tidak bisa dipulihkan (semua tabel berkunci utama id).
    if (baris.some((b) => typeof b !== 'object' || b === null || typeof (b as { id?: unknown }).id !== 'string')) {
      throw new CadanganError(`Berkas cadangan rusak — ada baris tanpa id di bagian "${nama}".`);
    }
    (isi as unknown as Record<string, unknown[]>)[nama] = baris;
  }
  return {
    aplikasi: 'tartib',
    versi: VERSI_CADANGAN,
    dibuatPada: typeof c.dibuatPada === 'string' ? c.dibuatPada : '',
    isi,
  };
}

/** Nama berkas cadangan: tartib-cadangan-YYYY-MM-DD.json. */
export function namaBerkasCadangan(dibuatPada: string): string {
  const tanggal = dibuatPada.slice(0, 10);
  return `tartib-cadangan-${tanggal || 'tanpa-tanggal'}.json`;
}

// ── Operasi IndexedDB ──────────────────────────────────────────────────────

export async function ambilIsiCadangan(db: TartibDb = tartibDb): Promise<IsiCadangan> {
  const [
    jenisAcara,
    template,
    fase,
    templateItem,
    divisi,
    acara,
    acaraDivisi,
    tugas,
    kelompokTamu,
    rsvp,
    perlengkapan,
    evaluasi,
  ] = await Promise.all([
    db.jenisAcara.toArray(),
    db.template.toArray(),
    db.fase.toArray(),
    db.templateItem.toArray(),
    db.divisi.toArray(),
    db.acara.toArray(),
    db.acaraDivisi.toArray(),
    db.tugas.toArray(),
    db.kelompokTamu.toArray(),
    db.rsvp.toArray(),
    db.perlengkapan.toArray(),
    db.evaluasi.toArray(),
  ]);
  return {
    jenisAcara,
    template,
    fase,
    templateItem,
    divisi,
    acara,
    acaraDivisi,
    tugas,
    kelompokTamu,
    rsvp,
    perlengkapan,
    evaluasi,
  };
}

/**
 * Ganti SELURUH isi basis data dengan isi cadangan — satu transaksi, jadi
 * kegagalan di tengah jalan tidak meninggalkan data separuh terpulihkan.
 */
export async function pulihkanCadangan(c: Cadangan, db: TartibDb = tartibDb): Promise<number> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    await Promise.all([
      db.jenisAcara.bulkAdd(c.isi.jenisAcara),
      db.template.bulkAdd(c.isi.template),
      db.fase.bulkAdd(c.isi.fase),
      db.templateItem.bulkAdd(c.isi.templateItem),
      db.divisi.bulkAdd(c.isi.divisi),
      db.acara.bulkAdd(c.isi.acara),
      db.acaraDivisi.bulkAdd(c.isi.acaraDivisi),
      db.tugas.bulkAdd(c.isi.tugas),
      db.kelompokTamu.bulkAdd(c.isi.kelompokTamu),
      db.rsvp.bulkAdd(c.isi.rsvp),
      db.perlengkapan.bulkAdd(c.isi.perlengkapan),
      db.evaluasi.bulkAdd(c.isi.evaluasi),
    ]);
  });
  return hitungBaris(c.isi);
}

/** Kosongkan semua tabel (dipakai "Hapus semua data" dengan konfirmasi). */
export async function hapusSemuaData(db: TartibDb = tartibDb): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
}

export type StatistikData = Record<keyof IsiCadangan, number>;

export async function hitungStatistik(db: TartibDb = tartibDb): Promise<StatistikData> {
  const [
    jenisAcara,
    template,
    fase,
    templateItem,
    divisi,
    acara,
    acaraDivisi,
    tugas,
    kelompokTamu,
    rsvp,
    perlengkapan,
    evaluasi,
  ] = await Promise.all([
    db.jenisAcara.count(),
    db.template.count(),
    db.fase.count(),
    db.templateItem.count(),
    db.divisi.count(),
    db.acara.count(),
    db.acaraDivisi.count(),
    db.tugas.count(),
    db.kelompokTamu.count(),
    db.rsvp.count(),
    db.perlengkapan.count(),
    db.evaluasi.count(),
  ]);
  return {
    jenisAcara,
    template,
    fase,
    templateItem,
    divisi,
    acara,
    acaraDivisi,
    tugas,
    kelompokTamu,
    rsvp,
    perlengkapan,
    evaluasi,
  };
}
