import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

// Token desain Tartib (Batch U-2), dimodifikasi ke rupa "liquid glass".
//
// Nama token sengaja SEMANTIK (aksen / permukaan / garis / teks), bukan nama
// warna. Konsekuensinya: keputusan branding yang masih terbuka bisa dijalankan
// dari berkas ini saja — tidak ada komponen yang perlu disentuh.
//
// Rupa liquid glass: permukaan tembus pandang (alpha putih) di atas latar
// gradasi pastel, tepi luminous putih, kabur di belakang (backdrop-blur), dan
// bayangan lembut dengan sorot kaca di sisi dalam. Karena `permukaan.kartu`
// kini transparan, SEMUA kartu/input yang memakai token ini otomatis ikut
// bening — komponen tidak perlu tahu apa-apa.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Warna identitas: aksi utama, penanda aktif, progres. */
        aksen: colors.emerald,
        /** Warna netral: teks, garis pemisah. */
        netral: colors.slate,
        /** Warna peringatan: pengingat cadangan & penanda "wajib". */
        peringatan: colors.amber,
        permukaan: {
          /** Latar halaman (dilapis gradasi pastel oleh globals.css). */
          dasar: '#edeff7',
          /** Kaca kartu/panel — putih bening di atas latar gradasi. */
          kartu: 'rgb(255 255 255 / 0.62)',
          /** Blok tenang di dalam kartu (baris item, kotak hitung). */
          halus: 'rgb(255 255 255 / 0.42)',
          /** Permukaan gelap untuk aksi kontras. */
          kontras: colors.slate[800],
        },
        garis: {
          /** Pemisah baris — abu bening agar terlihat di atas kaca. */
          DEFAULT: 'rgb(148 163 184 / 0.45)',
          /** Tepi kaca kontrol input & tombol sekunder — putih luminous. */
          kuat: 'rgb(255 255 255 / 0.85)',
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
        /** Kontrol isian (input, select, textarea). */
        kontrol: '0.75rem',
        /** Kartu, panel, dialog. */
        kartu: '1.25rem',
      },
      boxShadow: {
        /** Bayangan kaca baku: sorot putih di sisi dalam + jatuh lembut. */
        kartu:
          'inset 0 1px 0 rgb(255 255 255 / 0.8), 0 1px 2px rgb(15 23 42 / 0.05), 0 12px 32px -12px rgb(15 23 42 / 0.16)',
        /** Kartu terangkat (hover, dialog). */
        angkat:
          'inset 0 1px 0 rgb(255 255 255 / 0.85), 0 24px 48px -16px rgb(15 23 42 / 0.25)',
        /** Sorot kilau di tepi atas kontrol isian (pola candy glass). */
        glosAtas: 'inset 0 1px 0 rgb(255 255 255 / 0.9)',
        /** Cahaya aksen di bawah tombol/badge utama. */
        glowAksen:
          'inset 0 1px 0 rgb(255 255 255 / 0.35), 0 10px 24px -8px rgb(5 150 105 / 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
