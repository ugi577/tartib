# PROJECT-STATE — Tartib

> **Dibaca PERTAMA, diperbarui TERAKHIR** — tanpa kecuali. WIP pun di-commit.

## Posisi

- **Tanggal:** 2026-08-29
- **Sesi 21:** **Review format HP + APK debug berisi seluruh fitur** (dua arahan Ahmed: *"review lg format hp nya"* lalu *"commit semua dan build apk debug full semua fitur baru"*). Dua bagian: (1) **review format HP** — audit ulang ke-7 view (beranda, template, acara, sop, tamu, evaluasi, pengaturan) di 375px/360px/320px via browser in-app: **nol overflow horizontal** di semua viewport; header 214px @375px; @320px nav membungkus 2 baris (129px) dan tombol aksi kartu SOP turun baris sendiri (pembungkusan responsif disengaja, semua teks utuh); temuan awal header ~6000px ternyata **dev server menyajikan CSS 404** (`/_next/static/css/…` — server lama mati, halaman tanpa styling, SVG jatuh ke ukuran intrinsik) — **bukan bug aplikasi**: dev di-restart → CSS HTTP 200 (39,5 KB) → semua view pulih; (2) **APK debug penuh** — gate: tsc bersih, lint bersih, vitest **245/245** (28 berkas), `pnpm build` statis sukses (5 halaman prerender); `npx cap sync android` — web assets `out/` → `android/app/src/main/assets/public`, 2 plugin: `@capacitor/filesystem@8.1.3`, `@capacitor/share@8.0.1`; `./gradlew assembleDebug` **BUILD SUCCESSFUL** → `android/app/build/outputs/apk/debug/app-debug.apk` **4,8 MB** (5.034.610 byte); isi diverifikasi `unzip -l` + build ID `NhYMWysBvIynxVE1HBjBq` cocok dengan `pnpm build` sesi ini → APK benar-benar berisi fitur sampai sesi 20 (K-25). Working tree bersih di awal sesi → nol perubahan kode; komit sesi ini = dokumen. **Tersisa: verifikasi manual Ahmed — pasang APK di device (seluruh fitur + cadangan/ekspor .docx), cetak fisik (dialog cetak sistem tidak bisa diuji browser otomatis), dan sinkron publik.**
- **Sesi 20:** **Rupa kaca krem–teal–emas dari referensi UI Ahmed** (arahan: *"terapkan ui ini ke proyek, cek dan pahami dl, tetap pertahankan ornamen yg sudah ada, jangan terapkan garis gold yg gelombang dan bintang 4 arah dr file ini"* — berkas `~/Documents/ui tartib.html`, **K-25**). Lima lapisan: (1) **tema token** `tailwind.config.ts` — `aksen` emerald→**teal** (inti 600 `#246b5a`/700 `#1a5a4a`/800 `#144738`), palet **`emas` baru** (500 `#c5a87b`), `permukaan.dasar` **`#f5f5f0`** (krem) + `permukaan.kontras` `#144738`, `glowAksen` = kilau putih 1px + bayangan teal 50%; (2) **rupa "liquid glass di atas krem"** `kelas.ts` — kartu/kartuIsi putih translusen + `border-emas-300/60` + blur, `tombolUtama` gradasi `aksen-700→600` + `ring-emas-400/70` + glow, `badgeInfo` emas; (3) **header gelap teal berbingkai emas** `page.tsx` — gradasi `aksen-800→700→600` + `border-b emas-400/40`, tab pil aktif = gradasi teal + `ring-emas-400/80` + glow, baris tab kaca gradasi aksen→putih→emas; (4) **ornamen lama dipertahankan** — `BintangDelapan` ×3 + `LogoTartib` + `PitaIslami` 12 bintang tetap, diwarnai samar emas; **garis gold gelombang & bintang 4 arah dari berkas referensi DITOLAK sesuai arahan** (tidak pernah masuk kode); (5) `icon.svg` + `LogoTartib` diwarnai teal (`#518e7f→#246b5a`), badge Tamu "SELESAI" → token aksen, `globals.css` body krem + radial-gradient teal/emas + fokus ring aksen. Verifikasi: tsc/lint bersih, vitest **245/245** (28 berkas), build statis sukses; browser in-app (375px + 1280×900, computed style) — body krem `rgb(245,245,240)`, header gradasi teal + border emas, nav & tab kaca (aktif = `rgb(26,90,74)→rgb(36,107,90)` + ring emas + glow), kartu border emas radius 20px, tombol utama gradasi teal + ring emas, badge info emas, beranda 2 kolom @1280, nol overflow, 16 SVG ornamen utuh, tak ada garis gold gelombang/bintang 4 arah. **Tersisa: verifikasi manual Ahmed (kesan visual rupa baru di device) dan sinkron publik.**
- **Sesi 19:** **Batch Y — tindak lanjut SOP: sub-tugas + kategori rutin + cetak multi-ukuran + ekspor/impor papan** (empat arahan Ahmed: header jadi *"Pembuat SOP"*; *"fungsi sub dari tugas … dalam satu checklist bisa dibuatkan sub … mirip seperti anggota dan tugasnya"*; *"pastikan bisa di print pdf a4 / f4 dan ukuran lainnya (pasti bisa export/import jg"*; *"berikan tambahan catatan bahwa pekerjaan rutin harian, mingguan, bulanan, part, insidential/saat dibutuhkan sj"* — **K-24**). Enam lapisan: (1) **skema v5** `tartib_sopSubItem` (`id, sopId, itemId, urutan`) + `SopItem.rutin?`; hapus item/papan & duplikat/reset mengikat sub dalam transaksi, salinan reset ceklis sub; (2) `sopService` — sub CRUD lengkap, `perubahanCeklis` digeneralisasi, `bangunStrukturImporPapan` murni + `imporSopPapan` atomik, progres papan = item + sub; (3) **`tulisDocxSop` + `dokumenSopPapan`** — round-trip `tartib/sop.json` (pola K-19/K-20) + heuristik document.xml (☐ item, ↳ sub, atribut "— PIC:/Rutin:/Catatan:"), 6 test round-trip; (4) **cadangan v3** dengan `BOLEH_HILANG_SEJAK` deklaratif (v1 tanpa 3 tabel SOP, v2 tanpa sopSubItem) + label statistik "Sub-tugas SOP"; (5) `SopView` — sub-tugas menjorok ber-ceklist/PIC sendiri (+ Sub/↑↓/Ubah/Hapus), badge rutin amber + datalist saran (Harian/Mingguan/Bulanan/Part/Tahunan/Insidental), **pilihan kertas A4/F4-Folio/Letter/Legal/A5** (localStorage `tartib.sop.kertas`, `@page` di-inject dalam blok cetak + hint "Save as PDF"), "Unduh .docx" per papan, "Impor .docx" + pratinjau (jumlah item/sub/PIC, sub tanpa induk dilaporkan); (6) judul header & metadata **"Tartib — Pembuat SOP"**. Verifikasi: tsc/lint bersih, vitest **245/245** (28 berkas: +16 service/seed, +6 round-trip, +2 cadangan, −… penataan ulang test), build statis sukses; browser in-app — sub tambah/centang/hapus (progres 0/13 → 1/13 → 1/12 "termasuk 1 sub-tugas"), badge PIC+Rutin, kertas A4+F4 tersedia, unduh .docx terpicu (`SOP-Amanah & Khidmah Santri.docx`), 375px nol overflow; data uji dibersihkan. **Tersisa: verifikasi manual Ahmed (sub/rutin di device, cetak fisik A4/F4 + Save as PDF, impor .docx nyata) dan sinkron publik.**
- **Sesi 18:** **Batch X — menu SOP berdiri sendiri: papan amanah semi-paten + SOP kustom** (dua arahan Ahmed: *"tambahkan menu SOP untuk hal bersifat semi paten, misal SOP daftar tugas/amanah/khidmah santri dan PICnya yg mudah ceklist jg."* dan *"menu SOP customable"* — **K-23**). Satu tab "SOP" baru (`?view=sop`) dengan dua bagian sub-nav (pola Pengaturan): **Amanah & Khidmah** (papan baku "Amanah & Khidmah Santri" — 11 amanah seed, PIC teks bebas, ceklis satu klik + Reset Ceklis; tidak dapat dihapus = semi-paten) dan **SOP Kustom** (buat/ubah info/duplikat/hapus; salinan me-reset ceklis). Enam lapisan: tipe `Sop`/`SopItem` + **skema Dexie v4** (`tartib_sop`, `tartib_sopItem`; `baku` sengaja tidak diindex — boolean bukan kunci IndexedDB), seed `seedSopAmanah` **idempoten per tanda baku** (bukan judul), `sopService` (fungsi murni — 13 test; `hapusSop` menolak papan baku; `resetCeklis`; `pindahItemSop` swap), **cadangan v2** (tabel SOP masuk ambil/pulihkan/statistik; `bacaCadangan` menerima cadangan lama **v1** dengan bagian SOP kosong — 4 test baru), `SopView` (ceklis optimis + bar progres + Cetak A4 varian `CetakPayload` `{jenis:'papanSop'}` — blok cetak di luar kartu kaca, jebakan K-22), `page.tsx` (tab ke-7 "SOP" + pintu masuk beranda; nav dibuat `sm:flex-wrap` agar 7 tab tak pernah keluar batas). Verifikasi: lint bersih, tsc bersih, vitest **229/229** (27 berkas), build statis sukses, gate grep bersih; browser in-app — papan baku ter-seed (self-heal race seed-vs-load diperbaiki: `muatBaku` menanam sendiri bila kosong), ceklis 1/11 → 9% + badge waktu, ubah PIC tersimpan, siklus SOP kustom lengkap, statistik Pengaturan "2 SOP / 13 Item SOP", 375px nol overflow & 7 tab utuh (badge PIC tidak patah: konten `min-w-44`, tombol aksi turun baris). Data uji dibersihkan dari browser verifikasi.
- **Sesi 17:** **Kualitas rekayasa: CI + ESLint + pemecahan TemplateView + pengingat cadangan** (lima saran audit dikerjakan sekaligus atas arahan Ahmed *"oke kerjakan semuanya secara profesional"*). Empat commit: `e75f7b5` workflow CI (`.github/workflows/ci.yml` — lint+tsc+vitest+build tiap push `main`/PR; `.github/` ikut snapshot publik sehingga CI berjalan di repo ugi577/tartib), `23c7637` ESLint `next/core-web-vitals` (devDep — BUKAN stack runtime, sah via K-22; nol temuan setelah escape 2 kutip JSX di EKonfirmasiView & TemplateView), `449a910` refactor TemplateView 1416→930 baris (`components/template/`: PanelImporTemplate, PanelEksporTemplate, bersama.ts — perpindahan verbatim, formulir cetak panduan TETAP di induk di luar pembungkus `print:hidden`), `2bfe6ac` pengingat cadangan (`lib/cadanganPengingat.ts` murni + 6 test: localStorage `tartib.cadangan.terakhir`, ambang 14 hari; status tampil di Pengaturan › Data & Cadangan; token semantik baru `peringatan`=amber). Verifikasi: lint bersih, tsc bersih, vitest **209/209** (26 berkas), build statis sukses, gate grep bersih (`window.confirm`/`as any` hanya di komentar dokumentasi).
- **Sesi 15:** **Header berlogo + template baku "SOP Baku (Panduan Manual)" + Cetak Panduan A4 + header bilah penuh sesuai referensi** (tiga arahan Ahmed: dua teks — judul berikon & template baku — lalu *"buat header aplikasi sesuai referensi ini"* + gambar; K-20). Lima commit: `ff89db1` logo `LogoTartib` + judul berikon + **rupa liquid glass** (WIP Ahmed diverifikasi lalu dikomit — token tetap semantik), `0295761` `hapusTemplate` service (melengkapi tombol Hapus yang **tanpa sengaja terbawa `a7a651f`** — pelajaran: periksa diff per berkas sebelum `git add`), `8bd32e4` seed `TEMPLATE_PANDUAN` (**idempoten per nama**; 6 fase H-30…H+1, 17 item semua "Contoh:", jenis Custom) + tombol **"Cetak Panduan (A4)"** di panel "Ekspor & Cetak Template" (`CetakPayload` + varian `panduanTemplate`, perluasan aditif K-04; formulir kertas: kop + identitas + tanggal per fase + PIC per item; penanda cetak 12/4/3), `01988d4` **header bilah penuh** sesuai referensi (sticky glass gradasi sky→white→emerald, `border-b border-white/70` + shadow, logo kiri, judul+tagline, nav pil di kanan — turun baris sendiri di layar sempit). Verifikasi browser 4173 (ekspor dibangun ulang): banner terbaca, **375px: 6 tab lengkap & nol overflow**, template baku muncul (muat ulang cukup), editor 6 fase/17 item, klik Cetak memblokir webview (dialog cetak sistem — **cetak fisik = verifikasi manual Ahmed**), Unduh .docx terpicu. tsc bersih, vitest **169/169**. **WIP Capacitor Ahmed (package.json, pnpm-lock, android/, capacitor.config.ts, .gitignore) TIDAK dikomit — menunggu keputusannya.** Sesi 14 — **Tindak lanjut audit impor oleh Ahmed + BUG PENULIS ZIP ditemukan & diperbaiki.** Ahmed mengaudit pratinjau impor dokumen asli di 4173 (static export) dan menyorot: 84 item terbuang tak terverifikasi dari UI (kelas RUSAK), ikon ⚠ tanpa keterangan di fase "Kunci pengisi acara", rasio fallback Ketua Panitia. **Hasil audit walk independen (test sementara, dihapus sebelum commit):** 84 = 39 (BAGIAN 4 ceklis perlengkapan) + 33 (BAGIAN 5 peminjaman/pengembalian) + 12 (BAGIAN 6 protokol khusus) — **nol item linimasa hilang**; ⚠️ ternyata **isi dokumen** (heading asli `"H-21 — Kunci pengisi acara ⚠️"`), bukan ikon aplikasi; fallback **14/57 (24,6%)** — di bawah ambang separuh kriteria Ahmed → dipertahankan (K-19). Dua commit: `a7a651f` — `itemLuarLinimasa` (teks + konteks bagian) dipertahankan parser, pratinjau menampilkan daftar dilipat per bagian + hitungan "N tertebak, M tanpa kecocokan" sebelum simpan; `0d53a04` — **bug `buatZip`**: cdSize di EOCD dihitung dari `pos` yang sudah maju 12 byte → berkas ditolak `unzip` ("missing 12 bytes") & gagal `textutil`, padahal `bacaZip` (tidak memakai cdSize) lolos — fix + test invariant `ofset CD + ukuran CD = posisi EOCD`; hasil fix **lulus `unzip -t` dan terbaca `textutil`** (mesin native macOS). **Unduhan .docx lama (termasuk `~/Downloads/SOP-Tasyakuran-Khatam.docx` milik Ahmed) korup — unduh ulang.** tsc bersih, vitest **165/165**, ekspor statis 4173 dibangun ulang (dev dihentikan dulu — konflik `.next` terulang sekali lagi dan diatasi dengan restart). Kejadian operasional awal sesi: dev server 3000 chunk-500 karena `pnpm build` berjalan saat dev hidup (skenario catatan operasional) — di-restart, pulih. Sesi 13 — **Batch W — impor SOP pindah ke tab Template + ekspor template (.docx lokal & Google Drive) — selesai diimplementasi** (arahan Ahmed: *"salah posisi, mestinya fungsi import ini di tab template, berikan juga fungsi export, local dn gdrive"* — **K-18 membatalkan K-17 poin 1**). Tiga commit di `master`: `60a86cf` penulis ZIP (`crc32` tabel + `buatZip`: local header + central directory + EOCD, deflate `CompressionStream('deflate-raw')`; `zip.test.ts` kini memakai penulis produksi) + `src/tartib/lib/ekspor/tulisDocx.ts` (DOCX minimal 3-entry, **4 test round-trip** via `bacaZip`), `5ceb1f4` `src/tartib/lib/gdrive.ts` murni (OAuth 2.0 implicit flow popup `response_type=token` scope `drive.file` + state nonce + polling hash; token localStorage ±1 jam tanpa refresh; unggah dua langkah `uploadType=media` → PATCH `files/{id}`; client ID dari Google Cloud Console — origins `http://localhost:3000/` + `https://ugi577.github.io/tartib/`; **6 test murni**), `3d59197` UI: panel impor SOP dipindah dari tab Evaluasi ke daftar `?view=template` (EvaluasiView dibersihkan **−194 baris** — state/dialog/`pilihBerkasImpor`/`simpanImpor` dihapus) + panel "Ekspor Template" di editor (tombol "Unduh .docx" — nama berkas `SOP-<nama>.docx` — dan "Simpan ke Google Drive", label "Mengunggah…" saat proses; tanpa client ID → form inline tersembunyi + validasi "Client ID tidak boleh kosong"; semua galat via dialog/pesan aplikasi, tanpa `alert`). **Tanpa library baru** (BRIEF Bagian 4): ZIP, DOCX, OAuth, dan unggah semuanya manual. Verifikasi browser: panel impor tampil di `?view=template`, tab Evaluasi bersih, download `.docx` terpicu, form client ID muncul. Gate W teknis lulus (tsc, vitest **164/164 — 22 berkas**, build statis); **tersisa verifikasi manual Ahmed** (impor .docx asli di tab Template, buka hasil unduhan di Word, alur Drive end-to-end dengan client ID miliknya — file chooser, path unduhan, dan OAuth tidak bisa diuji lewat browser otomatis). Sesi 12 — **Batch V — impor SOP dari dokumen .docx — selesai diimplementasi** (arahan Ahmed: *"pada evaluasi, siapkan fungsi import, yg bisa dibaca/duplikasi dan modifikasi. contoh sop acara mahad ini"* — berkas `SOP ACARA - Mahad Askar Quran.docx`). Tiga commit di `master`: `a57e33c` parser (ZIP manual EOCD/central-directory + inflate `DecompressionStream('deflate-raw')`, `parseXmlLite`, `dokumenXmlKeSop` + `tebakDivisi` — 15 test), `82ecad9` `templateService.bangunStrukturImpor` murni + `imporTemplate` atomik (3 test), `9b38bed` panel "Impor SOP dari Dokumen (.docx)" di daftar `?view=evaluasi` + dialog pratinjau (fase/offset/item, nama & jenis acara bisa diubah) → simpan → pesan ringkas. **Tanpa library baru** (BRIEF Bagian 4). Hasil impor = template biasa (bisa dibaca/diduplikasi/dimodifikasi di tab Template). **Bukti end-to-end dengan dokumen asli** (test sementara, dihapus sebelum commit): judul `BUKU PANDUAN SOP ACARA`, sub-judul `Ma'had Askar Qur'an`, **9 fase** (H-30, H-21, H-14, H-10, H-7, H-3, H-1, Hari-H, H+1), **57 item** (43 divisi ditebak dari kata kunci, 14 fallback Ketua Panitia), 84 item luar linimasa (cek lis perlengkapan Bagian 4, peminjaman Bagian 5) diabaikan & dilaporkan. Gate V teknis lulus (tsc, vitest 146/146 — 20 berkas, build statis, nol overflow 375px); **tersisa verifikasi manual Ahmed** (pilih berkas .docx di browser — upload file tidak bisa diuji lewat browser otomatis — lalu cek hasil di tab Template). **K-17** mencatat keputusan desain (titik masuk tab Evaluasi, parse manual tanpa library, heuristik pemetaan, simpan atomik). Sesi 11 — **Gate U ditutup + Batch U di-merge ke `master` + sinkronisasi publik pertama via `sync-publik.sh` (perintah Ahmed: "merge semua ke master", lalu "push").** Lanjutan sesi audit UI kedua (detail di bawah): (1) **Tagline header & halaman Tentang dikoreksi** — "kawal tugas panitia sampai hari-H" → "**sampai H+1**" (arahan Ahmed: *"…sampai hari-H = sampai h+1"*) karena papan eksekusi nyatanya mencakup fase Evaluasi H+1 (offset +1 di template contoh). (2) **Gate U DITUTUP 2026-08-22** — pernyataan eksplisit Ahmed *"merge semua ke master"* (sesuai protokol: gate ditutup hanya oleh pernyataannya) → commit `chore(batch-u): pass gate` → **`git merge --no-ff batch-u-ui` ke `master`** (14 commit). (3) **Tab Tentang dibersihkan dari nama merek** (`941e4bd`, arahan Ahmed: *"hilangkan semua merk aplikasi tertentu ganti dgn kata ganti aplikasi sejenis/aplikasi lain"*) — kartu lanskap jadi "Aplikasi sejenis — penyusun dokumen SOP" / "Aplikasi sejenis — pengelola eksekusi acara", "sinkronisasi Slack/WhatsApp" → "sinkronisasi pesan instan", paragraf riset menyebut "(nama produk tidak disebutkan)"; nama asli tetap di DECISIONS K-13 (internal). (4) **Sinkronisasi publik PERTAMA dijalankan** — `./scripts/sync-publik.sh master --push`: snapshot deterministik 61 berkas (59 lama + `kelas.ts` + `kelas.test.ts`; `docs/`, `.claude/`, `scripts/` dikecualikan), commit `42429f3` fast-forward di atas `origin/main`, workflow "Deploy ke GitHub Pages" sukses (51s), konten baru **terverifikasi live** di https://ugi577.github.io/tartib/ (bundle berisi "…sampai H+1 dan cetak laporannya", "Aplikasi sejenis — penyusun dokumen SOP", "sinkronisasi pesan instan"). Sesi ini sebelumnya — **Audit UI kedua (2026-08-22, arahan Ahmed: "fokus ke ui app ini … kerjakan", skill `browser-use:control-browser` tersedia):** audit visual ulang keenam view (desktop & 375px, computed style, dialog, mode gelap) menemukan **dua bug & satu inkonsistensi** yang belum tertangkap Batch U: (1) **`${KELAS.kartuIsi}` tertulis sebagai string literal** di `TamuView` (daftar acara) & `EvaluasiView` (panel promosi usulan) — kartu tampil tanpa latar putih/garis/radius (kelas tidak pernah teraplikasi); diperbaiki `ed64c9c`; (2) **badge Aktif/Diarsipkan template** masih kelas inline (display block, berat 400) padahal KELAS.badgeAksen/badgeNetral sudah baku, dan kartu kelompok tamu memakai `border-slate-200` mentah — disatukan ke token `7bd9331`. Sisanya bersih: tidak ada overflow horizontal di 375px (board, editor, evaluasi, semua view; `truncate` pada keterangan tugas = disengaja), dialog muat 375px (343px panel, max-h 85vh), `colorScheme light` di root, penanda cetak utuh (11/3/2/2), `tsc` bersih + `vitest` 128/128 + `pnpm build` sukses (dev server di-restart setelah build, HTTP 200). Elemen `alert` yang muncul di pohon aksesibilitas = `__next-route-announcer__` bawaan Next.js (1px, tersembunyi — bukan bug). Sesi 10 — **Audit kepatuhan plan + Batch U (UI) dieksekusi** (detail sesi 10/10b di bawah). **Integrasi (Batch G) BATAL** (bukan lagi ditunda); penggantinya: **info/link di mahadapp menunjuk ke aplikasi Tartib** — **dikerjakan 2026-08-22**: entri "SOP Acara" di Studio Print v3 (`f88dfe2`, wip) membuka https://ugi577.github.io/tartib/ via `window.open(..., "_blank")` — **menunggu uji manual Ahmed di device**. Latar: kedua aplikasi direncanakan fork dengan nama lain untuk rilis publik. **Cabang `batch-g-integrasi-v3` (berisi G-1 `ea10ea6`/G-3 `4c204af`) DIHAPUS 2026-08-22** atas perintah Ahmed ("bersihkan skrg") — komit bisa dipulihkan via reflog (±90 hari), skema DB v3 tetap v37. **Repo publik `ugi577/tartib` dibuat** — Pages https://ugi577.github.io/tartib/ (HTTP 200), konten = snapshot tanpa `docs/` internal. **`docs/PLAN-UI.md` ditulis** (rencana UI pakai MCP/tool) — menunggu persetujuan eksekusi. Sesi-sesi sebelumnya: Gate A–E, T, F ditutup penuh (cetak fisik Ahmed, job CUPS `EPSON_L365_Series-1` 08:10:53, "oke lanjut").
- **Repo:** `/Users/ahmad/Projects/tartib-app` (Batch G berjalan di repo v3 `mahad-askar-app-v3`)
- **Branch aktif:** `master` di tartib-app (lokal, riwayat penuh — Batch U di-merge `366cc02`, Batch V & W langsung di master). Cabang `batch-u-ui` selesai (sudah di-merge, bisa dihapus). Repo publik `ugi577/tartib`: branch `main` = snapshot bersih 61 berkas `42429f3` tanpa `docs/` (berikutnya: `./scripts/sync-publik.sh master --push` setelah verifikasi manual). Di repo v3: `batch-g-integrasi-v3` **dihapus** 2026-08-22; `batch-q1-bookmark-halaman` masih ada
- **Bukti verifikasi Batch F (browser in-app):** (1) klik "Cetak Lembar Tugas (per PIC)" membuka dialog cetak sistem — rantai tombol → `cetakJenis` → `flushSync` → `host.cetak` → `window.print` terbukti end-to-end (dialog memblokir webview, tab ditutup); (2) ekspor Markdown mengunduh `SOP-Khatam-Tasmi-Berikutnya.md` (3,8 KB) ke `~/Downloads` — dibuka ulang, isinya diverifikasi: `# SOP ACARA`, kop jenis/tanggal, `## 1. Persiapan H-30 (H-30, 22 Agustus 2026)`, tugas per divisi dengan `_(wajib)_` & status; (3) **cetak fisik** — job CUPS `EPSON_L365_Series-1` selesai 2026-08-22 08:10:53 (`lpstat -W completed`); dialog cetak ulang terbuka dari tombol "Cetak Lembar Tugas (per PIC)" setelah driver terpasang (CGWindowList: jendela Print Center 900×450)

## Progress

- [x] `docs/BRIEF.md` — brief disalin (409 baris), commit `chore: brief awal Tartib`
- [x] `docs/PRD.md` — spesifikasi otoritatif dari BRIEF Bagian 3–6
- [x] `docs/PLAN.md` — batch A–G, gate checklist, protokol blocker, konvensi commit (changelog v1.1–v1.4)
- [x] `docs/DECISIONS.md` — K-01 s/d K-15 (entry terbaru di atas)
- [x] Scaffold Next.js 14 + TS strict + Dexie + Tailwind + Vitest, static export, tanpa fitur
- [x] Batch A — fondasi & skema (6 sub-langkah, semua commit `feat(tartib)`)
- [x] Batch B — template CRUD (5 commit `feat(tartib)`)
- [x] Batch C — acara, tugas & aturan PIC (6 commit `feat(tartib)` + 1 docs)
- [x] Batch D — tamu, porsi, perlengkapan (4 commit `feat(tartib)` + 1 fix verifikasi UI)
- [x] Batch T — ikhtisar eksekusi & Tentang, amandemen riset pasar K-13 (4 commit `feat(tartib)`)
- [x] Batch E — evaluasi per divisi & promosi usulan → versi template baru (2 commit `feat(tartib)`)
- [x] Batch F — cetak & ekspor: lembar tugas per PIC, buku acara A4, ekspor Markdown (4 commit `feat(tartib)`)
- [x] Batch U — perbaikan & percantikan UI (branch `batch-u-ui`, 6 commit + 2 tindak lanjut audit) — Gate U **teknis lulus**, menunggu verifikasi manual Ahmed
- [x] Batch V — impor SOP dari dokumen .docx (master, 3 commit) — Gate V **teknis lulus**, menunggu verifikasi manual Ahmed
- [x] Batch W — impor SOP pindah ke tab Template + ekspor template .docx lokal & Google Drive (master, 3 commit) — Gate W **teknis lulus**, menunggu verifikasi manual Ahmed
- [x] Sesi 14 — tindak lanjut audit impor (master, 2 commit: `a7a651f` daftar item terbuang + hitungan fallback di pratinjau; `0d53a04` fix bug cdSize EOCD — ekspor .docx kini lulus `unzip -t`/`textutil`)
- [x] Sesi 15 — header berlogo + liquid glass, template baku panduan manual + Cetak Panduan A4, hapusTemplate (4 commit: `ff89db1`, `0295761`, `8bd32e4` + docs)
- [x] Sesi 17 — kualitas rekayasa (master, 4 commit): CI workflow, ESLint `next/core-web-vitals`, refactor TemplateView → `components/template/` (PanelImpor/PanelEkspor/bersama), pengingat cadangan + token `peringatan` — lint/tsc/vitest 209/209/build/gate grep semua bersih
- [x] Sesi 18 — Batch X: menu SOP berdiri sendiri (master): skema v4 `tartib_sop`/`tartib_sopItem`, seed papan "Amanah & Khidmah Santri" (semi-paten), `sopService` + 13 test, cadangan v2 kompatibel baca v1 + 4 test, `SopView` (Amanah & Khidmah + SOP Kustom, ceklis satu klik, reset, duplikat, cetak A4 `papanSop`), tab ke-7 + pintu masuk beranda — lint/tsc/vitest 229/229/build/gate grep semua bersih; verifikasi browser in-app lulus
- [x] Sesi 19 — Batch Y: sub-tugas (`tartib_sopSubItem`, skema v5), kategori rutin per item, cetak multi-ukuran A4/F4/Letter/Legal/A5 (`@page` dinamis + "Save as PDF"), ekspor/impor .docx papan round-trip `tartib/sop.json`, cadangan v3, header "Pembuat SOP" — tsc/lint/vitest 245/245/build semua bersih; verifikasi browser in-app lulus
- [x] Sesi 21 — review format HP (375/360/320px nol overflow, dev server CSS-404 di-restart) + APK debug 4,8 MB berisi seluruh fitur sampai sesi 20 (build ID termuat, tsc/lint/vitest 245/245/build bersih) — master, komit dokumen (PLAN v1.30 + PROJECT-STATE)
- [x] Sesi 20 — rupa kaca krem–teal–emas dari referensi UI Ahmed (master): palet `aksen` teal + `emas` baru + `permukaan.dasar` krem, kartu/tombol/badge ber-emas, header gelap teal berbingkai emas, ornamen lama (BintangDelapan/LogoTartib/PitaIslami) dipertahankan, garis gold gelombang & bintang 4 arah ditolak, icon.svg/LogoTartib teal — tsc/lint/vitest 245/245/build semua bersih; verifikasi browser 375px & 1280×900 lulus
- [x] Batch G — integrasi v3 — **BATAL — keputusan final pisahkan (K-15)**: G-2/G-4/G-5/Gate G **tidak dikerjakan**; cabang `batch-g-integrasi-v3` (G-1 `ea10ea6`, G-3 `4c204af`) **DIHAPUS 2026-08-22** (komit pulih via reflog ±90 hari, skema v3 tetap v37). Pengganti dikerjakan: **entri "SOP Acara" di Studio Print v3** menunjuk https://ugi577.github.io/tartib/ (`f88dfe2` wip — **menunggu uji manual device**)

## Batch A — hasil

1. `src/tartib/types/index.ts` — 12 tipe domain + union `StatusAcara`/`StatusTugas`/`StatusRsvp`/`StatusPerlengkapan`
2. `src/tartib/db/schema.ts` — `TartibDb extends Dexie` (`tartib-db`, versi 1), 12 tabel `tartib_*` berindex, `buatId()`, singleton `tartibDb`
3. `src/tartib/db/seed.ts` — `seedDivisiBaku()` (13, BRIEF Bagian 8), `seedJenisAcara()` (8), `seedTemplateContoh()` (Tasyakuran Khatam, fase H-30/H-7/H-0/H+1, 33 item), `jalankanSeed()`; data murni diekspor & idempotent
4. `src/tartib/host/TartibHost.ts` + `standaloneHost.ts` — satu-satunya batas integrasi (K-04); `cetak` = `window.print()`
5. `src/tartib/lib/porsi.ts` — `hitungPorsi` (aritmetika integer, fixture 240 ✓) + `hitungPeralatan` (144/264 ✓)
6. `src/tartib/lib/rumusQty.ts` — parser terbatas tanpa `eval` (A-04): variabel porsi/santri/panitia/rsvp, `+ - * /`, kurung, `ceil`/`round`; selain itu `RumusError`

## Batch B — hasil

1. `src/tartib/services/templateService.ts` — `TemplateError`, fungsi murni `salinStrukturTemplate`/`templateUntukDuplikat`/`templateVersiBaru` (diuji), CRUD template, editor fase (tambah/ubah/hapus/pindah) & item (tambah/ubah/hapus/pindah, validasi rumusQty A-04, divisi wajib)
2. `src/tartib/services/divisiService.ts` — `daftarDivisi()`, `tambahDivisi()`, `ubahDivisi()` (nama unik case-insensitive, urutan max+1)
3. `src/tartib/lib/urutan.ts` — `urutanBerikutnya` (max+1, tidak mengisi celah) + 3 test
4. Skema Dexie **v2** — index `dibuatPada` di `tartib_template` & `tartib_acara` (untuk `usePagedList`), upgrade otomatis tanpa migrasi
5. `src/tartib/lib/usePagedList.ts` — hook daftar terpaginasi lokal (pola v3-mandated: terima `Table` langsung; opsi di ref agar aman diberi fungsi filter inline)
6. `src/tartib/components/AppDialog.tsx` — `AppDialog`/`FormDialog`/`KonfirmasiDialog`; nol `window.confirm` di seluruh kode
7. `src/tartib/components/TemplateView.tsx` — daftar template (paginasi), editor fase & item, dialog baru/duplikat/versiBaru/arsip/fase/item/hapus dengan tampilan error service layer
8. `src/app/page.tsx` — shell routing `?view=beranda|template|acara` (Suspense + useSearchParams, `next/*` hanya di sini); `AcaraView` stub (isi di Batch C)

## Batch C — hasil

1. `src/tartib/services/acaraService.ts` — `siapkanSnapshotAcara` murni (K-03/A-02: item template disalin sekali ke `tartib_tugas`, fase → salinan `tartib_fase` milik acara K-11), `buatDariTemplate` (status `DRAF`), `setStatus` menegakkan A-01 (`PicBelumLengkapError` berisi nama divisi), `statusBerikutnya` (DRAF→SIAP→BERJALAN→SELESAI→DIEVALUASI, null di terminal), `ambilFaseAcara` (papan)
2. `src/tartib/services/tugasService.ts` — `perubahanStatusTugas` murni (status sama → referensi sama, SELESAI mengisi `selesaiPada`, keluar SELESAI menghapusnya), `ubahStatusTugas` (get → `===` → put), `daftarTugasAcara`, `statusBerikutnya` (siklus BELUM→JALAN→SELESAI→BATAL→BELUM)
3. `src/tartib/services/acaraDivisiService.ts` — `daftarAcaraDivisi`, `tetapkanPic` (trim, nama wajib), `kosongkanPic`
4. `src/tartib/lib/tanggal.ts` — `geserTanggal` (kalender lokal, DST-aman, validasi round-trip), `formatTanggalIndonesia` (Intl `id-ID`), `formatOffsetHari` (H-30/Hari H/H+1), `tanggalHariIni`
5. `src/tartib/components/AcaraView.tsx` — daftar acara (paginasi `usePagedList`), dialog buat dari template (`buatDariTemplate`), papan tugas per fase (tanggal nyata = `tanggal - offsetHari`, status tugas cycling, `selesaiPada`), PIC divisi per baris, indikator kesiapan PIC (tombol SIAP dinonaktifkan + hint merah saat PIC belum lengkap)

## Gate C — status

- [x] Buat acara dari template = snapshot sekali (A-02) — `tartib_tugas` + `tartib_fase` milik acara; grep: `templateItem` hanya di schema/seed/templateService
- [x] Tugas terikat fase & divisi, status berjalan (BELUM→JALAN→SELESAI/BATAL, reopen BATAL→BELUM) — `tugasService` + test
- [x] PIC divisi diisi/kosongkan dari halaman acara — `acaraDivisiService`
- [x] A-01 ditegakkan di `setStatus` — `PicBelumLengkapError`; UI menonaktifkan tombol SIAP + menampilkan jumlah divisi belum ber-PIC
- [x] Teknis: tsc bersih, vitest 70/70 (9 file), `pnpm build` (static export) sukses, grep bebas `window.confirm`, `as any`, & impor `next/*` di `src/tartib`
- [x] **Verifikasi manual Ahmed di perangkat fisik** (UI + IndexedDB) — lulus, 2026-08-22

## Batch D — hasil

1. `tugas` menyimpan `rumusQty` saat snapshot (K-12 — perluasan A-02; `perlengkapanService` tidak perlu membaca `templateItem`)
2. `src/tartib/services/tamuService.ts` — CRUD kelompok tamu, RSVP rombongan, `rekapKelompok` (+ test murni)
3. `src/tartib/services/perlengkapanService.ts` — `generatePerlengkapan()` dari `rumusQty` tugas (+ test murni)
4. `src/tartib/components/TamuView.tsx` — kelompok tamu, RSVP, panel porsi (komponen perhitungan + toggle tim pencuci), ceklis perlengkapan
5. Fix verifikasi UI (f52a61c): `jalankanSeed()` dipanggil di titik masuk aplikasi; skema **v3** (index `nama` di `tartib_jenisAcara`) + pemetaan eksplisit field class ↔ store `tartib_*`; seed dibungkus transaksi (idempoten terhadap double-effect React StrictMode)

## Batch T — hasil (amandemen riset pasar, K-13)

1. `src/tartib/lib/ikhtisar.ts` + test (14) — `ikhtisarTugas` (persen selesai; BATAL dikecualikan dari penyebut), `ikhtisarPerDivisi`, `statusWaktuFase` (LALU/HARI_INI/MENDATANG, perbandingan string YYYY-MM-DD), `faseHariIni`, `faseBerikutnya`
2. `AcaraView` — progres keseluruhan (bar + persen + fase berikutnya), badge Hari ini/Mendatang + sorotan kartu fase, x/y selesai per fase, progres tugas di baris PIC
3. Cetak Laporan Eksekusi — `CetakPayload` bertambah `ikhtisarEksekusi` (aditif, K-04); tombol cetak via `standaloneHost.cetak`; kop laporan `hidden print:block`; kontrol interaktif `print:hidden` (termasuk shell `page.tsx`); kontak PIC tampil di cetakan
4. `src/tartib/components/TentangView.tsx` + tab `?view=tentang` — posisi produk: peta lanskap (pembuat dokumen vs eksekusi acara), 4 cara Tartib mengisi celah, backlog yang disengaja (notifikasi/Slack/ERP — K-09)

## Gate D — status — LULUS 2026-08-22 (browser in-app)

- [x] Teknis: tsc bersih, vitest 94/94 (12 file), `pnpm build` statis sukses
- [x] Fix bug verifikasi UI ter-commit (seed, skema v3, transaksi idempoten)
- [x] RSVP rombongan & rekap benar; porsi fixture 240; toggle pencuci 144↔264; qtyFinal 250 dengan qtyHitung 240 utuh (bukti di Posisi)

## Gate T — status — LULUS 2026-08-22 (browser in-app; cetak kertas fisik ditangguhkan)

- [x] Teknis: tsc bersih, vitest 94/94, `pnpm build` statis sukses
- [x] Progres & waktu fase = fungsi murni teruji (14 test ikhtisar)
- [x] Papan progres, badge fase hari-ini/berikutnya, kop cetak di DOM, halaman Tentang (bukti di Posisi)

## Batch E — hasil

1. `src/tartib/services/evaluasiService.ts` + 7 test — `InputEvaluasi` (divisiId + berjalanBaik/kurang/usulan), `inputEvaluasiSah` (trim; divisi wajib; minimal satu kolom terisi), `simpanEvaluasi` (upsert per acara+divisi; usulan berubah → penanda `sudahDipromosikan` direset), `daftarEvaluasi`, `promosikanUsulan(evaluasiId, templateId)` (tolak usulan kosong / sudah dipromosikan / fase hilang; transaksi atomik: template lama dinonaktifkan + `templateVersiBaru` + salin struktur + item dari usulan di fase terakhir + penanda evaluasi), `EvaluasiError`
2. `src/tartib/components/EvaluasiView.tsx` + tab `?view=evaluasi` — daftar acara; lembar evaluasi per divisi (3 kolom + Simpan, aria-label unik per divisi); badge "tersimpan" dan "usulan sudah dipromosikan"; panel promosi: pilih template target (default = versi aktif tertinggi sejenis), daftar usulan tersedia (hanya yang berisi), tombol Promosikan → pesan sukses naik versi

## Gate E — status — LULUS 2026-08-22 (browser in-app)

- [x] Siklus penuh terbukti: acara → evaluasi → promosi → acara baru memuat item hasil promosi (34 tugas = 33 + 1)
- [x] Promosi membuat versi baru (v2 aktif), versi lama utuh — `templateVersiBaru` teruji; transaksi atomik
- [x] Usulan sudah dipromosikan tidak bisa dipromosikan lagi — tombol → badge; `EvaluasiError`; usulan yang berubah boleh promosi ulang
- [x] Teknis: tsc bersih, vitest 101/101 (13 file), `pnpm build` statis sukses

## Batch F — hasil

1. `src/tartib/lib/cetak/lembarTugas.ts` + 6 test — `susunLembarTugas({ acara, fases, divisi, acaraDivisi, tugas })` murni → `LembarPic[]`: hanya baris acaraDivisi ber-PIC, urut per urutan divisi, tugas diisi hanya dari divisinya (fase diurutkan, lalu urutan tugas); lembar tetap dihasilkan walau divisi tanpa tugas
2. `src/tartib/lib/cetak/bukuAcara.ts` + 7 test — `susunBukuAcara({ acara, jenisNama, fases, divisi, tugas })` murni → `BukuAcara` (kop + bagian per fase): `tanggalFase = geserTanggal(acara.tanggal, offsetHari)`, tugas dikelompokkan per divisi (urut urutan divisi), jam = `jamMulai–jamSelesai` bila terisi
3. `src/tartib/lib/ekspor/markdown.ts` + 7 test — `bukuAcaraKeMarkdown(buku, dicetakPada)` → Markdown rapi: `# SOP ACARA`, kop baris (jenis · Hari-H · waktu · lokasi), `## {urutan}. {fase} (offset, tanggal)`, `### {divisi}`, `- judul — catatan _(wajib)_ Status: …`, fase kosong diberi keterangan; tanpa spasi menggantung
4. `AcaraView.tsx` — state `cetakAktif` (`'lembarTugas' | 'bukuAcara' | 'ikhtisarEksekusi'`, default ikhtisar); `cetakJenis()` pakai `flushSync` (react-dom) sebelum `host.cetak()` agar bagian print ter-commit ke DOM; ekspor Markdown = Blob + tautan unduh (`SOP-{nama}.md`); bagian print `hidden print:block`, kontrol `print:hidden`; lembar tugas per PIC pakai `break-before-page` (halaman baru per orang), buku acara `break-inside-avoid` per kelompok; `@page { size: A4; margin: 14mm }` di `globals.css`

## Gate F — status — LULUS 2026-08-22

- [x] Teknis: tsc bersih, vitest 121/121 (16 file), `pnpm build` statis sukses
- [x] Lembar tugas per PIC — isi diuji 6 test `susunLembarTugas` (hanya tugas divisi sendiri, urutan fase & tugas, PIC tanpa kontak, divisi tanpa tugas); satu halaman per orang via `break-before-page`; rantai tombol → `host.cetak()` → dialog cetak sistem terbukti end-to-end di browser
- [x] Buku acara A4 — isi diuji 7 test `susunBukuAcara` (tanggal fase nyata, urutan, pengelompokan divisi); batas kertas diamankan `@page A4 14mm`; media print tidak bisa diemulasi di webview IAB, jadi pemisahan halaman diverifikasi lewat test + CSS statis
- [x] Ekspor Markdown dapat dibuka ulang — unduhan nyata `SOP-Khatam-Tasmi-Berikutnya.md` (3,8 KB) ke `~/Downloads`, dibuka ulang, isi diverifikasi
- [x] **Ahmed mencetak fisik** — retry cetak setelah driver EPSON terpasang: dialog cetak terbuka dari "Cetak Lembar Tugas (per PIC)" (CGWindowList: jendela Print Center 900×450 di layar; webview tidak terblokir), job CUPS `EPSON_L365_Series-1` selesai 2026-08-22 08:10:53 (`lpstat -W completed`), Ahmed menyatakan lanjut ("oke lanjut")

## Batch U — hasil (branch `batch-u-ui`, belum di-merge)

1. `309e12e` docs — Batch U + Gate U masuk PLAN, PLAN-UI dikoreksi, **K-16** dicatat (alat diganti Browser pane; dua temuan dinaikkan jadi bug)
2. `f8403a0` **fix dua bug**: `globals.css` menyatakan `color-scheme: light` + memberi `body` warna latar/teks sendiri + satu gaya `:focus-visible` (sebelumnya cincin oranye bawaan browser); kertas cetak tetap putih. `page.tsx`: daftar tab jadi data + `flex-wrap` (enam tab selalu terjangkau, `aria-current` pada tab aktif); tiga baris judul view diberi `flex-wrap` agar keterangan tidak tertimpa tombol
3. `72fa1be` **token desain + kelas bersama**: `tailwind.config.ts` (semula kosong) memuat token semantik `aksen`/`netral`/`permukaan`/`garis`/`teks`, radius `kontrol`/`kartu`, bayangan `kartu`/`angkat`; `src/tartib/ui/kelas.ts` = satu sumber kelas + `badgeStatusAcara/Tugas/Rsvp`; `kelas.test.ts` 7 test (tiap status punya badge sendiri, status semakna sewarna lintas domain, semua tombol seradius, hanya varian utama boleh aksen pekat)
4. `c510eaa` **103 baris kelas inline diganti token** di enam komponen; `klasInput`/`klasAksi`/`klasDanger` lokal jadi alias ke `KELAS`; tiga fungsi `warnaStatus*` terduplikasi dihapus
5. `b7f5a9a` **hierarki per view**: beranda lima kartu pintu masuk (Evaluasi & Tentang sebelumnya hanya lewat tab); papan acara — empat tombol cetak/ekspor masuk panel berlabel "Cetak & ekspor" (label tombolnya **tidak** diubah agar bukti Gate F tetap berlaku), tanggal fase tidak lagi berbadge aksen; editor template — panah ↑↓ jadi tombol ikon ber-`aria-label`, "Hapus" item (33 baris) netral-sampai-disorot, "Hapus" fase tetap merah, "Arsip" tidak lagi merah; kosakata warna teks diseragamkan ke token `teks-*` (**162 `text-slate-*` diganti 161 `teks-*`**, nilai warna identik)
6. `882302f` docs — closeout Batch U: PLAN v1.13, Gate U teknis lulus
7. `8e51183` (tindak lanjut audit sesi 10b) — **11 kelas inline bernilai identik diganti token** di enam komponen (`bg-slate-50`→`bg-permukaan-halus`, `bg-emerald-50`→`bg-aksen-50`, `text-emerald-700`→`text-aksen-700`, `hover:bg-slate-100`→`hover:bg-netral-100`); `75751ad` `scripts/sync-publik.sh` — snapshot publik deterministik (dry-run default, tolak `docs/`/`.claude/`, `--push` fast-forward tanpa force)
8. `ed64c9c` (sesi 11, audit UI kedua) — **perbaiki dua string literal `${KELAS.kartuIsi}`** yang membuat daftar acara di `?view=tamu` dan panel "Promosikan Usulan ke Template" di `?view=evaluasi` tampil tanpa kartu (kelas tidak pernah teraplikasi — string biasa, bukan template literal)
9. `7bd9331` (sesi 11) — **badge Aktif/Diarsipkan** di daftar & editor template memakai `KELAS.badgeAksen`/`badgeNetral` (sebelumnya kelas inline sendiri: display block, berat 400, tanpa ring); kartu kelompok tamu `border-slate-200` → token `border-garis`

## Batch V — hasil impor SOP dari dokumen (master, 3 commit)

1. `a57e33c` **parser impor** — `src/tartib/lib/impor/`: `zip.ts` (`bacaZip`: EOCD → central directory → local header, metode 0/8, inflate `deflate-raw` via `DecompressionStream`, tolak metode lain), `xml.ts` (`parseXmlLite`: elemen/atribut/teks/CDATA/komentar, entitas & referensi karakter), `dokumenSop.ts` (`dokumenXmlKeSop`: fase = paragraf tebal berawalan H-offset, item = ☐, `BAGIAN n —` memutus fase aktif, sub-judul & prosa diabaikan, item luar linimasa dihitung; `offsetDariLabel`/`labelFaseBersih`/`tebakDivisi` kata kunci → 13 divisi baku) — **15 test**
2. `82ecad9` **service** — `templateService.bangunStrukturImpor` (murni: urutan fase/item, validasi nama/label/judul wajib, divisi dikenal, rumusQty sah — 3 test) + `imporTemplate` (satu transaksi Dexie: gagal satu item = tidak ada yang tersimpan)
3. `9b38bed` **UI** — panel "Impor SOP dari Dokumen (.docx)" di daftar `?view=evaluasi`: pilih berkas → parse → dialog pratinjau (fase + offset + jumlah item, item luar linimasa dilaporkan, nama template & jenis acara bisa diubah) → "Simpan sebagai Template" → pesan ringkas (fase/item, divisi tebakan vs fallback) + arahan buka tab Template. Fallback divisi: Ketua Panitia; divisi item = tebakan kata kunci (bisa diubah di editor)

## Gate V — status — teknis LULUS 2026-08-22, menunggu verifikasi manual Ahmed

- [x] Pipeline terbukti pada **dokumen asli** (`SOP ACARA - Mahad Askar Quran.docx`, verifikasi end-to-end Node — test sementara dihapus sebelum commit): judul `BUKU PANDUAN SOP ACARA`, sub-judul `Ma'had Askar Qur'an`, **9 fase** (H-30, H-21, H-14, H-10, H-7, H-3, H-1, Hari-H, H+1), **57 item** (43 divisi ditebak, 14 fallback Ketua Panitia), 84 item luar linimasa diabaikan & dilaporkan
- [x] Tanpa library baru — hanya `DecompressionStream`, `TextDecoder`, `Blob` (BRIEF Bagian 4 terjaga); parser murni diuji tanpa IndexedDB
- [x] Hasil impor = template biasa — bisa dibaca (daftar/editor), diduplikasi (Duplikat), dimodifikasi (editor fase/item) di tab Template
- [x] Simpan atomik — `imporTemplate` satu transaksi; error service layer ditampilkan (judul kosong, jenis acara kosong, divisi hilang)
- [x] Teknis — `tsc` bersih, `vitest` 146/146 (20 berkas), `pnpm build` statis sukses; browser: panel tampil di `?view=evaluasi`, nol overflow di 375px (input file 309px, tampil)
- [ ] **Verifikasi manual Ahmed** — pilih berkas .docx nyata di browser (upload file tidak bisa diuji lewat browser otomatis), periksa pratinjau, simpan, lalu buka hasilnya di tab Template (baca/duplikat/modifikasi)

## Batch W — hasil impor pindah tab + ekspor template (master, 3 commit)

1. `60a86cf` **penulis ZIP + ekspor DOCX** — `lib/impor/zip.ts` bertambah penulis produksi: `TABEL_CRC` + `crc32` (polinomial 0xedb88320), `EntryZip` (nama/isi/metode 0|8), `buatZip` (local header 30+nama+data, central directory 46+nama dengan ofset lokal, EOCD 22 byte; deflate via `CompressionStream('deflate-raw')`, tanggal DOS 0x0021) — `zip.test.ts` dirombak memakai penulis produksi (pembuat duplikat di test dihapus); `lib/ekspor/tulisDocx.ts` (`tulisDocx`: DOCX minimal 3 entry `[Content_Types].xml`/`_rels/.rels`/`word/document.xml`; paragraf 1 nama, paragraf 2 `jenis — catatan`, fase tebal `offset — label`, item `☐ judul`) — **4 test round-trip** (baca ulang via `bacaZip`, isi `word/document.xml` benar)
2. `5ceb1f4` **Google Drive** — `lib/gdrive.ts` murni & teruji (**6 test**): `bangunUrlOtorisasi` (implicit flow `response_type=token`, scope `drive.file`, state nonce), `bacaTokenDariHash` + `simpanToken`/`bacaToken` (localStorage `tartib.gdrive.token`, buffer kedaluwarsa 60 dtk, ±1 jam tanpa refresh)/`hapusToken`, `simpanClientId`/`bacaClientId` (`tartib.gdrive.clientId`), `unggahKeDrive` (POST `uploadType=media` → PATCH `files/{id}`; pesan galat: sesi kedaluwarsa, HTTP ditolak, id hilang, batal/tolak, state tidak cocok, token tidak ada)
3. `3d59197` **UI** — panel "Impor SOP dari Dokumen (.docx)" pindah ke daftar `?view=template` (EvaluasiView dibersihkan −194 baris); panel "Ekspor Template" di editor template: "Unduh .docx" (`URL.createObjectURL` → `<a download>` → revoke; nama `SOP-<nama>.docx`) + "Simpan ke Google Drive" (`tungguTokenPopup`: popup `window.open('', 'tartib-gdrive')` + polling `w.location.hash` ~500 ms + `w.closed` + 240 upaya; tanpa client ID → form inline tersembunyi, tersimpan di browser; label "Mengunggah…" saat proses; galat via pesan aplikasi, tanpa `alert`)

## Gate W — status — teknis LULUS 2026-08-22, menunggu verifikasi manual Ahmed

- [x] **Posisi impor benar** — panel impor tampil di daftar `?view=template` (verifikasi browser) dan **hilang dari tab Evaluasi** (EvaluasiView bersih)
- [x] Ekspor **.docx lokal** — download event terpicu dengan nama `SOP-<nama>.docx` (verifikasi browser); bytes dokumen diuji round-trip di Node (4 test `tulisDocx` → `bacaZip`)
- [x] Ekspor **Google Drive** — 6 test murni (URL otorisasi, token dari hash, simpan/baca client ID, unggah dua langkah); tanpa client ID → form inline + validasi "Client ID tidak boleh kosong" (verifikasi browser)
- [x] Tanpa library baru — penulis ZIP manual (`CompressionStream`), DOCX 3-entry, OAuth & unggah manual (`fetch`); murni & teruji
- [x] Teknis — `tsc` bersih, `vitest` 164/164 (22 berkas), `pnpm build` statis sukses
- [ ] **Verifikasi manual Ahmed** — impor .docx asli di tab Template (file chooser tidak bisa diuji browser otomatis), periksa **daftar item yang dibuang** di pratinjau (baru sesi 14), buka hasil unduhan `.docx` **yang diunduh ulang** (unduhan lama korup) di Word, alur Drive end-to-end dengan client ID dari Google Cloud Console miliknya

## Sesi 14 — hasil tindak lanjut audit impor (master, 2 commit)

1. `a7a651f` — `dokumenSop.ts`: `itemLuarLinimasa: { teks, bagian }[]` menggantikan hitungan `itemTanpaFase` (heading `BAGIAN n —` dicatat sebagai konteks); pratinjau `TemplateView`: `<details>` berisi daftar item terbuang dikelompokkan per bagian (max-h 56 scroll internal) + keterangan "Divisi tiap item adalah perkiraan…: N tertebak, M tanpa kecocokan memakai Ketua Panitia" sebelum simpan
2. `0d53a04` — `zip.ts`: cdSize EOCD dihitung sebelum penulisan EOCD (dulu: dari `pos` yang sudah maju 12 byte → cdSize +12 → `unzip` "missing 12 bytes", `textutil` gagal); test baru: invariant `u32(eocd+16) + u32(eocd+12) === eocd`; validasi nyata: `unzip -t` OK, `textutil -convert txt` mengeluarkan isi (nama, jenis — catatan, fase, item ☐)

## Gate U — status — DITUTUP 2026-08-22 atas perintah Ahmed "merge semua ke master" (sesi 11)
- [x] BUG-U1 hilang — di `prefers-color-scheme: dark`: `bodyBg` `rgb(248,250,252)`, `colorScheme` `light`, halaman terbaca (screenshot 375px mode gelap)
- [x] BUG-U2 hilang — 375px: 6 tab, **0 tab keluar batas**, keenam view tanpa scroll horizontal (`scrollWidth == clientWidth`)
- [x] Satu pola tombol/badge/kartu/input — grep kelas tombol inline: **0**; `warnaStatus*` lokal: **0**
- [x] Cetak tidak berubah — `print:hidden` 11, `print:block` 3, `break-before-page` 2, `break-inside-avoid` 2 (identik dengan `b077e73`); `@page{size:A4;margin:14mm}` ada di CSS hasil build; token `teks-*` terbukti bernilai sama persis dengan `slate-*` yang digantikan
- [x] Teknis — `tsc` bersih, `vitest` 128/128 (17 berkas), `pnpm build` statis sukses
- [x] Smoke fungsional di browser — klik "→ JALAN" mengubah satu tugas BELUM→JALAN, badge jadi `badgeInfo` (`rgb(224,242,254)`), ringkasan progres jadi "0 dari 34 tugas selesai · 1 sedang berjalan"
- [x] (sesi 10b) Diverifikasi ulang setelah dev server di-restart — computed style `colorScheme light`/`bodyBg rgb(248,250,252)`/`bodyColor rgb(51,65,85)` cocok dengan klaim `f8403a0` (dev server tidak basi; tab browser yang basi — reload cukup); 375px: enam link nav lengkap, `scrollWidth == clientWidth` == 375, `flex-wrap: wrap`; smoke klik + status dikembalikan ke BELUM (0 selesai, 0 berjalan — data utuh); `@page{size:A4;margin:14mm}` & `color-scheme:light` ada di CSS hasil build
- [x] (sesi 11, audit UI kedua) Audit browser ulang dengan `browser-use:control-browser` — keenam view di 1280px & 375px + detail (board acara, editor template, kelompok/RSVP, lembar evaluasi) + dialog di 375px + computed style: **nol overflow horizontal**, enam tab nav lengkap, kartu/panel semua ber-token, dialog muat viewport (343px, max-h 85vh, scroll internal), `colorScheme light` di root; temuan baru diperbaiki (`ed64c9c` dua string literal `${KELAS.kartuIsi}`; `7bd9331` badge Aktif/Diarsipkan → token) dan diverifikasi di browser (kelas kartu panel promosi = `rounded-kartu border border-garis bg-permukaan-kartu p-4 shadow-kartu`); elemen `alert` di pohon aksesibilitas = `__next-route-announcer__` Next.js (tersembunyi, bukan bug)
- [x] **Verifikasi manual Ahmed — Gate U DITUTUP 2026-08-22** atas perintah eksplisit Ahmed *"merge semua ke master"* → merge `--no-ff` `batch-u-ui` → `master` (`366cc02`); sinkronisasi publik pertama via `sync-publik.sh --push` (`42429f3`, 61 berkas, deploy sukses — lihat sesi 11 di Posisi)

## Next step (presisi)

Gate F **tertutup** 2026-08-22 (cetak fisik job CUPS `EPSON_L365_Series-1` 08:10:53 + pernyataan Ahmed). **Keputusan final K-15 (2026-08-22): Tartib dan mahadapp DIPISAHKAN — Batch G (integrasi v3) BATAL** — G-2/G-4/G-5/Gate G tidak akan dikerjakan. **Sesi 9 selesai 2026-08-22:** (1) **repo publik `ugi577/tartib`** dibuat (publik; GitHub Pages https://ugi577.github.io/tartib/ terverifikasi HTTP 200; konten = snapshot 59 file tanpa `docs/` internal; workflow `pnpm install --frozen-lockfile` + `pnpm build` dengan `NEXT_PUBLIC_BASE_PATH=/tartib`, `fix(ci)` node 22); (2) **link pengganti integrasi dikerjakan**: entri "SOP Acara" di Studio Print v3 (`f88dfe2`, wip) membuka https://ugi577.github.io/tartib/ — **menunggu uji manual Ahmed di device**; (3) **cabang `batch-g-integrasi-v3` DIHAPUS** (G-1 `ea10ea6`/G-3 `4c204af` pulih via reflog ±90 hari); (4) **`docs/PLAN-UI.md` ditulis** — rencana perbaikan/percantikan UI pakai MCP & tool lain — **menunggu persetujuan Ahmed untuk eksekusi**. **Sesi 10 (2026-08-22):** audit kepatuhan plan **lulus** (semua klaim sesi 9 terverifikasi: Pages HTTP 200, `origin/main` 59 berkas tanpa `docs/`, `master` tanpa upstream, dokumen jangkar lengkap), lalu **Batch U dieksekusi** di branch `batch-u-ui` — 6 commit, Gate U teknis lulus. **Sesi 10b (2026-08-22, tindak lanjut saran audit):** 11 kelas inline bernilai identik diganti token (`8e51183`); perbaikan BUG-U1/BUG-U2 diverifikasi ulang di browser; `pnpm build` + `@page A4` terverifikasi di CSS hasil build; dev server di-restart; `scripts/sync-publik.sh` dibuat (`75751ad`, dry-run teruji 59 berkas — **belum dipakai**); angka Batch U dikoreksi (103 baris / 162→161 / 6 commit). **Sesi 11 (2026-08-22, audit UI kedua, arahan "fokus ke ui app ini … kerjakan"):** audit browser ulang (`browser-use:control-browser` — skill yang dulu dikira hilang ternyata tersedia di sesi ini, K-16 diperbarui) menemukan & memperbaiki dua bug + satu inkonsistensi token (`ed64c9c`, `7bd9331`); verifikasi penuh: `tsc` bersih, `vitest` 128/128, `pnpm build` sukses, penanda cetak utuh, dev server berjalan kembali (HTTP 200).** **Sesi 13 (2026-08-22, arahan Ahmed: *"salah posisi, mestinya fungsi import ini di tab template, berikan juga fungsi export, local dn gdrive"*):** Batch W — impor SOP dipindah dari tab Evaluasi ke daftar tab Template (K-18 membatalkan K-17 poin 1) + ekspor template dua target: unduh `.docx` lokal (penulis ZIP + `tulisDocx`, round-trip teruji) dan Google Drive (OAuth implicit flow popup + unggah dua langkah, 6 test) — 3 commit `60a86cf`/`5ceb1f4`/`3d59197`, Gate W teknis lulus, verifikasi browser lengkap (detail di Posisi).

**Langkah berikutnya, berurutan:**
1. ~~Ahmed memverifikasi Batch U di perangkat~~ — **Gate U DITUTUP 2026-08-22** atas perintah eksplisit Ahmed *"merge semua ke master"*.
2. ~~`chore(batch-u): pass gate` → `git merge --no-ff batch-u-ui` ke `master`~~ — **SELESAI 2026-08-22** (merge commit `366cc02`; 14 commit masuk; `master` kini memuat seluruh Batch U + perbaikan audit sesi 11 + tagline H+1).
3. ~~Sinkronisasi snapshot ke repo publik~~ — **SELESAI 2026-08-22** atas perintah Ahmed *"push"*: `scripts/sync-publik.sh master --push` → commit `42429f3` (61 berkas) di `origin/main`, deploy Pages sukses, konten baru terverifikasi live (tagline H+1, "Aplikasi sejenis", "sinkronisasi pesan instan").
4. **Ahmed memverifikasi Batch V + W** — impor: buka `?view=template`, pilih berkas .docx (mis. `SOP ACARA - Mahad Askar Quran.docx`), periksa pratinjau (fase/offset/item), simpan sebagai template, lalu baca/duplikat/modifikasi hasilnya (titik masuk kini di tab Template — K-18). Ekspor lokal: di editor template, "Unduh .docx" lalu buka hasilnya di Word. Ekspor Drive: "Simpan ke Google Drive" dengan client ID dari Google Cloud Console miliknya (origins `http://localhost:3000/` + `https://ugi577.github.io/tartib/`). Gate V & W ditutup hanya oleh pernyataannya.
5. **Ahmed memverifikasi Batch X + Y (sesi 18–19)** — buka tab **SOP**: isi PIC tiap amanah di papan "Amanah & Khidmah Santri", coba sub-tugas (+ Sub), isi kategori rutin, centang/bebas ceklis, Reset Ceklis; bagian **SOP Kustom**: buat SOP sendiri, duplikat, hapus; lalu **cetak fisik** lembar ceklis (pilih ukuran A4/F4/Letter/Legal/A5; PDF = "Save as PDF" di dialog cetak) dan **impor .docx** (coba berkas hasil "Unduh .docx" — round-trip penuh). Gate X & Y ditutup hanya oleh pernyataannya.
6. Setelah lulus: `./scripts/sync-publik.sh master --push` — snapshot publik berikutnya (saat ini repo publik masih `42429f3`; master kini juga memuat Sesi 17–19 — sehingga push pertama akan menyertakan semuanya; workflow CI aktif di repo publik sejak `.github/` ikut snapshot).

**Belum diputuskan:** (a) jadwal sinkronisasi berikutnya — `scripts/sync-publik.sh` **sudah terbukti dipakai** (`42429f3`, fast-forward, tanpa force); setiap perubahan `master` berikutnya tinggal `./scripts/sync-publik.sh master --push`; (b) branding aplikasi (nama/logo untuk publik) — **token semantik Batch U membuat ini cukup mengubah `tailwind.config.ts`**; (c) kapan uji manual device v3 (entri SOP Acara di Studio Print, `f88dfe2` masih `wip`).

## Gate A — status

- [x] `pnpm tsc --noEmit` bersih, nol `as any` (grep terverifikasi)
- [x] `pnpm vitest run` hijau — 30/30 (scaffold 1, porsi 8, rumusQty 10, seed 11)
- [x] Seed: 13 divisi + 8 jenis + template contoh utuh — diuji lewat data murni (isi IndexedDB menunggu verifikasi manual Ahmed)
- [x] Test porsi lulus fixture 21 Agustus (240 / 144 / 264)
- [x] Parser rumus menolak input berbahaya — 10 test (`eval`, `alert`, `Math.ceil`, `fetch`, `porsi[0]`, arity, pembagian nol, dll.)
- [x] Tidak ada impor dari luar `src/tartib/` selain React & Dexie — grep: hanya `dexie`; `vitest` hanya di file test
- [x] **Verifikasi manual Ahmed:** buka `pnpm dev` → seed menulis 13 divisi + template contoh ke IndexedDB — lulus, 2026-08-22

## Gate B — status

- [x] Template dibuat/diduplikat/diversikan — `templateService` + test fungsi murni (versi baru = versi lama tetap terbaca)
- [x] Fase tambah/ubah/urut ulang/hapus — service layer; hapus fase ikut menghapus item-nya, acara tidak terpengaruh (K-11)
- [x] Item template terikat fase & divisi — validasi service layer (fase & divisi wajib ada, rumusQty A-04)
- [x] Versi lama tetap terbaca setelah versi baru — `templateVersiBaru` test + `versiBaruTemplate` menonaktifkan (bukan menghapus) versi lama
- [x] Teknis: tsc bersih, vitest 39/39 (6 file), `pnpm build` (static export) sukses, grep bebas `window.confirm` & `next/*` di `src/tartib`
- [x] **Verifikasi manual Ahmed di perangkat fisik** (UI + IndexedDB) — lulus, 2026-08-22

## Files touched (Batch A)

- `src/tartib/types/index.ts`, `src/tartib/db/schema.ts`, `src/tartib/db/seed.ts`, `src/tartib/db/seed.test.ts`, `src/tartib/host/TartibHost.ts`, `src/tartib/host/standaloneHost.ts`, `src/tartib/lib/porsi.ts`, `src/tartib/lib/porsi.test.ts`, `src/tartib/lib/rumusQty.ts`, `src/tartib/lib/rumusQty.test.ts`
- `docs/PLAN.md` (changelog v1.1), `docs/context/PROJECT-STATE.md`

## Files touched (Batch B)

- `src/tartib/services/templateService.ts` + `templateService.test.ts`, `src/tartib/services/divisiService.ts`, `src/tartib/lib/urutan.ts` + `urutan.test.ts`, `src/tartib/lib/usePagedList.ts`, `src/tartib/components/AppDialog.tsx`, `src/tartib/components/TemplateView.tsx`, `src/tartib/components/AcaraView.tsx` (stub), `src/tartib/db/schema.ts` (v2), `src/app/page.tsx`
- `docs/DECISIONS.md` (K-11), `docs/PLAN.md` (changelog v1.2), `docs/context/PROJECT-STATE.md`

## Riwayat commit (Batch A)

- `a2fcaad` feat(tartib): tipe domain Tartib (Batch A-1)
- `cc8a5e1` feat(tartib): skema Dexie tartib-db versi 1 (Batch A-2)
- `9d47bd7` feat(tartib): seed divisi baku, jenis acara, template contoh (Batch A-3)
- `d73a694` feat(tartib): interface TartibHost + standaloneHost (Batch A-4)
- `07dba4d` feat(tartib): kalkulator porsi & peralatan dengan fixture 240/144/264 (Batch A-5)
- `96d186f` feat(tartib): parser rumus qty terbatas tanpa eval, tolak fungsi asing (Batch A-6)

## Riwayat commit (Batch B)

- `f68382c` feat(tartib): templateService CRUD + editor fase/item, salinStrukturTemplate murni (Batch B-1)
- `288c8f3` feat(tartib): divisiService daftar/tambah/ubah, nama unik, urutan max+1 (Batch B-2)
- `c4ab8c2` feat(tartib): skema v2 (index dibuatPada) + usePagedList lokal (Batch B-3)
- `3d367bd` feat(tartib): AppDialog + KonfirmasiDialog + FormDialog tanpa window.confirm (Batch B-4)
- `676ccbc` feat(tartib): halaman ?view=template (daftar + editor fase/item) + shell routing (Batch B-5)

## Files touched (Batch C)

- `src/tartib/services/acaraService.ts` + `acaraService.test.ts`, `src/tartib/services/tugasService.ts` + `tugasService.test.ts`, `src/tartib/services/acaraDivisiService.ts`, `src/tartib/lib/tanggal.ts` + `tanggal.test.ts`, `src/tartib/components/AcaraView.tsx` (stub → papan penuh)
- `docs/DECISIONS.md` (K-11), `docs/PLAN.md` (changelog v1.2), `docs/context/PROJECT-STATE.md`

## Riwayat commit (Batch C)

- `ad72e46` feat(tartib): acaraService snapshot sekali ke acara — tugas + fase milik acara (Batch C-1)
- `d7f4607` feat(tartib): tugasService ubahStatusTugas, selesaiPada saat SELESAI (Batch C-2)
- `2223efe` feat(tartib): acaraDivisiService tetapkanPic/daftar/kosongkan (Batch C-3)
- `1d99aab` feat(tartib): setStatus menegakkan A-01 — PicBelumLengkapError saat PIC belum lengkap (Batch C-4)
- `044c308` feat(tartib): halaman ?view=acara — papan tugas per fase, tanggal nyata, PIC divisi (Batch C-5)
- `18f8a5d` docs(tartib): catat keputusan K-11 (fase disnapshot ke acara) + changelog v1.2
- `fcf37df` feat(tartib): indikator kesiapan PIC — tombol SIAP dinonaktifkan saat PIC belum lengkap (Batch C-6)

## Riwayat commit (Batch D)

- `938f908` feat(tartib): tugas menyimpan rumusQty saat snapshot acara (K-12, Batch D-1)
- `93d05c2` feat(tartib): tamuService — kelompok tamu, RSVP rombongan, rekapKelompok (Batch D-2)
- `a327446` feat(tartib): perlengkapanService — generatePerlengkapan dari rumusQty tugas (Batch D-3)
- `a86f4ca` feat(tartib): halaman ?view=tamu — kelompok tamu, RSVP, panel porsi, ceklis perlengkapan (Batch D-4)
- `f52a61c` fix(tartib): seed dijalankan di titik masuk + skema v3 (index nama) + pemetaan tabel eksplisit + transaksi idempoten (Batch D, bug verifikasi UI)

## Riwayat commit (Batch T)

- `f1dcc94` feat(tartib): lib ikhtisar — progres tugas, ringkasan divisi, waktu fase (Batch T-1)
- `719cc07` feat(tartib): progres eksekusi di papan acara — persen selesai, fase hari-ini/berikutnya, progres per divisi (Batch T-2)
- `9464e76` feat(tartib): cetak laporan eksekusi — payload ikhtisarEksekusi, kop laporan, kontrol tersembunyi saat print (Batch T-3)
- `3369576` feat(tartib): halaman ?view=tentang — posisi produk dari riset lanskap 2026-08-22 (Batch T-4)

## Files touched (Batch D & T)

- Batch D: `src/tartib/services/tamuService.ts` + test, `src/tartib/services/perlengkapanService.ts` + test, `src/tartib/components/TamuView.tsx`, `src/tartib/types/index.ts` (rumusQty di Tugas), `src/tartib/db/schema.ts` (v3 + pemetaan), `src/tartib/db/seed.ts` (transaksi), `src/app/page.tsx` (seed + tab tamu)
- Batch T: `src/tartib/lib/ikhtisar.ts` + test, `src/tartib/components/AcaraView.tsx` (progres + cetak), `src/tartib/host/TartibHost.ts` (payload ikhtisarEksekusi), `src/tartib/components/TentangView.tsx`, `src/app/page.tsx` (tab tentang + print:hidden)
- Docs (K-13): `docs/DECISIONS.md`, `docs/PRD.md` (§8 amandemen), `docs/PLAN.md` (Batch T + changelog v1.4), `docs/context/PROJECT-STATE.md`

## Files touched (Batch E)

- `src/tartib/services/evaluasiService.ts` + `evaluasiService.test.ts`, `src/tartib/components/EvaluasiView.tsx`, `src/app/page.tsx` (tab evaluasi)
- `docs/PLAN.md` (Gate E LULUS + changelog v1.6), `docs/context/PROJECT-STATE.md`

## Riwayat commit (Batch E)

- `61d591c` feat(tartib): evaluasiService — simpan/daftar evaluasi per divisi + promosikanUsulan versi template baru (A-03, Batch E-1)
- `9a6d3c0` feat(tartib): halaman ?view=evaluasi — lembar per divisi + promosi usulan versi template baru (Batch E-2)

## Files touched (Batch F)

- `src/tartib/lib/cetak/lembarTugas.ts` + `lembarTugas.test.ts`, `src/tartib/lib/cetak/bukuAcara.ts` + `bukuAcara.test.ts`, `src/tartib/lib/ekspor/markdown.ts` + `markdown.test.ts`, `src/tartib/components/AcaraView.tsx` (tombol cetak & ekspor, bagian print), `src/app/globals.css` (@page A4)
- `docs/PLAN.md` (Gate F + changelog v1.7), `docs/context/PROJECT-STATE.md`

## Riwayat commit (Batch F)

- `2777705` feat(tartib): lembar tugas per PIC — satu halaman per orang, hanya tugas divisinya (Batch F-1)
- `688719e` feat(tartib): buku acara — SOP lengkap satu acara untuk A4 (Batch F-2)
- `893b2d7` feat(tartib): ekspor Markdown — buku acara ke berkas .md yang dapat dibuka ulang (Batch F-3)
- `f8413fe` feat(tartib): tombol cetak lembar tugas/buku acara via host.cetak + ekspor Markdown + halaman A4 (Batch F-4)

## Blocker

Tidak ada blocker teknis. Gate A–E, T, dan F **lulus penuh** (termasuk cetak fisik Ahmed 2026-08-22). **Batch G (integrasi v3) BATAL — keputusan final pisahkan (K-15, 2026-08-22)**: cabang `batch-g-integrasi-v3` **dihapus** 2026-08-22; G-2/G-4/G-5/Gate G tidak akan dikerjakan. Item pengganti **dikerjakan**: entri "SOP Acara" di Studio Print v3 → https://ugi577.github.io/tartib/ (`f88dfe2`, wip) — **menunggu uji manual di device**. **Batch U (UI) DITUTUP & DI-MERGE 2026-08-22** (Gate U ditutup perintah Ahmed "merge semua ke master"; merge `--no-ff` `366cc02`; snapshot publik disinkronkan `42429f3`). **Batch V (impor SOP dari dokumen .docx) selesai diimplementasi** di `master` (3 commit: `a57e33c`, `82ecad9`, `9b38bed`); Gate V teknis lulus, **menunggu verifikasi manual Ahmed** (pilih berkas .docx di browser — upload tidak bisa diuji lewat browser otomatis — lalu cek hasil di tab Template). **Batch W (impor SOP pindah ke tab Template + ekspor template .docx lokal & Google Drive) selesai diimplementasi** di `master` (3 commit: `60a86cf`, `5ceb1f4`, `3d59197` — K-18); Gate W teknis lulus, **menunggu verifikasi manual Ahmed** (impor .docx di `?view=template`, buka hasil unduhan di Word, alur Drive dengan client ID miliknya). **Sesi 14 (tindak lanjut audit impor Ahmed):** `a7a651f` pratinjau memperlihatkan daftar item terbuang + hitungan fallback (audit 84 = 39+33+12, nol item linimasa hilang; ⚠️ = isi dokumen; fallback 14/57 — K-19); `0d53a04` **fix bug penulis ZIP** — ekspor .docx lama ditolak pembaca ketat (cdSize +12 byte), kini lulus `unzip -t` + `textutil`; **unduhan lama korup, unduh ulang**. Ekspor statis 4173 sudah memuat semua perbaikan. Dev server berjalan di localhost:3000.

- **Catatan operasional (sesi 10):** `pnpm build` dan `next dev` berebut direktori `.next` — setelah build, chunk dev jadi 404 dan halaman tampil tanpa CSS. Jalankan build saat dev berhenti, atau restart dev sesudahnya. Gejala serupa juga muncul kalau dev server menyajikan berkas yang sedang diedit setengah jalan; restart menyelesaikannya. **Sesi 10b:** CSS di dev server bisa sudah benar sementara tab browser masih memegang CSS lama (computed style tidak cocok dengan sumber, mis. `bodyBg` transparan & `colorScheme normal`) — cek dulu CSS yang disajikan (`curl` halaman + stylesheet), reload tab cukup; jangan langsung menyalahkan dev server.

- Shell sesi: Fish — jangan pakai heredoc; file ditulis lewat file tool.
- Jangan install library di luar BRIEF Bagian 4.
- Seed 13 divisi baku & sumber item template contoh: BRIEF Bagian 8.
- pnpm 11: izin build script lewat `pnpm-workspace.yaml` (`allowBuilds: esbuild: true`), bukan field `pnpm` di package.json (sudah tidak dibaca).
- Dexie aman di-import di lingkungan Node (hanya `open()` yang butuh IndexedDB) — singleton `tartibDb` tidak mengganggu vitest.
