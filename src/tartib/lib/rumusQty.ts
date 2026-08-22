// Parser ekspresi qty terbatas (A-04, docs/PRD.md 5.3).
// TIDAK PERNAH memakai eval. Token yang diizinkan:
//   variabel: porsi, santri, panitia, rsvp
//   fungsi:   ceil(x), round(x)
//   operator: + - * /  dan tanda kurung, angka (boleh desimal)
// Apa pun di luar itu ditolak dengan RumusError.

export class RumusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RumusError';
  }
}

export interface RumusKonteks {
  porsi: number;
  santri: number;
  panitia: number;
  rsvp: number;
}

const VARIABEL = new Set(['porsi', 'santri', 'panitia', 'rsvp']);
const FUNGSI = new Set(['ceil', 'round']);

type Token =
  | { jenis: 'angka'; nilai: number }
  | { jenis: 'ident'; nilai: string }
  | { jenis: 'op'; nilai: '+' | '-' | '*' | '/' }
  | { jenis: 'paren'; nilai: '(' | ')' }
  | { jenis: 'koma' };

function tokenisasi(ekspresi: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < ekspresi.length) {
    const c = ekspresi[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    if (/[0-9]/.test(c)) {
      const awal = i;
      while (i < ekspresi.length && /[0-9.]/.test(ekspresi[i])) i += 1;
      const angka = Number(ekspresi.slice(awal, i));
      if (!Number.isFinite(angka)) throw new RumusError(`angka tak sah: "${ekspresi.slice(awal, i)}"`);
      tokens.push({ jenis: 'angka', nilai: angka });
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      const awal = i;
      while (i < ekspresi.length && /[a-zA-Z0-9_]/.test(ekspresi[i])) i += 1;
      tokens.push({ jenis: 'ident', nilai: ekspresi.slice(awal, i) });
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ jenis: 'op', nilai: c });
      i += 1;
      continue;
    }
    if (c === '(' || c === ')') {
      tokens.push({ jenis: 'paren', nilai: c });
      i += 1;
      continue;
    }
    if (c === ',') {
      tokens.push({ jenis: 'koma' });
      i += 1;
      continue;
    }
    throw new RumusError(`token tak dikenal: "${c}"`);
  }
  return tokens;
}

export function parseRumusQty(ekspresi: string, konteks: RumusKonteks): number {
  const tokens = tokenisasi(ekspresi);
  if (tokens.length === 0) throw new RumusError('ekspresi kosong');

  let pos = 0;
  const peek = (): Token | undefined => tokens[pos];

  function parseEkspresi(): number {
    let hasil = parseSuku();
    for (;;) {
      const t = peek();
      if (t?.jenis === 'op' && (t.nilai === '+' || t.nilai === '-')) {
        pos += 1;
        const kanan = parseSuku();
        hasil = t.nilai === '+' ? hasil + kanan : hasil - kanan;
      } else {
        return hasil;
      }
    }
  }

  function parseSuku(): number {
    let hasil = parseFaktor();
    for (;;) {
      const t = peek();
      if (t?.jenis === 'op' && (t.nilai === '*' || t.nilai === '/')) {
        pos += 1;
        const kanan = parseFaktor();
        if (t.nilai === '/') {
          if (kanan === 0) throw new RumusError('pembagian dengan nol');
          hasil /= kanan;
        } else {
          hasil *= kanan;
        }
      } else {
        return hasil;
      }
    }
  }

  function parseFaktor(): number {
    const t = peek();
    if (!t) throw new RumusError('ekspresi berakhir lebih awal');
    if (t.jenis === 'angka') {
      pos += 1;
      return t.nilai;
    }
    if (t.jenis === 'paren' && t.nilai === '(') {
      pos += 1;
      const dalam = parseEkspresi();
      const tutup = peek();
      if (tutup?.jenis !== 'paren' || tutup.nilai !== ')') throw new RumusError('kurung tidak ditutup');
      pos += 1;
      return dalam;
    }
    if (t.jenis === 'ident') {
      pos += 1;
      if (FUNGSI.has(t.nilai)) {
        const buka = peek();
        if (buka?.jenis !== 'paren' || buka.nilai !== '(') throw new RumusError(`"${t.nilai}" harus diikuti "("`);
        pos += 1;
        const arg = parseEkspresi();
        const sisa = peek();
        if (sisa?.jenis === 'koma') throw new RumusError(`"${t.nilai}" hanya menerima satu argumen`);
        if (sisa?.jenis !== 'paren' || sisa.nilai !== ')') throw new RumusError(`"${t.nilai}" hanya menerima satu argumen`);
        pos += 1;
        return t.nilai === 'ceil' ? Math.ceil(arg) : Math.round(arg);
      }
      if (VARIABEL.has(t.nilai)) {
        return konteks[t.nilai as keyof RumusKonteks];
      }
      throw new RumusError(`fungsi/variabel tak dikenal: "${t.nilai}"`);
    }
    throw new RumusError(`token tak terduga: ${JSON.stringify(t)}`);
  }

  const hasil = parseEkspresi();
  if (pos !== tokens.length) {
    const t = tokens[pos];
    throw new RumusError(`sisa token setelah ekspresi: "${t.jenis === 'koma' ? ',' : t.nilai}"`);
  }
  return hasil;
}
