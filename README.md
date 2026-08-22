# Tartib — Pembuat SOP Acara

Aplikasi web mandiri untuk menyusun dan mengawal SOP acara: template SOP,
papan acara dengan pembagian tugas panitia, manajemen tamu & porsi, hingga
evaluasi acara.

Akses langsung: **https://ugi577.github.io/tartib/**

## Fitur

- **Template SOP** — kelola template acara: fase, item SOP, divisi PIC,
  rumus kuantitas, duplikat & versi baru.
- **Papan Acara** — buat acara dari template, tetapkan PIC, dan pantau
  progres tugas per fase.
- **Tamu & Porsi** — kelompok tamu, RSVP berombongan, kalkulator porsi, dan
  ceklis perlengkapan.
- **Evaluasi** — catat dan tinjau evaluasi acara setelah selesai.

## Privasi data

Semua data tersimpan di perangkat Anda (IndexedDB via Dexie). Tidak ada
server, tidak ada akun, dan tidak ada data yang dikirim ke mana pun.
Export/import data tersedia dari dalam aplikasi.

## Teknologi

Next.js 14 (App Router, static export) · TypeScript · Dexie (IndexedDB) ·
Tailwind CSS · Vitest

## Menjalankan lokal

```bash
pnpm install
pnpm dev        # buka http://localhost:3000
pnpm test       # vitest
pnpm build      # static export ke ./out
```

## Deployment

Repo ini di-deploy otomatis ke GitHub Pages (branch `main`) lewat
`.github/workflows/deploy.yml`. Build memakai `NEXT_PUBLIC_BASE_PATH=/tartib`
karena Pages menyajikan situs di sub-path `https://ugi577.github.io/tartib/`.
