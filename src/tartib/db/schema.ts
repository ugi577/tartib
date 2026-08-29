import Dexie, { type Table } from 'dexie';
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
  Sop,
  SopItem,
  SopSubItem,
  Template,
  TemplateItem,
  Tugas,
} from '../types';

// Semua tabel berprefix `tartib_` (K-02) agar tidak bertabrakan dengan
// skema v3 (mis. `cabang`, `santri`, `users`).
export function buatId(): string {
  return globalThis.crypto.randomUUID();
}

export class TartibDb extends Dexie {
  jenisAcara!: Table<JenisAcara, string>;
  template!: Table<Template, string>;
  fase!: Table<Fase, string>;
  templateItem!: Table<TemplateItem, string>;
  divisi!: Table<Divisi, string>;
  acara!: Table<Acara, string>;
  acaraDivisi!: Table<AcaraDivisi, string>;
  tugas!: Table<Tugas, string>;
  kelompokTamu!: Table<KelompokTamu, string>;
  rsvp!: Table<Rsvp, string>;
  perlengkapan!: Table<Perlengkapan, string>;
  evaluasi!: Table<Evaluasi, string>;
  sop!: Table<Sop, string>;
  sopItem!: Table<SopItem, string>;
  sopSubItem!: Table<SopSubItem, string>;

  constructor() {
    super('tartib-db');
    this.version(1).stores({
      tartib_jenisAcara: 'id',
      tartib_template: 'id, jenisAcaraId',
      tartib_fase: 'id, templateId, urutan',
      tartib_templateItem: 'id, templateId, faseId, divisiId, urutan',
      tartib_divisi: 'id, urutan',
      tartib_acara: 'id, jenisAcaraId, templateId, status',
      tartib_acaraDivisi: 'id, acaraId, divisiId',
      tartib_tugas: 'id, acaraId, faseId, divisiId, urutan',
      tartib_kelompokTamu: 'id, acaraId',
      tartib_rsvp: 'id, acaraId, kelompokId',
      tartib_perlengkapan: 'id, acaraId, divisiId',
      tartib_evaluasi: 'id, acaraId, divisiId',
    });
    // v2: index dibuatPada untuk daftar terurut (usePagedList orderBy).
    // Upgrade otomatis Dexie tanpa migrasi data — belum ada data produksi.
    this.version(2).stores({
      tartib_jenisAcara: 'id',
      tartib_template: 'id, jenisAcaraId, dibuatPada',
      tartib_fase: 'id, templateId, urutan',
      tartib_templateItem: 'id, templateId, faseId, divisiId, urutan',
      tartib_divisi: 'id, urutan',
      tartib_acara: 'id, jenisAcaraId, templateId, status, dibuatPada',
      tartib_acaraDivisi: 'id, acaraId, divisiId',
      tartib_tugas: 'id, acaraId, faseId, divisiId, urutan',
      tartib_kelompokTamu: 'id, acaraId',
      tartib_rsvp: 'id, acaraId, kelompokId',
      tartib_perlengkapan: 'id, acaraId, divisiId',
      tartib_evaluasi: 'id, acaraId, divisiId',
    });
    // v3: index nama di tartib_jenisAcara — seedTemplateContoh mencari
    // jenis acara lewat where('nama'); tanpa index Dexie melempar
    // SchemaError saat seed berjalan (bug ditemukan saat verifikasi UI
    // Batch D). Upgrade otomatis, belum ada data produksi.
    this.version(3).stores({
      tartib_jenisAcara: 'id, nama',
      tartib_template: 'id, jenisAcaraId, dibuatPada',
      tartib_fase: 'id, templateId, urutan',
      tartib_templateItem: 'id, templateId, faseId, divisiId, urutan',
      tartib_divisi: 'id, urutan',
      tartib_acara: 'id, jenisAcaraId, templateId, status, dibuatPada',
      tartib_acaraDivisi: 'id, acaraId, divisiId',
      tartib_tugas: 'id, acaraId, faseId, divisiId, urutan',
      tartib_kelompokTamu: 'id, acaraId',
      tartib_rsvp: 'id, acaraId, kelompokId',
      tartib_perlengkapan: 'id, acaraId, divisiId',
      tartib_evaluasi: 'id, acaraId, divisiId',
    });
    // v4: SOP berdiri sendiri (Batch X) — papan baku amanah & khidmah
    // (semi-paten) + SOP kustom. `baku` TIDAK diindex: boolean bukan kunci
    // sah IndexedDB; pemilahan baku/kustom dilakukan filter di memori.
    this.version(4).stores({
      tartib_jenisAcara: 'id, nama',
      tartib_template: 'id, jenisAcaraId, dibuatPada',
      tartib_fase: 'id, templateId, urutan',
      tartib_templateItem: 'id, templateId, faseId, divisiId, urutan',
      tartib_divisi: 'id, urutan',
      tartib_acara: 'id, jenisAcaraId, templateId, status, dibuatPada',
      tartib_acaraDivisi: 'id, acaraId, divisiId',
      tartib_tugas: 'id, acaraId, faseId, divisiId, urutan',
      tartib_kelompokTamu: 'id, acaraId',
      tartib_rsvp: 'id, acaraId, kelompokId',
      tartib_perlengkapan: 'id, acaraId, divisiId',
      tartib_evaluasi: 'id, acaraId, divisiId',
      tartib_sop: 'id, urutan, dibuatPada',
      tartib_sopItem: 'id, sopId, urutan',
    });
    // v5: sub-tugas SOP (Batch Y) — rincian di bawah satu item ceklis, tiap
    // sub punya PIC & ceklis sendiri. Index sopId menyangga operasi per
    // papan (reset/duplikat/hapus), itemId untuk baca per induk.
    this.version(5).stores({
      tartib_jenisAcara: 'id, nama',
      tartib_template: 'id, jenisAcaraId, dibuatPada',
      tartib_fase: 'id, templateId, urutan',
      tartib_templateItem: 'id, templateId, faseId, divisiId, urutan',
      tartib_divisi: 'id, urutan',
      tartib_acara: 'id, jenisAcaraId, templateId, status, dibuatPada',
      tartib_acaraDivisi: 'id, acaraId, divisiId',
      tartib_tugas: 'id, acaraId, faseId, divisiId, urutan',
      tartib_kelompokTamu: 'id, acaraId',
      tartib_rsvp: 'id, acaraId, kelompokId',
      tartib_perlengkapan: 'id, acaraId, divisiId',
      tartib_evaluasi: 'id, acaraId, divisiId',
      tartib_sop: 'id, urutan, dibuatPada',
      tartib_sopItem: 'id, sopId, urutan',
      tartib_sopSubItem: 'id, sopId, itemId, urutan',
    });

    // Dexie hanya mengisi otomatis this[namaStore] bila nama field class
    // sama persis dengan key di stores() (mis. this.tartib_divisi). Karena
    // K-02 mewajibkan prefix tartib_ pada nama store tapi seluruh kode
    // memakai field pendek (this.divisi, this.acara, dst.), pemetaan
    // eksplisit wajib di sini — tanpa ini setiap tartibDb.<tabel> selalu
    // undefined saat runtime (bug ditemukan saat verifikasi UI Batch D).
    this.jenisAcara = this.table('tartib_jenisAcara');
    this.template = this.table('tartib_template');
    this.fase = this.table('tartib_fase');
    this.templateItem = this.table('tartib_templateItem');
    this.divisi = this.table('tartib_divisi');
    this.acara = this.table('tartib_acara');
    this.acaraDivisi = this.table('tartib_acaraDivisi');
    this.tugas = this.table('tartib_tugas');
    this.kelompokTamu = this.table('tartib_kelompokTamu');
    this.rsvp = this.table('tartib_rsvp');
    this.perlengkapan = this.table('tartib_perlengkapan');
    this.evaluasi = this.table('tartib_evaluasi');
    this.sop = this.table('tartib_sop');
    this.sopItem = this.table('tartib_sopItem');
    this.sopSubItem = this.table('tartib_sopSubItem');
  }
}

export const tartibDb = new TartibDb();
