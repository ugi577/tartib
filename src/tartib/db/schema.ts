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
  }
}

export const tartibDb = new TartibDb();
