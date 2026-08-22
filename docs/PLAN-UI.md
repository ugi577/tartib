# PLAN-UI — Rencana perbaikan & percantikan tampilan Tartib

> **Status: DIEKSEKUSI** — ditulis 2026-08-22 (sesi 9, item 5 Ahmed: *"plan mcp / tool lain untuk perbaiki / percantik uinya"*), disetujui 2026-08-22 (sesi 10: *"sy konfirmasi — lalu kerjakan"*), dieksekusi 2026-08-22 (sesi 10, Batch U, 6 commit) + dirapikan 2026-08-22 (sesi 10b, tindak lanjut audit: 11 kelas inline bernilai identik diganti token, `8e51183`). **Audit ulang sesi 11 (2026-08-22, arahan Ahmed "fokus ke ui app ini … kerjakan"):** audit browser kedua memakai skill `browser-use:control-browser` (tersedia di sesi ini — lihat koreksi K-16 di bawah) menemukan 2 bug sisa + 1 inkonsistensi token, diperbaiki `ed64c9c` & `7bd9331`. Terdaftar sebagai **Batch U** di `docs/PLAN.md`, branch `batch-u-ui`, ditutup oleh **Gate U** (teknis lulus; verifikasi manual Ahmed tersisa).

## Latar belakang

Ahmed meminta rencana penggunaan MCP / tool lain untuk memperbaiki dan mempercantik UI Tartib (latar lama: *"spy tampilan ui nya stabil dan sistemnya plus bagus"*). Konteks baru memperkuat urgensi: Tartib kini punya **wajah publik** (https://ugi577.github.io/tartib/), dan kedua aplikasi direncanakan fork dengan nama lain untuk rilis publik — tampilan adalah kesan pertama.

## Alat yang tersedia (tanpa library baru)

> **Koreksi K-16 (2026-08-22, diperbarui sesi 11).** Rencana ini semula menyebut skill MCP `browser-use:control-browser` dan `browser-use:web-gui-tester`. Skill tersebut **tidak tersedia** di sesi agen yang mengeksekusi (sesi 10), jadi diganti Browser pane bawaan yang cakupannya setara. **Sesi 11 membuktikan skill itu memang ada** di lingkungan ini — audit ulang UI berjalan penuh lewat `browser-use:control-browser` (snapshot DOM, computed style via evaluasi read-only, klik nyata, ubah viewport). *Aturan: jangan menyebut alat di rencana tanpa memastikan alat itu ada di sesi yang akan menjalankannya.*

| Alat | Peran |
|---|---|
| Browser pane: `preview_start` + `navigate` | Buka `localhost:3000`, pindah antar `?view=` |
| `read_page` (pohon aksesibilitas + `ref`), `get_page_text` | Inspeksi struktur & teks nyata; sumber `ref` untuk klik/isi form |
| `computer` (`screenshot`, `left_click`, `type`) + `form_input` | Uji interaktif: klik nyata, isi form; tangkap bukti sebelum/sesudah |
| `resize_window` (`preset: mobile`, `colorScheme`) | Regresi lebar ponsel 375px & mode gelap |
| `javascript_tool`, `read_console_messages` | Baca computed style / batas elemen; pastikan konsol bersih |
| Tailwind 3.4 + `globals.css` | Token desain di `tailwind.config.ts` (U-2, `72fa1be`): alias semantik `aksen`/`netral`/`permukaan`/`garis`/`teks`, radius `kontrol`/`kartu` — branding kelak cukup mengubah satu berkas |
| Vitest / tsc / `pnpm build` | Regresi fungsional: beautifikasi tidak boleh mematahkan logika (Nihil dianggap bukti) |

## Kendala & aturan

1. **BRIEF Bagian 4** — tidak ada library/UI kit/font baru tanpa persetujuan Ahmed. Rencana ini hanya memakai Tailwind + CSS yang sudah ada.
2. **Static export + routing `?view=`** — tidak ada server, tidak ada route baru; perubahan murni presentasional.
3. **"Nihil dianggap bukti"** — setiap perubahan diverifikasi di browser (screenshot) sebelum diklaim; verifikasi manual Ahmed tetap penutup.
4. **Konvensi PLAN** — tidak commit perubahan UI sebelum verifikasi perangkat fisik; eksekusi memakai batch kecil + commit `feat`/`fix` terpisah per area, Gate UI ditutup dengan pernyataan Ahmed.
5. **Jangan merusak cetak** — `@page A4 14mm` (Gate F) dan bagian `print:block`/`print:hidden` adalah batas keras; beautifikasi layar tidak boleh mengubah dokumen cetak.
6. Satu sesi agen pada repo yang sama; `.claude/` tidak disentuh.

## Audit baseline — 2026-08-22 (dijalankan di `localhost:3000`, data nyata)

Data uji: seed template contoh "Tasyakuran Khatam" (4 fase, 33 item) + acara **"Khatam Tasmi Angkatan 12"** (22 Agustus 2026, Aula Utama Ma'had, 33 tugas, 13 divisi belum ber-PIC) yang dibuat lewat UI.

**Bug (RUSAK — bukan soal selera, dikerjakan lebih dulu di U-1):**

- **BUG-U1 — tidak terbaca di mode gelap.** `body` tanpa warna latar, dokumen tanpa `color-scheme` → di perangkat bermode gelap kanvas jadi hitam sementara teks tetap `slate-700/800`. Bukti: `backgroundColor: rgba(0,0,0,0)`, `colorScheme: normal`, `<h1>` `rgb(30,41,59)` di atas hitam; screenshot judul & nav nyaris tak terbaca. Berlaku juga di situs publik.
- **BUG-U2 — dua tab hilang di lebar ponsel.** `nav` = `flex gap-2`, `flex-wrap: nowrap`, `overflow-x: visible` → tautan berakhir di x=545 pada kontainer 359px: **Evaluasi** dan **Tentang** keluar batas. Baris judul view (`justify-between` tanpa `flex-wrap`) juga menumpuk: teks "…perubahan template tidak mengubah acara…" tertimpa tombol **Buat Acara**.

**Inkonsistensi (percantikan, U-2 s/d U-4):**

- `tailwind.config.ts` kosong — tidak ada token desain; `globals.css` hanya berisi `@page` cetak (tidak ada dasar tipografi, warna, maupun gaya fokus — fokus input memakai cincin oranye bawaan browser).
- **Tiga gaya tombol untuk peran yang sama:** aksi utama emerald (`Buat Acara`, `Buat Template`), tetapi `Buka` dan `Hitung Ulang Perlengkapan` memakai slate-800/900 (hitam), sisanya outline. Kelas tombol ditulis inline di tiap komponen (`TamuView` sudah punya `klasInput`/`klasAksi` lokal — pola yang tinggal diangkat jadi milik bersama).
- **Status tidak satu pola:** `DRAF` & RSVP tampil sebagai badge, `BELUM/JALAN/SELESAI/BATAL` di papan tugas tampil sebagai teks polos; `warnaStatusAcara`/`warnaStatusTugas`/`warnaStatusRsvp` terduplikasi di dua berkas.
- **Radius campur:** `rounded-lg` 74×, `rounded-xl` 26×, `rounded-full` 26×, `rounded-md` 1× — tanpa aturan kapan memakai yang mana.
- **Hierarki papan acara:** tombol cetak/ekspor (4 buah) berbobot visual sama dengan aksi utama "Lanjutkan ke SIAP".
- **Dinding tombol di editor template:** tiap dari 33 item mengulang ↑ ↓ Ubah **Hapus**, dan `Hapus` merah adalah elemen paling mencolok di halaman.
- **Beranda tidak lengkap:** hanya 3 kartu pintu masuk (Template, Acara, Tamu) — Evaluasi & Tentang tidak punya kartu.
- Warna dasar sudah konsisten satu keluarga (`slate` + aksen `emerald`) — tidak ada campuran `gray`/`zinc`, jadi tokenisasi = merapikan peran, bukan mengganti palet.

## Tahapan eksekusi (Batch U, branch `batch-u-ui`)

0. **Baseline** — ✔ selesai (lihat "Audit baseline" di atas): navigasi tiap `?view=`, screenshot desktop & 375px, computed style diperiksa.
1. **U-1 Bug tampilan dasar** — `globals.css`: latar & warna teks `body`, `color-scheme`, gaya `:focus-visible`; `page.tsx`: nav bisa dijangkau di ponsel, judul view tidak menumpuk tombol.
2. **U-2 Token desain** — `tailwind.config.ts`: alias **semantik** (`aksen`, `permukaan`, `garis`, bayangan kartu) — bukan nama warna — supaya keputusan branding yang masih terbuka bisa dijalankan dari satu berkas.
3. **U-3 Komponen bersama** — `src/tartib/ui/kelas.ts` sebagai satu-satunya sumber kelas: tombol (utama/sekunder/halus/bahaya/ikon), input, label, kartu, kondisi kosong, badge, dan **satu helper warna status** untuk `StatusAcara`/`StatusTugas`/`StatusRsvp` (menghapus duplikasi di `AcaraView`/`TamuView`).
4. **U-4 Per view** — beranda (pintu masuk lengkap), acara (aksi utama vs cetak/ekspor), template (redam dinding tombol Hapus), tamu, evaluasi, tentang.
5. **U-5 Regresi cetak** — lembar tugas per PIC, buku acara A4, laporan eksekusi tetap utuh (`@page A4 14mm`, `print:block`/`print:hidden`).
6. **U-6 Regresi fungsional** — `tsc` bersih, `vitest` hijau, `pnpm build` statis sukses, smoke klik tiap view di Browser pane.
7. **Bukti** — screenshot sebelum/sesudah untuk Ahmed → verifikasi manual di perangkat (terang & gelap, ponsel & layar lebar) → **Gate U** ditutup pernyataan eksplisit Ahmed → baru `merge --no-ff`.

## Di luar scope (butuh keputusan terpisah)

Dark mode, font baru, set ikon baru, UI kit/komponen pihak ketiga, animasi besar — semuanya menuntut persetujuan (BRIEF Bagian 4) dan tidak masuk rencana ini sampai diputuskan.

## Status tracker

- [x] Disetujui Ahmed untuk eksekusi — 2026-08-22
- [x] Baseline & audit (tahap 0) — 2 bug + 7 inkonsistensi tercatat
- [x] U-1 Bug tampilan dasar — `f8403a0` (mode gelap, nav ponsel, judul menumpuk)
- [x] U-2 Token desain — `72fa1be`
- [x] U-3 Komponen bersama — `72fa1be` (fondasi) + `c510eaa` (103 baris kelas inline diganti token di enam komponen; 11 lagi tindak lanjut audit `8e51183`)
- [x] U-4 Per view — `b7f5a9a`
- [x] U-5 Regresi cetak — penanda cetak identik sebelum/sesudah (`print:hidden` 11, `print:block` 3, `break-before-page` 2, `break-inside-avoid` 2); `@page{size:A4;margin:14mm}` ada di CSS hasil build; satu-satunya perubahan di blok cetak adalah `text-slate-800` → `text-teks-utama` yang nilainya identik (`rgb(30,41,59)`, diperiksa lewat computed style)
- [x] U-6 Regresi fungsional — `tsc` bersih, `vitest` 128/128 (17 berkas), `pnpm build` statis sukses; smoke di browser: klik "→ JALAN" mengubah satu tugas BELUM→JALAN (badge jadi `badgeInfo`, progres tetap 0/34 selesai + "1 sedang berjalan"); enam view di 375px tanpa scroll horizontal (diverifikasi ulang sesi 10b: `scrollWidth == clientWidth` == 375, enam link nav lengkap)
- [x] **Audit ulang sesi 11** (`browser-use:control-browser`) — keenam view 1280px & 375px + detail (board, editor template, kelompok/RSVP, lembar evaluasi) + dialog 375px: nol overflow horizontal, semua kartu/panel/badge ber-token, dialog muat viewport, `colorScheme light`. **Temuan & perbaikan:** BUG-11A `${KELAS.kartuIsi}` sebagai string literal di `TamuView` (daftar acara) & `EvaluasiView` (panel promosi) — kartu tampil polos; `ed64c9c`. BUG-11B badge Aktif/Diarsipkan template memakai kelas inline sendiri (display block, berat 400) + `border-slate-200` mentah di kartu kelompok tamu; `7bd9331` → `KELAS.badgeAksen`/`badgeNetral`/`border-garis`. Terverifikasi di browser (kelas panel promosi = `rounded-kartu border border-garis bg-permukaan-kartu p-4 shadow-kartu`; badge Aktif = `inline-flex … font-medium … text-aksen-700`); `tsc` bersih, `vitest` 128/128, `pnpm build` sukses, penanda cetak utuh (11/3/2/2)
- [x] **Gate U — verifikasi manual Ahmed — DITUTUP 2026-08-22** atas perintah eksplisit Ahmed: *"merge semua ke master"* → Batch U di-merge `--no-ff` ke `master` (changelog PLAN v1.15). Sebelum merge, tagline dikoreksi ("sampai hari-H" → "sampai H+1" — papan mencakup fase Evaluasi H+1) dan audit UI kedua menuntaskan `ed64c9c` + `7bd9331`
