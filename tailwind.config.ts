import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

// Token desain Tartib (Batch U-2).
//
// Nama token sengaja SEMANTIK (aksen / permukaan / garis / teks), bukan nama
// warna. Konsekuensinya: keputusan branding yang masih terbuka (nama & rupa
// aplikasi untuk rilis publik) bisa dijalankan dari berkas ini saja — tidak
// ada komponen yang perlu disentuh.
//
// Palet dasar tidak berubah dari yang sudah dipakai sejak Batch A: netral
// `slate`, aksen `emerald`. Batch U hanya memberi keduanya peran yang jelas.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Warna identitas: aksi utama, penanda aktif, progres. */
        aksen: colors.emerald,
        /** Warna netral: teks, garis, latar. */
        netral: colors.slate,
        permukaan: {
          /** Latar halaman. */
          dasar: colors.slate[50],
          /** Latar kartu/panel yang berdiri di atas halaman. */
          kartu: '#ffffff',
          /** Blok tenang di dalam kartu (baris item, kotak hitung). */
          halus: colors.slate[50],
          /** Permukaan gelap untuk aksi kontras. */
          kontras: colors.slate[800],
        },
        garis: {
          DEFAULT: colors.slate[200],
          /** Garis kontrol input & tombol sekunder — perlu lebih tegas. */
          kuat: colors.slate[300],
        },
        teks: {
          utama: colors.slate[800],
          kuat: colors.slate[700],
          sedang: colors.slate[600],
          halus: colors.slate[500],
          redup: colors.slate[400],
        },
      },
      borderRadius: {
        /** Tombol, input, baris item. */
        kontrol: '0.5rem',
        /** Kartu & panel. */
        kartu: '0.75rem',
      },
      boxShadow: {
        kartu: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        angkat: '0 4px 12px -2px rgb(15 23 42 / 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
