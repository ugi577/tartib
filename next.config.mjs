/** @type {import('next').NextConfig} */
// Deployment publik (GitHub Pages) memakai basePath /tartib via env
// NEXT_PUBLIC_BASE_PATH. Tanpa env (dev lokal) = kosong, perilaku bawaan.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// distDir dapat dialihkan lewat env NEXT_DIST_DIR (mis. `.next-build`) untuk
// build VERIFIKASI tanpa menimpa `.next/` milik dev server yang sedang hidup —
// sesi 21/22: build saat dev hidup membuat chunk klien 404 dan halaman tidak
// terhidrasi, sehingga QA di localhost:3000 menyesatkan. Catatan: dengan
// output 'export', hasil ekspor ikut ditulis ke distDir itu (bukan `out/`),
// jadi build untuk APK/GitHub Pages tetap memakai bawaan (`pnpm build`).
const distDir = process.env.NEXT_DIST_DIR || '.next';

const nextConfig = {
  output: 'export',
  distDir,
  basePath,
  ...(basePath ? { assetPrefix: `${basePath}/` } : {}),
};

export default nextConfig;
