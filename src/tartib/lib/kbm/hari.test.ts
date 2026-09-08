import { describe, expect, it } from 'vitest';
import type { ModelJadwalKbm } from '../../types/kbm';
import { DAFTAR_HARI_KBM, labelHari, normalisasiHari, normalisasiJadwal } from './hari';

describe('normalisasiHari', () => {
  it('menerima semua ejaan Jumat (kutip lurus, kutip keriting, huruf kecil, spasi)', () => {
    expect(normalisasiHari("Jum'at")).toBe('Jumat');
    expect(normalisasiHari('Jum’at')).toBe('Jumat');
    expect(normalisasiHari('jumat')).toBe('Jumat');
    expect(normalisasiHari('  JUMAT ')).toBe('Jumat');
    expect(normalisasiHari('Jum at')).toBe('Jumat');
  });

  it("memetakan 'Minggu' ke 'Ahad'", () => {
    expect(normalisasiHari('Minggu')).toBe('Ahad');
    expect(normalisasiHari('minggu')).toBe('Ahad');
    expect(normalisasiHari('Ahad')).toBe('Ahad');
  });

  it('mengembalikan hari lain sesuai daftar kanonik, tidak peduli huruf besar/kecil', () => {
    expect(normalisasiHari('senin')).toBe('Senin');
    expect(normalisasiHari('SELASA')).toBe('Selasa');
    expect(normalisasiHari('Rabu')).toBe('Rabu');
    expect(normalisasiHari('kamis ')).toBe('Kamis');
    expect(normalisasiHari('Sabtu')).toBe('Sabtu');
    for (const h of DAFTAR_HARI_KBM) expect(normalisasiHari(h)).toBe(h);
  });

  it('mengembalikan null untuk teks yang bukan nama hari', () => {
    expect(normalisasiHari('')).toBeNull();
    expect(normalisasiHari('Friday')).toBeNull();
    expect(normalisasiHari('Jum')).toBeNull();
    expect(normalisasiHari('Libur')).toBeNull();
  });
});

describe('labelHari', () => {
  it("menampilkan 'Jumat' sebagai Jum'at dan hari lain apa adanya", () => {
    expect(labelHari('Jumat')).toBe("Jum'at");
    expect(labelHari('Senin')).toBe('Senin');
    expect(labelHari('Ahad')).toBe('Ahad');
  });
});

describe('normalisasiJadwal', () => {
  // Data "kotor" seperti yang bisa datang dari localStorage lama / JSON impor —
  // dibangun lewat JSON.parse agar tidak perlu memaksa tipe.
  const jadwalKotor = JSON.parse(
    JSON.stringify({
      id: 'x',
      judul: 'Uji',
      tipe: 'kustom',
      deskripsi: '',
      daftarHari: ['Senin', "Jum'at", 'Jumat', 'Minggu', 'Libur'],
      daftarJam: [{ ke: 1, label: '07.00 - 07.45' }],
      daftarKelas: ['A'],
      entri: [
        { id: 'e1', hari: 'Senin', jamKe: 1, kelas: 'A', mapel: 'Fiqih' },
        { id: 'e2', hari: "Jum'at", jamKe: 1, kelas: 'A', mapel: 'Khutbah' },
        { id: 'e3', hari: 'minggu', jamKe: 1, kelas: 'A', mapel: 'Olahraga' },
        { id: 'e4', hari: 'Libur', jamKe: 1, kelas: 'A', mapel: 'Tidak dikenal' },
      ],
      dibuatPada: '2026-01-01T00:00:00.000Z',
    }),
  ) as ModelJadwalKbm;

  it('menormalkan daftarHari tanpa duplikat dan membuang hari tak dikenal', () => {
    const hasil = normalisasiJadwal(jadwalKotor);
    expect(hasil.daftarHari).toEqual(['Senin', 'Jumat', 'Ahad']);
  });

  it('menormalkan hari tiap entri dan membuang entri dengan hari tak dikenal', () => {
    const hasil = normalisasiJadwal(jadwalKotor);
    expect(hasil.entri.map((e) => [e.id, e.hari])).toEqual([
      ['e1', 'Senin'],
      ['e2', 'Jumat'],
      ['e3', 'Ahad'],
    ]);
  });

  it('tidak mengubah bidang lain dan tidak memutasi objek sumber', () => {
    const hasil = normalisasiJadwal(jadwalKotor);
    expect(hasil.id).toBe('x');
    expect(hasil.daftarJam).toBe(jadwalKotor.daftarJam);
    expect(hasil.entri[0]).toBe(jadwalKotor.entri[0]);
    expect(jadwalKotor.daftarHari).toHaveLength(5);
    expect(jadwalKotor.entri[1].hari).toBe("Jum'at");
  });

  it('tahan terhadap daftarHari / entri yang bukan array', () => {
    const rusak = JSON.parse('{"id":"r","judul":"","tipe":"kustom","deskripsi":"","daftarJam":[],"daftarKelas":[],"dibuatPada":""}') as ModelJadwalKbm;
    const hasil = normalisasiJadwal(rusak);
    expect(hasil.daftarHari).toEqual([]);
    expect(hasil.entri).toEqual([]);
  });
});
