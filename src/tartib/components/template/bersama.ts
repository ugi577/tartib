import type { Divisi, JenisAcara } from '../../types';

export function pesanError(e: unknown): string {
  return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

// Offset relatif hari-H: 0 → "Hari H", -30 → "H-30", +1 → "H+1".
export function formatOffset(offsetHari: number): string {
  if (offsetHari === 0) return 'Hari H';
  return offsetHari < 0 ? `H${offsetHari}` : `H+${offsetHari}`;
}

export function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
