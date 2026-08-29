import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

// Token desain Tartib (Batch U-2), rupa disetel Sesi 20 mengikuti referensi UI
// "tartib krem" arahan Ahmed: teal gelap + aksen emas di atas latar krem.
//
// Nama token sengaja SEMANTIK (aksen / permukaan / garis / teks), bukan nama
// warna. Konsekuensinya: keputusan branding yang masih terbuka bisa dijalankan
// dari berkas ini saja — tidak ada komponen yang perlu disentuh.
//
// Rupa kaca di atas krem: permukaan tembus pandang (alpha putih) di atas latar
// krem dengan glow teal/emas, tepi emas lembut, kabur di belakang
// (backdrop-blur), dan bayangan lembut dengan sorot kaca di sisi dalam.
// Karena `permukaan.kartu` transparan, SEMUA kartu/input yang memakai token
// ini otomatis ikut bening — komponen tidak perlu tahu apa-apa.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Warna identitas: aksi utama, penanda aktif, progres — palet teal
         *  gelap referensi UI (Sesi 20): #1A5A4A / #246B5A / #518E7F. */
        aksen: {
          50: '#eef4f1',
          100: '#d8e8e1',
          200: '#b2d1c6',
          300: '#8ab8a9',
          400: '#629e8c',
          500: '#3f8372',
          600: '#246b5a',
          700: '#1a5a4a',
          800: '#144738',
          900: '#103a2e',
          950: '#08271f',
        },
        /** Emas aksen referensi UI (Sesi 20): tepi kartu, bingkai tab aktif,
         *  hiasan — #C5A87B dan turunannya. */
        emas: {
          50: '#faf6ee',
          100: '#f3ecdd',
          200: '#e9dcc2',
          300: '#ddc9a4',
          400: '#d1b689',
          500: '#c5a87b',
          600: '#ab8d5f',
          700: '#8f734a',
          800: '#725a3a',
          900: '#5a462d',
        },
        /** Warna netral: teks, garis pemisah. */
        netral: colors.slate,
        /** Warna peringatan: pengingat cadangan & penanda "wajib". */
        peringatan: colors.amber,
        permukaan: {
          /** Latar halaman (krem — dilapis glow teal/emas oleh globals.css). */
          dasar: '#f5f5f0',
          /** Kaca kartu/panel — putih bening di atas latar krem. */
          kartu: 'rgb(255 255 255 / 0.62)',
          /** Blok tenang di dalam kartu (baris item, kotak hitung). */
          halus: 'rgb(255 255 255 / 0.42)',
          /** Permukaan gelap untuk aksi kontras (teal pekat). */
          kontras: '#144738',
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
        /** Cahaya aksen di bawah tombol/badge utama (teal, Sesi 20). */
        glowAksen:
          'inset 0 1px 0 rgb(255 255 255 / 0.35), 0 10px 24px -8px rgb(36 107 90 / 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
