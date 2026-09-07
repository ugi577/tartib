// Layanan Papan Klip Internal Aplikasi (Copy, Cut, Paste, Delete)
// Mendukung navigasi clipboard lokal dan sinkronisasi dengan navigator.clipboard sistem

export type TipeKlip = 'jabatan' | 'sub-tugas' | 'kbm' | 'teks';

export interface ItemKlip {
  tipe: TipeKlip;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  teks: string;
  isCut?: boolean;
  sumberId?: string;
  waktu: string;
}

let itemKlipAktif: ItemKlip | null = null;

export function salinItem(tipe: TipeKlip, data: any, teks: string, sumberId?: string): void {
  itemKlipAktif = {
    tipe,
    data,
    teks,
    isCut: false,
    sumberId,
    waktu: new Date().toISOString(),
  };

  // Salin ke sistem clipboard juga jika diizinkan
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    void navigator.clipboard.writeText(teks);
  }
}

export function potongItem(tipe: TipeKlip, data: any, teks: string, sumberId?: string): void {
  itemKlipAktif = {
    tipe,
    data,
    teks,
    isCut: true,
    sumberId,
    waktu: new Date().toISOString(),
  };

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    void navigator.clipboard.writeText(teks);
  }
}

export function ambilKlipAktif(): ItemKlip | null {
  return itemKlipAktif;
}

export function bersihkanKlip(): void {
  itemKlipAktif = null;
}
