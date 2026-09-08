/** @type {import('next').NextConfig} */
// Deployment publik (GitHub Pages) memakai basePath /tartib via env
// NEXT_PUBLIC_BASE_PATH. Tanpa env (dev lokal) = kosong, perilaku bawaan.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Dev server dan build memakai folder yang BERBEDA: `next dev` → `.next-dev`,
// `next build` → `.next` (+ ekspor `out/`). Tanpa ini, `npm run build` saat dev
// hidup menimpa `.next/` → chunk klien 404, halaman tidak terhidrasi ("gak
// jalan localnya" — terjadi sesi 14, 21, 22). NEXT_DIST_DIR tetap bisa
// mengalihkan keduanya secara eksplisit (mis. build verifikasi ke `.next-build`;
// dengan output 'export' hasil ekspor ikut ke folder itu, bukan `out/`).
const distDir = process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next');

const nextConfig = {
  output: 'export',
  distDir,
  basePath,
  ...(basePath ? { assetPrefix: `${basePath}/` } : {}),
};

export default nextConfig;
