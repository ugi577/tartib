# PLAN — Tartib

Cara eksekusi proyek, batch demi batch. Sumber: `docs/BRIEF.md` Bagian 7.

- Tiap batch: **branch sendiri**, commit kecil per sub-langkah.
- Gate ditutup hanya dengan pernyataan eksplisit Ahmed untuk butir verifikasi manual.
- Routing model: Batch A & C (`clo` high), E & G (`clo` high/xhigh) — di situ aturan yang tidak boleh salah. Batch B, D, F boleh `glm`/`cc-deep` effort lo.
- **UI (perbaikan & percantikan tampilan):** **Batch U**, rencana lengkap di `docs/PLAN-UI.md` — memakai Browser pane bawaan agen (`preview_start`/`navigate`/`read_page`/`computer`) + token Tailwind; disetujui & dieksekusi 2026-08-22 (K-16).

---

## Konvensi commit

| Scope | Contoh |
|---|---|
| Dokumen | `docs(prd): ...`, `docs(plan): ...`, `docs(decisions): ...`, `docs(state): ...` |
| Fitur | `feat(tartib): ...` |
| Perbaikan | `fix(tartib): ...` |
| Test | `test(tartib): ...` |
| Fondasi/scaffold | `chore(scaffold): ...` |
| WIP / blocker | `wip(tartib): ...` — wajib disertai catatan di PROJECT-STATE |

Aturan:
- Commit kecil per sub-langkah; jangan mencampur dua batch dalam satu commit.
- Tidak commit perubahan UI sebelum verifikasi perangkat fisik.

## Protokol blocker

- **Error yang sama gagal diperbaiki 2×** → berhenti, lapor Ahmed dengan hipotesis dan yang sudah dicoba.
- Saat berhenti karena limit/blocker: **commit WIP** + tulis blocker di `docs/context/PROJECT-STATE.md` (Batch / Progress / Next step presisi / Files touched) → lalu berhenti.
- Model non-Claude yang menawarkan refactor di luar PLAN → **tolak, arahkan balik ke PLAN**.
- `PROJECT-STATE.md` dibaca **pertama** dan diperbarui **terakhir**, tanpa kecuali.
- Tidak ada dua sesi agent bersamaan pada repo yang sama.

---

## Batch A — Fondasi & skema · `clo` high

Branch: `batch-a-fondasi-skema`

1. `src/tartib/types/index.ts` — seluruh tipe dari PRD 5.1: `JenisAcara`, `Template`, `Fase`, `TemplateItem`, `Divisi`, `Acara`, `AcaraDivisi`, `Tugas`, `KelompokTamu`, `Rsvp`, `Perlengkapan`, `Evaluasi` + union `StatusAcara` / `StatusTugas` / `StatusRsvp` (PRD 5.2)
2. `src/tartib/db/schema.ts` — `class TartibDb extends Dexie` (`tartib-db`), versi 1, tabel `tartib_*` sesuai PRD 5.1
3. `src/tartib/db/seed.ts` — `seedDivisiBaku()` (13 divisi, daftar di BRIEF Bagian 8), `seedJenisAcara()` (8 jenis), `seedTemplateContoh()` (Tasyakuran Khatam, fase H-30…H+1, item dari Buku Panduan SOP Bagian 3 & 4)
4. `src/tartib/host/TartibHost.ts` — interface `TartibHost` (PRD 5.5) + `src/tartib/host/standaloneHost.ts` — `standaloneHost` (Dexie sendiri, `cetak` = `window.print()`)
5. `src/tartib/lib/porsi.ts` — `hitungPorsi()`, `hitungPeralatan()` (PRD 5.4) + `src/tartib/lib/porsi.test.ts` dengan fixture 21 Agustus (240 / 144 / 264)
6. `src/tartib/lib/rumusQty.ts` — `parseRumusQty(ekspresi: string, konteks): number`, parser terbatas (A-04, PRD 5.3) + test termasuk kasus tolak: `eval`, pemanggilan fungsi asing, token tak dikenal

**Gate A**
- [ ] `pnpm tsc --noEmit` bersih, nol `as any`
- [ ] `pnpm vitest run` hijau
- [ ] Seed menghasilkan 13 divisi + template contoh utuh
- [ ] Test porsi lulus dengan fixture 21 Agustus (240 / 144 / 264)
- [ ] Parser rumus menolak input berbahaya — ada test
- [ ] Tidak ada satu pun impor dari luar `src/tartib/` selain React & Dexie

## Batch B — Template CRUD · `glm`/`cc-deep` lo

Branch: `batch-b-template-crud`

1. `src/tartib/services/templateService.ts` — `buatTemplate()`, `duplikatTemplate()`, `versiBaruTemplate()`, `arsipTemplate()`
2. `src/tartib/services/divisiService.ts` — `daftarDivisi()`, `tambahDivisi()`, `ubahDivisi()`
3. Halaman `?view=template` — daftar template + editor fase + editor item (komponen `src/tartib/components/...`, pakai `usePagedList`)
4. `<AppDialog>` untuk semua konfirmasi (tidak ada `window.confirm`)

**Gate B**
- [ ] Template dapat dibuat, diduplikat, dan diversikan
- [ ] Fase dapat ditambah/urut ulang/hapus
- [ ] Item template terikat fase & divisi
- [ ] Versi lama tetap terbaca setelah versi baru dibuat
- [ ] Verifikasi manual Ahmed di perangkat fisik

## Batch C — Acara, tugas & aturan PIC · `clo` high ▲

Branch: `batch-c-acara-pic`

1. `src/tartib/services/acaraService.ts` — `buatDariTemplate()` melakukan **snapshot** (K-03, A-02): seluruh item tersalin ke `tartib_tugas`
2. `src/tartib/services/tugasService.ts` — `ubahStatusTugas()` (BELUM/JALAN/SELESAI/BATAL), `selesaikanPada()` saat SELESAI
3. `src/tartib/services/acaraDivisiService.ts` — `tetapkanPic()`, `daftarAcaraDivisi()`
4. **`acaraService.setStatus()` menegakkan A-01** — melempar `PicBelumLengkapError` bila ada divisi bertugas tanpa PIC; UI hanya menampilkan pesan
5. Halaman `?view=acara` — papan tugas per fase, tanggal nyata = `tanggal - offsetHari`
6. Indikator kesiapan: berapa divisi belum ber-PIC

**Gate C**
- [ ] Acara dibuat dari template → seluruh item tersalin sebagai tugas
- [ ] Mengubah template **tidak** mengubah acara yang sudah dibuat — ada test
- [ ] `setStatus('SIAP')` gagal bila ada divisi bertugas tanpa PIC — ada test
- [ ] Tanggal tiap fase terhitung benar dari tanggal acara
- [ ] Tidak ada jalur kode yang membaca `templateItem` untuk acara berjalan
- [ ] Verifikasi manual Ahmed di perangkat fisik

## Batch D — Tamu, porsi, perlengkapan · `cc-deep` lo

Branch: `batch-d-tamu-porsi`

1. `src/tartib/services/tamuService.ts` — CRUD `KelompokTamu`, `catatRsvp()` dengan **jumlah rombongan**, `rekapKelompok()`
2. Halaman `?view=tamu` — rekap per kelompok: diundang / konfirmasi / total orang
3. `src/tartib/services/perlengkapanService.ts` — `generatePerlengkapan()` dari `rumusQty` template
4. Panel porsi — menampilkan komponen perhitungan (rsvp × buffer + santri + panitia + cadangan), bukan hanya hasil; toggle tim pencuci

**Gate D** — LULUS 2026-08-22 (verifikasi browser in-app oleh agent, atas instruksi Ahmed "verif gate, buka browser di sini")
- [x] RSVP mencatat rombongan; rekap kelompok benar — "Wali Santri: diundang 100 · RSVP 2 · konfirmasi 1 · total orang 80" (rombongan BELUM tidak masuk hitungan hadir)
- [x] Porsi terhitung sesuai fixture 21 Agustus (240) — panel menampilkan komponen: 130×125%=163 + 47 + 20 + 10 = 240
- [x] Peralatan berubah saat opsi tim pencuci ditoggle (144 ↔ 264) — 0,6× ↔ 1,1×
- [x] Qty perlengkapan boleh ditimpa manual (`qtyFinal`=250) dan label "hitung otomatis: 240" (`qtyHitung`) tetap tersimpan

## Batch T — Ikhtisar eksekusi & Tentang (amandemen riset pasar 2026-08-22) · `glm` lo

Branch: `batch-t-ikhtisar-tentang` — ditambahkan dari riset lanskap Ahmed (K-13): celah terbesar
adalah jembatan dokumen SOP ↔ eksekusi real-time untuk acara kecil–menengah. Batch F (cetak
lembar tugas/buku acara) tidak terpengaruh; Batch T fokus lapisan ikhtisar + posisi produk.

1. `src/tartib/lib/ikhtisar.ts` — fungsi murni: `ikhtisarTugas` (persen selesai, BATAL dikecualikan dari penyebut), `ikhtisarPerDivisi`, `statusWaktuFase` (LALU/HARI_INI/MENDATANG), `faseHariIni`, `faseBerikutnya`
2. Papan acara — progres keseluruhan (bar + persen), badge Hari ini/Mendatang per fase, x/y selesai per fase, progres per divisi di baris PIC
3. Cetak Laporan Eksekusi — payload `ikhtisarEksekusi` di `TartibHost.cetak`; kop laporan khusus print; kontrol interaktif `print:hidden`
4. Halaman `?view=tentang` — posisi produk: peta lanskap (pembuat dokumen vs eksekusi acara), celah yang diisi, dan yang disengaja backlog (notifikasi/ERP — K-09)

**Gate T** — LULUS 2026-08-22 (verifikasi browser in-app oleh agent, atas instruksi Ahmed; cetak kertas fisik ditangguhkan — kop & kontrol print terverifikasi di DOM, Ahmed dapat mencetak kapan saja)
- [x] Teknis: tsc bersih, vitest 94/94 (12 file), `pnpm build` statis sukses
- [x] Progres & waktu fase dihitung fungsi murni yang teruji (14 test ikhtisar)
- [x] Verifikasi: papan progres (0→1/33, 0%→3%, per fase 1/8, per divisi 0/3), badge "Hari ini" pada fase H+1 (22 Agustus) + hint fase berikutnya, `selesaiPada` ("selesai 22 Agu, 07.09"), tombol & kop "Laporan Eksekusi" di DOM, halaman Tentang utuh

## Batch E — Evaluasi & umpan balik · `clo` high ▲

Branch: `batch-e-evaluasi`

1. `src/tartib/services/evaluasiService.ts` — `simpanEvaluasi()`, `daftarEvaluasi()`
2. Halaman `?view=evaluasi` — per divisi: berjalan baik / kurang / usulan
3. **`promosikanUsulan(evaluasiId, templateId)`** — membuat versi template baru berisi item tambahan dari usulan (A-03)
4. Penanda `sudahDipromosikan` agar usulan tidak dipromosikan dua kali

**Gate E** — LULUS 2026-08-22 (verifikasi browser in-app oleh agent, instruksi Ahmed; siklus dijalankan nyata di aplikasi)
- [x] Siklus penuh terbukti: acara → evaluasi (Konsumsi: baik/kurang/usulan) → promosi → template v2 → acara baru "Khatam Tasmi Berikutnya" memuat item usulan "Sediakan rak tiris tambahan untuk tim pencuci" (34 tugas = 33 + 1)
- [x] Promosi membuat **versi baru** (v2 aktif), versi lama dinonaktifkan tapi utuh — perilaku `templateVersiBaru` teruji di templateService.test; transaksi promosi atomik (template+fase+item+penanda evaluasi)
- [x] Usulan yang sudah dipromosikan tidak bisa dipromosikan lagi — tombol berganti badge "sudah dipromosikan"; service melempar `EvaluasiError`; usulan yang berubah setelah edit boleh dipromosi ulang
- [x] Verifikasi browser: lembar per divisi tersimpan (badge "tersimpan"), divisi tanpa usulan tidak muncul di daftar promosi

## Batch F — Cetak & ekspor · `glm` lo

Branch: `batch-f-cetak`

1. `src/tartib/lib/cetak/lembarTugas.ts` — **satu halaman per PIC**, berisi hanya tugas divisinya
2. `src/tartib/lib/cetak/bukuAcara.ts` — SOP lengkap satu acara, A4
3. `src/tartib/lib/ekspor/markdown.ts` — ekspor Markdown
4. Tombol cetak lewat `host.cetak()` (standalone: `window.print()`)

**Gate F** — LULUS 2026-08-22
- [x] Lembar tugas per PIC tercetak, satu halaman per orang — `break-before-page` + 6 test `susunLembarTugas`; rantai tombol → `host.cetak()` → dialog cetak terbukti end-to-end
- [x] Buku acara A4 rapi, tidak ada teks menembus batas — `@page A4 14mm` + 7 test `susunBukuAcara`; pemisahan halaman & media print terverifikasi lewat test, bukan emulasi browser
- [x] Ekspor Markdown dapat dibuka ulang — berkas `.md` terunduh nyata ke disk, dibuka ulang & isinya diverifikasi
- [x] **Ahmed mencetak fisik dan menyatakan lulus** — retry cetak setelah driver EPSON terpasang: dialog cetak terbuka dari "Cetak Lembar Tugas (per PIC)" (terverifikasi via CGWindowList, jendela Print Center 900×450), job CUPS `EPSON_L365_Series-1` selesai 2026-08-22 08:10:53 (`lpstat -W completed`), lalu Ahmed menyatakan lanjut

## Batch G — Integrasi v3 · `clo` xhigh ▲

Branch: di **repo v3**, bukan di repo tartib.

> **BATAL — 2026-08-22, keputusan final pisahkan (K-15).** Tartib dan mahadapp dipisahkan; integrasi **tidak dikerjakan** (bukan lagi ditunda). Penggantinya: info/link di mahadapp menunjuk ke aplikasi Tartib — **dikerjakan 2026-08-22**: entri "SOP Acara" di Studio Print (v3 `f88dfe2`, wip) membuka https://ugi577.github.io/tartib/ via `window.open(..., "_blank")` — **menunggu uji manual di device**. Cabang `batch-g-integrasi-v3` (berisi G-1 `ea10ea6` & G-3 `4c204af`) **DIHAPUS** 2026-08-22 atas perintah pemilik — komit bisa dipulihkan via reflog (±90 hari), skema DB v3 tetap v37. G-2, G-4, G-5, dan Gate G **tidak akan dikerjakan**.

1. Salin `src/tartib/` ke v3
2. `mahadHost.ts` — implementasi `TartibHost` terhadap Dexie & tabel v3
3. Naikkan versi skema Dexie v3 + migrasi (hanya **menambah** tabel `tartib_*`)
4. Titik masuk menu, routing `?m=tartib`
5. `cetak` disambungkan ke Studio Print

**Gate G**
- [ ] Modul berjalan di dalam v3
- [ ] **Tidak ada satu pun tabel v3 yang berubah** — diperiksa dengan diff skema
- [ ] Migrasi naik-turun aman; data lama utuh
- [ ] `tsc` + `vitest` v3 hijau
- [ ] Uji APK di perangkat fisik
- [ ] Verifikasi manual Ahmed

---

## Batch U — Perbaikan & percantikan UI · `clo` high

Branch: `batch-u-ui`. Rencana rinci: `docs/PLAN-UI.md`.

> Dua temuan baseline masuk kategori **RUSAK (bug)**, bukan percantikan — dikerjakan lebih dulu:
> **BUG-U1** aplikasi tidak terbaca di perangkat mode gelap (`body` tanpa warna latar & tanpa `color-scheme`, teks `slate-700/800` di atas kanvas hitam bawaan browser);
> **BUG-U2** di lebar ponsel, tab `Evaluasi` & `Tentang` melewati batas kontainer (nav `flex` tanpa wrap/scroll → tautan berakhir di x=545 pada kontainer selebar 359) sehingga dua view praktis tidak terjangkau, dan baris judul view menumpuk tombol aksinya (`justify-between` tanpa `flex-wrap`).

1. **U-1 Bug tampilan dasar** — `globals.css` (latar & warna teks `body`, `color-scheme`, gaya `:focus-visible`) + `page.tsx` (nav bisa wrap/scroll, judul view tidak menumpuk tombol)
2. **U-2 Token desain** — `tailwind.config.ts`: alias semantik (`aksen`, `permukaan`, `garis`), bayangan kartu, radius baku — supaya branding kelak = satu berkas
3. **U-3 Komponen bersama** — `src/tartib/ui/kelas.ts`: satu sumber kelas tombol (utama/sekunder/halus/bahaya/ikon), input, label, kartu, kondisi kosong, badge + satu pola status (`StatusAcara`/`StatusTugas`/`StatusRsvp`)
4. **U-4 Per view** — beranda (pintu masuk lengkap 5 view), acara (hierarki: aksi utama vs cetak/ekspor), template (redam dinding tombol `Hapus`), tamu, evaluasi
5. **U-5 Regresi cetak** — lembar tugas, buku acara, laporan eksekusi tetap utuh (`@page A4 14mm`, `print:block`/`print:hidden`)
6. **U-6 Regresi fungsional** — `tsc` bersih, `vitest` hijau, `pnpm build` statis sukses

**Gate U**
- [x] BUG-U1 hilang: di `prefers-color-scheme: dark` halaman tetap terang & terbaca — `bodyBg` `rgb(248,250,252)`, `colorScheme` `light` (screenshot 375px mode gelap)
- [x] BUG-U2 hilang: pada 375px keenam tab terjangkau (0 tab keluar batas), tidak ada scroll horizontal di keenam view, judul view tidak lagi tertimpa tombol
- [x] Satu pola tombol, badge, kartu, input dipakai di semua view — grep kelas tombol inline: **0** (di luar hamparan gelap dialog `bg-slate-900/50`)
- [x] Status (`BELUM/JALAN/SELESAI/BATAL`, `DRAF/SIAP/BERJALAN/SELESAI/DIEVALUASI`, RSVP) memakai satu helper bersama — `warnaStatus*` lokal tersisa: **0**; dikunci 7 test
- [x] Hasil cetak tidak berubah — penanda cetak identik sebelum/sesudah, `@page{size:A4;margin:14mm}` ada di CSS hasil build, satu-satunya perubahan di blok cetak bernilai warna identik
- [x] Teknis: `tsc` bersih, `vitest` 128/128 (17 berkas), `pnpm build` statis sukses
- [ ] **Verifikasi manual Ahmed** di perangkat (terang & gelap, ponsel & layar lebar, plus satu cetakan uji) — Gate ditutup hanya oleh pernyataan eksplisitnya

---

## Changelog PLAN

- **2026-08-22 — v1.13** — **Batch U selesai diimplementasi** (branch `batch-u-ui`, 5 commit): `309e12e` docs (K-16), `f8403a0` fix dua bug tampilan, `72fa1be` token desain + `src/tartib/ui/kelas.ts` + 7 test, `c510eaa` 88 kelas inline diganti token di enam komponen, `b7f5a9a` hierarki per view. Yang berubah bagi pengguna: aplikasi terbaca di perangkat mode gelap; keenam tab terjangkau di ponsel; beranda punya lima pintu masuk (Evaluasi & Tentang sebelumnya hanya lewat tab); satu gaya tombol dengan aksi utama tunggal per kartu; status tugas kini badge seperti status acara; tombol cetak/ekspor dikelompokkan sebagai panel "Cetak & ekspor"; editor template tidak lagi didominasi 33 tombol "Hapus" merah. Gate U teknis **lulus** (tsc bersih, vitest 128/128, build statis, penanda cetak identik). **Tersisa verifikasi manual Ahmed** — Gate U belum ditutup, belum di-merge ke `master`, belum disinkronkan ke repo publik. Catatan operasional: `pnpm build` dan `next dev` berebut direktori `.next` (chunk dev jadi 404) — jalankan build saat dev berhenti, atau restart dev setelah build.

- **2026-08-22 — v1.12** — **Batch U (UI) disetujui & dimulai** (branch `batch-u-ui`). Koreksi rencana sebelum eksekusi (K-16): PLAN-UI v1 menyebut skill MCP `browser-use:control-browser`/`web-gui-tester` yang **tidak tersedia** di sesi agen ini — diganti Browser pane bawaan (`preview_start`, `navigate`, `read_page`, `computer` untuk klik/ketik/screenshot, `resize_window` untuk lebar ponsel & mode gelap, `javascript_tool` untuk membaca computed style). Audit baseline berjalan di `localhost:3000` dengan data nyata (seed template contoh + acara "Khatam Tasmi Angkatan 12", 33 tugas) dan menemukan **dua bug**, bukan sekadar soal rasa: **BUG-U1** aplikasi tidak terbaca di mode gelap, **BUG-U2** dua tab hilang & judul menumpuk tombol di lebar 375px. Keduanya masuk U-1 dan dikerjakan sebelum percantikan. Batch U + Gate U ditambahkan ke PLAN ini.

- **2026-08-22 — v1.11** — **Pelaksanaan K-15 (sesi 9, perintah Ahmed: repo baru, link, bersihkan, rencana UI)**. (1) **Repo publik `ugi577/tartib`** dibuat (publik) + GitHub Pages aktif: https://ugi577.github.io/tartib/ (HTTP 200) — workflow deploy (checkout → pnpm 11 → node 22 → `pnpm install --frozen-lockfile` → `pnpm build` dengan `NEXT_PUBLIC_BASE_PATH=/tartib` → deploy-pages; `fix(ci)` node 22 karena pnpm 11.22 butuh Node ≥ 22.13); konten publik = snapshot bersih 59 file (README, workflow, `src/`, test) **tanpa `docs/` internal**. (2) **Link pengganti integrasi dikerjakan**: entri "SOP Acara" di Studio Print v3 membuka URL publik (`f88dfe2`, wip) — menunggu uji manual device. (3) **Cabang `batch-g-integrasi-v3` DIHAPUS** (G-1/G-3 pulih via reflog ±90 hari). (4) **`docs/PLAN-UI.md` ditulis** — rencana perbaikan/percantikan UI pakai MCP & tool lain (browser-use `control-browser`/`web-gui-tester`, audit per-view, verifikasi bersama Ahmed) — **menunggu persetujuan eksekusi**. Alur sinkron repo publik berikutnya belum diputuskan.

- **2026-08-22 — v1.10** — **Keputusan final: pisahkan (K-15)** — Batch G integrasi v3 **batal** (bukan lagi ditunda). Ahmed: *"sy putuskan pisahkan, cukup nnt ditambahkan di mahadapp info ke app tartib ini, misal dalam studio print sop acara linknya ke app ini"* — latar: kedua aplikasi direncanakan fork dengan nama lain untuk rilis publik. Pengganti integrasi: info/link di mahadapp menunjuk ke Tartib (contoh: Studio Print, entri SOP acara) — belum diimplementasikan, tercatat di backlog PLAN v3; detail (URL publik Tartib, penempatan, waktu) menunggu keputusan. Komit G-1/G-3 tetap inert di cabang `batch-g-integrasi-v3` (tidak di-push; bisa dihapus kapan saja, komit bisa dipulihkan via reflog).

- **2026-08-22 — v1.9** — **Batch G DITUNDA menunggu konfirmasi integrasi (K-14)**: Tartib berdiri sendiri — Ahmed menyatakan *"app ini saya buat berdiri sendiri, opsi integrasi tunggu konfirmasi"* (keputusan 2026-08-22). Di repo v3 (cabang `batch-g-integrasi-v3`, tidak di-push): `ea10ea6` G-1 salin `src/tartib/` dan `4c204af` G-3 skema v38 (hanya menambah tabel `tartib_*`) + backup VERSI 6 tetap **inert** dan dibiarkan apa adanya (pilihan Ahmed dari opsi simpan/revert/revert+hapus). G-2 (`mahadHost.ts`), G-4 (menu/rute `?m=tartib`), G-5 (cetak Studio Print) dan Gate G ditangguhkan sampai konfirmasi eksplisit.

- **2026-08-22 — v1.8** — **Gate F ditutup**: Ahmed mencetak fisik dari dialog cetak aplikasi setelah driver printer EPSON terpasang (job CUPS `EPSON_L365_Series-1` selesai 08:10:53, `lpstat -W completed`) dan menyatakan lanjut. Catatan retry: klik "Cetak Lembar Tugas (per PIC)" → `host.cetak()` → dialog cetak macOS terbuka (terverifikasi via CGWindowList — jendela Print Center 900×450 di layar; kali ini webview tidak terblokir seperti sesi verifikasi sebelumnya). **Batch G (integrasi v3) dimulai** di repo `mahad-askar-app-v3`.

- **2026-08-22 — v1.7** — Batch F selesai (branch `batch-f-cetak`, 4 commit `feat(tartib)`): `lib/cetak/lembarTugas.ts` — satu halaman per PIC (`break-before-page`), berisi hanya tugas divisinya (6 test); `lib/cetak/bukuAcara.ts` — SOP lengkap satu acara untuk A4: kop, fase dengan tanggal nyata, tugas per divisi (7 test); `lib/ekspor/markdown.ts` — buku acara → berkas `.md` yang dapat dibuka ulang (7 test); tombol cetak di `AcaraView` via `host.cetak()` (state `cetakAktif` + `flushSync` sebelum print; payload `lembarTugas`/`bukuAcara`, `picNama` kosong = semua lembar) + `@page { size: A4; margin: 14mm }`. Gate F teknis: tsc bersih, vitest 121/121 (16 file), build statis OK. Verifikasi browser: rantai tombol → cetak → dialog sistem terbukti end-to-end; ekspor Markdown terunduh nyata (`SOP-Khatam-Tasmi-Berikutnya.md`) dan isinya diverifikasi (kop, 4 fase, tugas per divisi, penanda wajib & status). Tersisa **verifikasi fisik Ahmed**: mencetak lembar tugas & buku acara dan menyatakan lulus.

- **2026-08-22 — v1.6** — Batch E selesai (branch `batch-e-evaluasi`, 2 commit `feat(tartib)`): `evaluasiService` (input evaluasi per divisi: berjalan baik / kurang / usulan, `promosikanUsulan` membuat versi template baru berisi item dari usulan dengan transaksi atomik, penanda `sudahDipromosikan`, `EvaluasiError`) + 7 test; halaman `?view=evaluasi` (lembar per divisi, daftar usulan siap promosi, badge "tersimpan"/"sudah dipromosikan"). Gate E **LULUS 2026-08-22** lewat verifikasi browser in-app: siklus penuh acara → evaluasi → promosi → template v2 → acara baru memuat item hasil promosi (34 tugas), usulan terkunci setelah dipromosikan. tsc bersih, vitest 101/101 (13 file), build statis OK.

- **2026-08-22 — v1.5** — Amandemen riset pasar (K-13): Batch T `batch-t-ikhtisar-tentang` ditambahkan & langsung selesai (4 commit `feat(tartib)`): `lib/ikhtisar.ts` murni + 14 test, progres eksekusi di papan acara (persen keseluruhan, fase hari-ini/berikutnya, per fase & per divisi), cetak Laporan Eksekusi (payload `ikhtisarEksekusi`, kop khusus print, kontrol `print:hidden`), halaman `?view=tentang` (posisi produk). PRD diamandemen (§8). Gate T teknis lulus (tsc, 94/94, build statis); tersisa verifikasi manual Ahmed. Batch D juga di-fix saat verifikasi UI (seed di titik masuk, skema v3 + pemetaan tabel, transaksi idempoten).

- **2026-08-22 — v1.4** — Batch D selesai diimplementasi (branch `batch-d-tamu-porsi`, 5 commit `feat(tartib)` + 1 `fix(tartib)`). Yang dibangun: `tamuService` (kelompok tamu CRUD, RSVP dengan jumlah rombongan, `hitungRekapKelompok`/`rekapKelompok`), `perlengkapanService` (`generatePerlengkapan` dari `rumusQty` tugas — bukan templateItem, A-02 tetap terjaga; qtyFinal manual bertahan saat regenerate), halaman `?view=tamu` (kelompok & RSVP, kalkulator porsi dengan komponen perhitungan + toggle tim pencuci, ceklis perlengkapan). Keputusan baru: K-12 (`rumusQty` ikut disnapshot ke tugas). Tiga bug ditemukan & diperbaiki saat verifikasi UI langsung di browser (pra-ada, bukan regresi Batch D): (1) properti tabel Dexie (`tartibDb.divisi` dst.) selalu `undefined` di runtime karena nama field class tidak cocok dengan key `stores()` berprefix `tartib_` — Dexie butuh pemetaan eksplisit `this.divisi = this.table('tartib_divisi')`; (2) `seedTemplateContoh` query `where('nama')` pada `tartib_jenisAcara` tanpa index nama (skema v3 menambahkannya); (3) `jalankanSeed()` tidak pernah dipanggil dari aplikasi (ditambahkan di `page.tsx`, dibungkus transaksi per fungsi agar idempoten walau React StrictMode memanggil efek dua kali). Setelah ketiga fix, seluruh alur emas Batch A–D diverifikasi langsung di browser: buat acara dari template, papan tugas, PIC, RSVP rombongan, porsi persis fixture 240/144/264, toggle tim pencuci, override qty manual bertahan. Gate D teknis: tsc bersih, vitest 80/80 (11 file), build statis sukses, grep bebas `window.confirm`/`as any`/impor `next/*` di `src/tartib`, `templateItem` tetap hanya di schema/seed/templateService. Tersisa verifikasi manual Ahmed di perangkat fisik.
- **2026-08-22 — v1.3** — Batch C selesai diimplementasi (branch `batch-c-acara-pic`, 6 commit `feat(tartib)` + 1 docs). Yang dibangun: `acaraService.buatDariTemplate()` snapshot sekali (K-03/A-02: item → `tartib_tugas`, fase → salinan `tartib_fase` milik acara K-11), `setStatus` menegakkan A-01 (`PicBelumLengkapError`), `tugasService` (status cycling + `selesaiPada`), `acaraDivisiService` (PIC), `lib/tanggal.ts` (geserTanggal/format Indonesia/H-offset, kalender lokal), halaman `?view=acara` penuh (daftar + buat dari template + papan tugas per fase dengan tanggal nyata + PIC + indikator kesiapan). Gate C teknis: tsc bersih, vitest 70/70 (9 file), build statis sukses, audit A-02 (`templateItem` hanya di schema/seed/templateService), bebas `window.confirm`/`as any`/impor `next/*` di `src/tartib`. Tersisa verifikasi manual Ahmed di perangkat fisik.
- **2026-08-22 — v1.2** — Batch B selesai diimplementasi (branch `batch-b-template-crud`, 5 commit `feat(tartib)`). Yang dibangun: `templateService` (buat/duplikat/versiBaru/arsip + editor fase & item), `divisiService`, skema Dexie v2 (index `dibuatPada`), `usePagedList` lokal, `AppDialog`/`FormDialog`/`KonfirmasiDialog` (nol `window.confirm`), halaman `?view=template` + shell routing `?view=` di `src/app`. Keputusan baru: K-11 (fase ikut disnapshot ke acara). Gate B teknis: tsc bersih, vitest 39/39, build statis sukses, audit bebas `window.confirm` & impor `next/*` di `src/tartib`. Tersisa verifikasi manual Ahmed di perangkat fisik.
- **2026-08-22 — v1.1** — Batch A selesai diimplementasi (branch `batch-a-fondasi-skema`, 6 sub-langkah, 7 commit `feat(tartib)`). Gate A: tsc bersih (nol `as any`), vitest 30/30 hijau, seed 13 divisi + 8 jenis + template contoh teruji lewat data murni, fixture porsi 240/144/264 lulus, parser rumus menolak eval/fungsi asing, impor luar `src/tartib/` hanya `dexie` (+ `vitest` di file test). Tersisa verifikasi Ahmed: seed tertulis ke IndexedDB via `pnpm dev` + tutup Gate A.
- **2026-08-22 — v1.0** — disusun dari BRIEF Bagian 7 (Sesi 0). Batch A–G, konvensi commit, protokol blocker.
