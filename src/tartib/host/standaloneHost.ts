import { tartibDb } from '../db/schema';
import type { TartibHost } from './TartibHost';

// Host mandiri: database tartib-db sendiri. Cabang, jumlah santri, dan
// petugas diisi manual (belum ada formulirnya di Batch A — hasil placeholder
// yang aman); cetak memakai window.print().
export const standaloneHost: TartibHost = {
  db: tartibDb,
  getCabangList: async () => [],
  getJumlahSantri: async () => 0,
  cariPetugas: async () => [],
  cetak: async () => {
    window.print();
  },
};
