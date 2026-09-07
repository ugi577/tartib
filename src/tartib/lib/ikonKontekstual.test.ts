import { describe, it, expect } from 'vitest';
import {
  ambilIkonJabatan,
  ambilIkonTugas,
  ambilIkonMapel,
  saranIkonCepat,
  ekstrakEmojiKustom,
  pasangEmojiKustom,
} from './ikonKontekstual';

describe('ikonKontekstual', () => {
  describe('ambilIkonJabatan', () => {
    it('mendeteksi ikon pimpinan & mudir', () => {
      expect(ambilIkonJabatan('MUDIR')).toBe('🕌');
      expect(ambilIkonJabatan('Ketua OSIS')).toBe('👑');
      expect(ambilIkonJabatan('Kepala Sekolah')).toBe('👑');
      expect(ambilIkonJabatan('Pembina Santri')).toBe('🌟');
    });

    it('mendeteksi ikon divisi struktural penting', () => {
      expect(ambilIkonJabatan('BENDAHARA KAS')).toBe('💰');
      expect(ambilIkonJabatan('SEKRETARIS')).toBe('📋');
      expect(ambilIkonJabatan('LOGISTIK & SARPRAS')).toBe('📦');
      expect(ambilIkonJabatan('KEAMANAN & KETERTIBAN')).toBe('🔒');
      expect(ambilIkonJabatan('DIVISI KONSUMSI / DAPUR')).toBe('🍽️');
      expect(ambilIkonJabatan('TIM DOKUMENTASI MEDIA')).toBe('📷');
      expect(ambilIkonJabatan('PJ KESEHATAN & MEDIS')).toBe('🏥');
      expect(ambilIkonJabatan('DIVISI KEBERSIHAN')).toBe('🧹');
      expect(ambilIkonJabatan('SEKSI SOUND & LISTRIK')).toBe('⚡');
    });

    it('mendeteksi jabatan perabotan, inventaris, motor, toren & majelis', () => {
      expect(ambilIkonJabatan('SEKSI MEUBEL & PERABOTAN')).toBe('🪑');
      expect(ambilIkonJabatan('PJ MOTOR')).toBe('🛵');
      expect(ambilIkonJabatan('DIVISI INVENTARIS')).toBe('🏷️');
      expect(ambilIkonJabatan('PJ TOREN AIR')).toBe('🛢️');
      expect(ambilIkonJabatan('TORENT AIR')).toBe('🛢️');
      expect(ambilIkonJabatan('TORENT AIR', '📌', 'Divisi')).toBe('🛢️');
      expect(ambilIkonJabatan('TORENT')).toBe('🛢️');
      expect(ambilIkonJabatan('PJ MAJELIS TAKLIM')).toBe('🕌');
    });

    it('menghormati emoji yang sudah ditulis pengguna di awal catatan', () => {
      expect(ambilIkonJabatan('JABATAN KHUSUS', '🚀 Divisi ekspansi')).toBe('🚀');
    });

    it('memberikan fallback yang sesuai dengan tier jika tidak ada kata kunci', () => {
      expect(ambilIkonJabatan('Posisi Unik', '', 'Pimpinan')).toBe('👑');
      expect(ambilIkonJabatan('Posisi Unik', '', 'Pengurus Inti')).toBe('🏛️');
      expect(ambilIkonJabatan('Posisi Unik', '', 'Divisi')).toBe('📌');
    });
  });

  describe('ambilIkonTugas', () => {
    it('mendeteksi konteks tugas fisik santri / teknis', () => {
      expect(ambilIkonTugas('Pompa Sungai')).toBe('💧');
      expect(ambilIkonTugas('Hp. Pondok')).toBe('📱');
      expect(ambilIkonTugas('Kunci Motor')).toBe('🛵');
      expect(ambilIkonTugas('Lemari Tool')).toBe('🧰');
      expect(ambilIkonTugas('Baterai & Charger')).toBe('🔋');
      expect(ambilIkonTugas('Vacuum Cleaner')).toBe('🧹');
      expect(ambilIkonTugas('WC Aula Depan')).toBe('🚻');
      expect(ambilIkonTugas('Kran Air')).toBe('🚰');
      expect(ambilIkonTugas('Sandal')).toBe('👟');
      expect(ambilIkonTugas('Matikan Lampu')).toBe('💡');
      expect(ambilIkonTugas('Nampan & Piring')).toBe('🍽️');
      expect(ambilIkonTugas('Membangunkan Santri')).toBe('⏰');
      expect(ambilIkonTugas('Hadroh')).toBe('🥁');
      expect(ambilIkonTugas('Motor Ustadz')).toBe('🛵');
      expect(ambilIkonTugas('Jendela')).toBe('🪟');
      expect(ambilIkonTugas('Lap Frame')).toBe('🖼️');
      expect(ambilIkonTugas('Torrent Air')).toBe('🛢️');
      expect(ambilIkonTugas('Toren Air')).toBe('🛢️');
      expect(ambilIkonTugas('Meja Majlis')).toBe('🪵');
      expect(ambilIkonTugas('Majelis Taklim')).toBe('🕌');
      expect(ambilIkonTugas('Kursi Tamu')).toBe('🪑');
      expect(ambilIkonTugas('Perabotan Meubel')).toBe('🪑');
      expect(ambilIkonTugas('Inventaris Sarpras')).toBe('🏷️');
      expect(ambilIkonTugas('Kasur Asrama')).toBe('🛏️');
      expect(ambilIkonTugas('Kaca Cermin')).toBe('🪞');
    });

    it('memberikan fallback netral jika tidak cocok kata kunci', () => {
      expect(ambilIkonTugas('Tugas santri umum biasa')).toBe('🔹');
    });
  });

  describe('ambilIkonMapel', () => {
    it('mendeteksi mata pelajaran KBM', () => {
      expect(ambilIkonMapel('Fiqih')).toBe('⚖️');
      expect(ambilIkonMapel('Tahfidz Al-Quran')).toBe('📖');
      expect(ambilIkonMapel('Bahasa Arab')).toBe('🗣️');
      expect(ambilIkonMapel('Matematika')).toBe('📐');
      expect(ambilIkonMapel('Penjas')).toBe('⚽');
    });
  });

  describe('saranIkonCepat', () => {
    it('menghasilkan opsi saran emoji yang relevan', () => {
      const saran = saranIkonCepat('Dapur');
      expect(saran).toContain('🍽️');
      expect(saran.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('pilihanManualHelper', () => {
    it('mengekstrak emoji kustom manual dari catatan', () => {
      expect(ekstrakEmojiKustom('🛢️ Kuras tiap minggu')).toBe('🛢️');
      expect(ekstrakEmojiKustom('Catatan biasa tanpa emoji')).toBeNull();
      expect(ekstrakEmojiKustom('📌')).toBeNull(); // Fallback bawaan diabaikan
    });

    it('memasang dan mereset emoji kustom pada catatan', () => {
      expect(pasangEmojiKustom('🛢️', '')).toBe('🛢️');
      expect(pasangEmojiKustom('🛢️', 'Catatan lama')).toBe('🛢️ Catatan lama');
      expect(pasangEmojiKustom('🪑', '🛢️ Catatan lama')).toBe('🪑 Catatan lama');
      expect(pasangEmojiKustom(null, '🛢️ Catatan lama')).toBe('Catatan lama');
      expect(pasangEmojiKustom(null, '🛢️')).toBe('');
    });
  });
});
