import type { Metadata } from 'next';
import './globals.css';

// Satu kalimat identitas produk — sama dengan README.md dan TentangView (sesi 22).
export const metadata: Metadata = {
  title: 'Tartib',
  description: 'Struktur organisasi, jadwal KBM, dan SOP acara siap cetak — offline, tanpa akun.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
