/** @type {import('next').NextConfig} */
// Deployment publik (GitHub Pages) memakai basePath /tartib via env
// NEXT_PUBLIC_BASE_PATH. Tanpa env (dev lokal) = kosong, perilaku bawaan.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  basePath,
  ...(basePath ? { assetPrefix: `${basePath}/` } : {}),
};

export default nextConfig;
