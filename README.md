# Tartib

Struktur organisasi, jadwal KBM, dan SOP acara siap cetak — offline, tanpa akun.

Aplikasi web mandiri (juga dikemas sebagai APK Android) untuk lembaga,
pesantren, sekolah, dan panitia: susun bagan organisasi beserta PIC-nya,
matriks jadwal KBM, dan SOP acara; pratinjau di kanvas cetak yang mengikuti
ukuran kertas sebenarnya; lalu cetak atau simpan sebagai PDF lewat dialog
cetak sistem.

Akses langsung: **https://ugi577.github.io/tartib/**

## Fitur

- **Struktur & PIC** — bagan organisasi (Pimpinan, Pengurus Inti, Divisi)
  dengan jabatan, PIC, dan sub-tugas berceklis; menu konteks salin/duplikat/
  potong; cetak (A4, F4/Folio, Letter, Legal, A5), unduh .docx, dan impor
  .docx.
- **Preset** — katalog siap pakai: struktur panitia/organisasi, SOP acara,
  dan jadwal KBM (5 hari, 6 hari, halaqah tahfidz, harian pesantren);
  sekali terapkan lalu ubah sesuka hati.
- **Kanvas Cetak** — pratinjau presisi lembar fisik (A4, F4/Folio 215×330,
  Letter, Legal, A5, Thermal 80/58 mm) dengan garis batas aman, orientasi
  tegak/mendatar, dan fit-to-width di HP; dokumen: bagan struktur, matriks
  KBM, dan tiket/slip tugas thermal.
- **Matriks KBM** — kisi hari × jam per kelas, sesi istirahat, warna
  sorotan, kop kustom, simpan sebagai template kustom, ekspor/impor JSON.
- **SOP acara** — template SOP (fase H-30 … H+1, item tugas per divisi,
  rumus kuantitas, versi & duplikat), **Acara** (papan tugas dengan PIC dan
  status BELUM → JALAN → SELESAI/BATAL, laporan cetak), **Tamu & Porsi**
  (RSVP berombongan, kalkulator porsi, ceklis perlengkapan), dan
  **Evaluasi** (catatan per divisi yang bisa dipromosikan ke versi template
  berikutnya).
- **e-Konfirmasi** — generator undangan konfirmasi kehadiran: isian manual,
  kategori dengan preset bidang, diunduh sebagai satu berkas HTML mandiri.
- **Pengaturan & cadangan** — kop lembaga untuk semua lembar cetak, nilai
  baku kalkulator porsi, Google Drive (client ID milik sendiri), serta
  unduh/pulihkan seluruh data dalam satu berkas .json.

## Cetak

Semua pencetakan lewat dialog cetak sistem (peramban/OS) — termasuk
"Simpan sebagai PDF". Printer Bluetooth/USB hanya bisa dipasangkan bila
peramban menyediakan Web Bluetooth/WebUSB (tidak tersedia di APK Android);
pengiriman data cetak langsung ke printer belum didukung.

## Privasi data

Semua data tersimpan di perangkat Anda (IndexedDB via Dexie, sebagian
preferensi di localStorage). Tidak ada server, tidak ada akun, dan tidak ada
data yang dikirim ke mana pun. Ekspor/impor cadangan tersedia dari dalam
aplikasi.

## Teknologi

Next.js 14 (App Router, static export) · TypeScript · React 18 · Dexie
(IndexedDB) · Tailwind CSS · Vitest · Capacitor (APK Android)

## Menjalankan lokal

```bash
pnpm install
pnpm dev        # buka http://localhost:3000
pnpm test       # vitest
pnpm build      # static export ke ./out
pnpm build:apk  # static export + cap sync + gradlew assembleDebug (perlu Android SDK)
```

## Deployment

Repo ini di-deploy otomatis ke GitHub Pages (branch `main`) lewat
`.github/workflows/deploy.yml`. Build memakai `NEXT_PUBLIC_BASE_PATH=/tartib`
karena Pages menyajikan situs di sub-path `https://ugi577.github.io/tartib/`.
