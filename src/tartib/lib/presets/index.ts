// Pustaka Utama Katalog Preset Siap Pakai Tartib
import { DAFTAR_PRESET_STRUKTUR, type PresetStruktur } from './presetStruktur';
import { DAFTAR_PRESET_SOP, type PresetSop } from './presetSop';
import { DAFTAR_PRESET_KBM } from './presetKbm';
import type { ModelJadwalKbm } from '../../types/kbm';
import { tartibDb, buatId } from '../../db/schema';

export * from './presetStruktur';
export * from './presetSop';
export * from './presetKbm';

export type KategoriPreset = 'semua' | 'struktur' | 'sop' | 'kbm';

export interface MetadataPreset {
  id: string;
  nama: string;
  kategori: 'struktur' | 'sop' | 'kbm';
  deskripsi: string;
  ikon: string;
  jumlahItem: number;
}

export function ambilSemuaMetadataPreset(): MetadataPreset[] {
  const list: MetadataPreset[] = [];

  for (const s of DAFTAR_PRESET_STRUKTUR) {
    list.push({
      id: s.id,
      nama: s.nama,
      kategori: 'struktur',
      deskripsi: s.deskripsi,
      ikon: s.ikon,
      jumlahItem: s.items.length,
    });
  }

  for (const sop of DAFTAR_PRESET_SOP) {
    list.push({
      id: sop.id,
      nama: sop.nama,
      kategori: 'sop',
      deskripsi: sop.deskripsi,
      ikon: sop.ikon,
      jumlahItem: sop.items.length,
    });
  }

  for (const kbm of DAFTAR_PRESET_KBM) {
    list.push({
      id: kbm.id,
      nama: kbm.judul,
      kategori: 'kbm',
      deskripsi: kbm.deskripsi,
      ikon: '📅',
      jumlahItem: kbm.entri.length,
    });
  }

  return list;
}

// Menerapkan preset struktur ke database Dexie Tartib
export async function terapkanPresetStruktur(preset: PresetStruktur): Promise<string> {
  return tartibDb.transaction('rw', tartibDb.sop, tartibDb.sopItem, tartibDb.sopSubItem, async () => {
    // Cari papan baku atau buat papan baru
    let sop = await tartibDb.sop.filter((s) => s.baku).first();
    let sopId: string;

    if (sop) {
      sopId = sop.id;
      await tartibDb.sop.update(sopId, {
        judul: preset.nama,
        catatan: preset.deskripsi,
      });
      // Bersihkan item lama
      const itemLama = await tartibDb.sopItem.where('sopId').equals(sopId).toArray();
      const itemIds = itemLama.map((i) => i.id);
      await tartibDb.sopItem.where('sopId').equals(sopId).delete();
      for (const id of itemIds) {
        await tartibDb.sopSubItem.where('itemId').equals(id).delete();
      }
    } else {
      sopId = buatId();
      await tartibDb.sop.add({
        id: sopId,
        judul: preset.nama,
        catatan: preset.deskripsi,
        baku: true,
        urutan: 1,
        dibuatPada: new Date().toISOString(),
      });
    }

    for (let i = 0; i < preset.items.length; i++) {
      const it = preset.items[i];
      const itemId = buatId();
      await tartibDb.sopItem.add({
        id: itemId,
        sopId,
        judul: it.judul,
        picNama: it.picNama ?? '',
        catatan: it.catatan,
        rutin: it.rutin,
        selesai: false,
        urutan: i + 1,
      });

      if (it.sub && it.sub.length > 0) {
        await tartibDb.sopSubItem.bulkAdd(
          it.sub.map((s, j) => ({
            id: buatId(),
            sopId,
            itemId,
            judul: s.judul,
            picNama: s.picNama ?? '',
            catatan: s.catatan ?? '',
            selesai: false,
            urutan: j + 1,
          })),
        );
      }
    }

    return sopId;
  });
}

// Kunci penyimpanan lokal untuk Jadwal KBM aktif
export const KUNCI_STORAGE_KBM = 'tartib_jadwal_kbm_aktif';

export function simpanJadwalKbmLokal(jadwal: ModelJadwalKbm): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KUNCI_STORAGE_KBM, JSON.stringify(jadwal));
  }
}

export function bacaJadwalKbmLokal(): ModelJadwalKbm {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(KUNCI_STORAGE_KBM);
    if (raw) {
      try {
        return JSON.parse(raw) as ModelJadwalKbm;
      } catch {
        // fallback bawaan
      }
    }
  }
  return DAFTAR_PRESET_KBM[0];
}
