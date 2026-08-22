# PROJECT-STATE — Tartib

> **Dibaca PERTAMA, diperbarui TERAKHIR** — tanpa kecuali. WIP pun di-commit.

## Posisi

- **Tanggal:** 2026-08-22
- **Sesi:** 7 — **Batch F (cetak & ekspor) selesai**: tsc bersih, vitest 121/121 (16 file), build statis OK, verifikasi browser in-app (rantai tombol → `host.cetak()` → dialog cetak terbukti; ekspor Markdown terunduh nyata ke disk & dibuka ulang); siap merge ke `master`; tersisa **cetak fisik Ahmed** (Gate F item terakhir)
- **Repo:** `/Users/ahmad/Projects/tartib-app`
- **Branch aktif:** `batch-f-cetak` (dari `master` setelah merge E); sebelumnya `batch-e-evaluasi`
- **Bukti verifikasi Batch F (browser in-app):** (1) klik "Cetak Lembar Tugas (per PIC)" membuka dialog cetak sistem — rantai tombol → `cetakJenis` → `flushSync` → `host.cetak` → `window.print` terbukti end-to-end (dialog memblokir webview, tab ditutup); (2) ekspor Markdown mengunduh `SOP-Khatam-Tasmi-Berikutnya.md` (3,8 KB) ke `~/Downloads` — dibuka ulang, isinya diverifikasi: `# SOP ACARA`, kop jenis/tanggal, `## 1. Persiapan H-30 (H-30, 22 Agustus 2026)`, tugas per divisi dengan `_(wajib)_` & status

## Progress

- [x] `docs/BRIEF.md` — brief disalin (409 baris), commit `chore: brief awal Tartib`
- [x] `docs/PRD.md` — spesifikasi otoritatif dari BRIEF Bagian 3–6
- [x] `docs/PLAN.md` — batch A–G, gate checklist, protokol blocker, konvensi commit (changelog v1.1–v1.4)
- [x] `docs/DECISIONS.md` — K-01 s/d K-13 (entry terbaru di atas)
- [x] Scaffold Next.js 14 + TS strict + Dexie + Tailwind + Vitest, static export, tanpa fitur
- [x] Batch A — fondasi & skema (6 sub-langkah, semua commit `feat(tartib)`)
- [x] Batch B — template CRUD (5 commit `feat(tartib)`)
- [x] Batch C — acara, tugas & aturan PIC (6 commit `feat(tartib)` + 1 docs)
- [x] Batch D — tamu, porsi, perlengkapan (4 commit `feat(tartib)` + 1 fix verifikasi UI)
- [x] Batch T — ikhtisar eksekusi & Tentang, amandemen riset pasar K-13 (4 commit `feat(tartib)`)
- [x] Batch E — evaluasi per divisi & promosi usulan → versi template baru (2 commit `feat(tartib)`)
- [x] Batch F — cetak & ekspor: lembar tugas per PIC, buku acara A4, ekspor Markdown (4 commit `feat(tartib)`)

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

## Gate F — status (teknis & browser; fisik menunggu Ahmed)

- [x] Teknis: tsc bersih, vitest 121/121 (16 file), `pnpm build` statis sukses
- [x] Lembar tugas per PIC — isi diuji 6 test `susunLembarTugas` (hanya tugas divisi sendiri, urutan fase & tugas, PIC tanpa kontak, divisi tanpa tugas); satu halaman per orang via `break-before-page`; rantai tombol → `host.cetak()` → dialog cetak sistem terbukti end-to-end di browser
- [x] Buku acara A4 — isi diuji 7 test `susunBukuAcara` (tanggal fase nyata, urutan, pengelompokan divisi); batas kertas diamankan `@page A4 14mm`; media print tidak bisa diemulasi di webview IAB, jadi pemisahan halaman diverifikasi lewat test + CSS statis
- [x] Ekspor Markdown dapat dibuka ulang — unduhan nyata `SOP-Khatam-Tasmi-Berikutnya.md` (3,8 KB) ke `~/Downloads`, dibuka ulang, isi diverifikasi
- [ ] **Ahmed mencetak fisik** lembar tugas & buku acara, lalu menyatakan lulus (Gate F tertutup hanya dengan pernyataan ini)

## Next step (presisi)

Batch F selesai → merge `batch-f-cetak` ke `master` (ff) → **Batch G (integrasi v3)** di repo v3: salin `src/tartib/`, `mahadHost.ts` (implementasi `TartibHost` terhadap Dexie v3), skema v3 + migrasi aditif (hanya menambah tabel `tartib_*`), titik masuk menu & routing `?m=tartib`, `cetak` disambungkan ke Studio Print. Sebelum itu Ahmed mencetak fisik hasil Batch F (lembar tugas per PIC + buku acara A4) untuk menutup Gate F.

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

Tidak ada. Gate A–E, T, dan F (teknis) lulus; Gate F tersisa cetak fisik Ahmed. Dev server berjalan di localhost:3000 (sesi verifikasi); browser in-app menampilkan aplikasi untuk Ahmed melihat langsung.

- Shell sesi: Fish — jangan pakai heredoc; file ditulis lewat file tool.
- Jangan install library di luar BRIEF Bagian 4.
- Seed 13 divisi baku & sumber item template contoh: BRIEF Bagian 8.
- pnpm 11: izin build script lewat `pnpm-workspace.yaml` (`allowBuilds: esbuild: true`), bukan field `pnpm` di package.json (sudah tidak dibaca).
- Dexie aman di-import di lingkungan Node (hanya `open()` yang butuh IndexedDB) — singleton `tartibDb` tidak mengganggu vitest.
