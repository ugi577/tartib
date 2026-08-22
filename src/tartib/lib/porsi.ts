// Kalkulator porsi dan peralatan — docs/PRD.md bagian 5.4.
// Aritmetika dilakukan dalam bentuk integer ((x * (100 + buffer)) / 100)
// agar pembulatan tidak tersandung epsilon float.

export interface HitungPorsiInput {
  rsvpHadir: number;
  jumlahSantri: number;
  jumlahPanitia: number;
  cadangan?: number; // default 10
  bufferPersen?: number; // default 25
}

export function hitungPorsi({
  rsvpHadir,
  jumlahSantri,
  jumlahPanitia,
  cadangan = 10,
  bufferPersen = 25,
}: HitungPorsiInput): number {
  const porsiRsvp = Math.ceil((rsvpHadir * (100 + bufferPersen)) / 100);
  return porsiRsvp + jumlahSantri + jumlahPanitia + cadangan;
}

// Peralatan makan: dengan tim pencuci cukup 0,6 × porsi (cuci berulang),
// tanpa tim pencuci butuh 1,1 × porsi.
export function hitungPeralatan(porsi: number, adaTimPencuci: boolean): number {
  return adaTimPencuci ? Math.ceil(porsi * 0.6) : Math.ceil(porsi * 1.1);
}
