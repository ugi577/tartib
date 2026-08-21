// Urutan berikutnya = max + 1 (mulai dari 1 bila kosong).
// Tidak merapat ke lubang nomor agar urutan baris yang sudah dipakai
// (mis. item di fase, divisi) tidak pernah bertabrakan setelah hapus.
export function urutanBerikutnya(daftar: readonly { urutan: number }[]): number {
  if (daftar.length === 0) return 1;
  return Math.max(...daftar.map((b) => b.urutan)) + 1;
}
