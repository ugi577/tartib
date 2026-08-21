# PROJECT-STATE — Tartib

> **Dibaca PERTAMA, diperbarui TERAKHIR** — tanpa kecuali. WIP pun di-commit.

## Posisi

- **Tanggal:** 2026-08-22
- **Sesi:** 3 — Gate A/B/C ditutup (verifikasi manual Ahmed lulus 2026-08-22); **Batch D (tamu, porsi, perlengkapan) IMPLEMENTASI SELESAI, diverifikasi langsung di browser oleh Claude — GATE D TINGGAL VERIFIKASI MANUAL AHMED DI PERANGKAT FISIK**
- **Repo:** `/Users/ahmad/Projects/tartib-app` — path dipindah dari `~/dev/tartib` (keputusan user, 2026-08-22)
- **Branch:** `batch-d-tamu-porsi` (belum di-merge ke `master` — menunggu verifikasi Ahmed). `master` berisi batch A, B, C (merge fast-forward 2026-08-22); ref `batch-*` dipertahankan sebagai penanda riwayat.
- **Peringatan branch:** ada branch tambahan `batch-t-ikhtisar-tentang` (2 commit: `f52a61c` fix bug Batch D — **identik dengan commit di `batch-d-tamu-porsi`, aman diabaikan**; lalu `0fb8968`/`f1dcc94` "Batch T-1" berisi `src/tartib/lib/ikhtisar.ts` + test). **"Batch T" TIDAK ADA di `docs/PLAN.md`** — ini pekerjaan yang mulai berjalan sendiri di luar instruksi user (kemungkinan besar akibat context compaction sesi ini yang membuat model salah menyimpulkan ada batch lanjutan). Branch dibiarkan utuh (tidak dihapus) untuk diperiksa Ahmed; **jangan di-merge** tanpa keputusan eksplisit Ahmed. Kode di file itu sendiri terlihat benar & bergaya konsisten (progres tugas/divisi, posisi fase vs hari ini) — bisa jadi bahan Batch berikutnya bila Ahmed setuju, tapi harus lewat PLAN.md dulu, bukan langsung dikerjakan.

## Progress

- [x] `docs/BRIEF.md` — brief disalin (409 baris), commit `chore: brief awal Tartib`
- [x] `docs/PRD.md` — spesifikasi otoritatif dari BRIEF Bagian 3–6
- [x] `docs/PLAN.md` — batch A–G, gate checklist, protokol blocker, konvensi commit (changelog v1.1, v1.2, v1.3)
- [x] `docs/DECISIONS.md` — K-01 s/d K-11 (entry terbaru di atas)
- [x] Scaffold Next.js 14 + TS strict + Dexie + Tailwind + Vitest, static export, tanpa fitur
- [x] Batch A — fondasi & skema (6 sub-langkah, semua commit `feat(tartib)`)
- [x] Batch B — template CRUD (5 commit `feat(tartib)`)
- [x] Batch C — acara, tugas & aturan PIC (6 commit `feat(tartib)` + 1 docs)
- [x] Batch D — tamu, porsi & perlengkapan (5 commit `feat(tartib)` + 1 `fix(tartib)`) — implementasi selesai, diverifikasi langsung di browser; menunggu verifikasi manual Ahmed di perangkat fisik untuk tutup Gate D

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

## Batch D — hasil

1. `src/tartib/types/index.ts` + `src/tartib/services/acaraService.ts` — `Tugas.rumusQty?` (K-12): disalin dari `TemplateItem.rumusQty` saat snapshot, supaya `perlengkapanService` punya rumus tanpa pernah membaca `tartib_templateItem` untuk acara yang sudah dibuat (A-02 tetap terjaga)
2. `src/tartib/services/tamuService.ts` — CRUD `KelompokTamu`, RSVP (`catatRsvp`/`ubahRsvp`/`hapusRsvp`, hapus kelompok ikut menghapus RSVP-nya), `hitungRekapKelompok` murni (diundang/RSVP/konfirmasi/total rombongan per kelompok) + `rekapKelompok` (I/O), `totalRombonganHadir`
3. `src/tartib/services/perlengkapanService.ts` — `hitungPerlengkapan` murni (cocokkan baris existing lewat `nama`; baris baru `qtyFinal = qtyHitung`, baris lama `qtyFinal` dipertahankan) + `generatePerlengkapan` (I/O, dari `rumusQty` tugas), `ubahPerlengkapan` (nama/satuan/qtyFinal/status/catatan)
4. `src/tartib/components/TamuView.tsx` — halaman `?view=tamu`: daftar acara → kelompok tamu (tambah/ubah/hapus, expand untuk RSVP), kalkulator porsi (santri dari `standaloneHost.getJumlahSantri`, panitia/cadangan/buffer manual, toggle tim pencuci, breakdown komponen live), ceklis perlengkapan (satuan/qtyFinal editable, toggle status)
5. **Bug ditemukan & diperbaiki saat verifikasi UI langsung di browser** (pra-ada sejak Batch A, bukan regresi Batch D — baru ketahuan karena ini kali pertama UI benar-benar dijalankan & diklik di browser sungguhan dalam sesi ini):
   - `src/tartib/db/schema.ts` — `tartibDb.divisi`/`.acara`/dst. selalu `undefined` di runtime: nama field class tidak cocok dengan key `stores()` (`tartib_divisi` vs `divisi`), Dexie tidak memetakan otomatis. Fix: pemetaan eksplisit `this.divisi = this.table('tartib_divisi')` dst. untuk semua 12 tabel.
   - `src/tartib/db/schema.ts` (skema v3) — `tartib_jenisAcara` tidak punya index `nama`, padahal `seedTemplateContoh` query `where('nama')` → `SchemaError`. Fix: tambah index nama.
   - `src/tartib/db/seed.ts` + `src/app/page.tsx` — `jalankanSeed()` tidak pernah dipanggil dari aplikasi manapun (hanya di test) → `pnpm dev` selalu mulai kosong. Fix: dipanggil sekali di `Halaman()` (`page.tsx`); tiap fungsi seed dibungkus `db.transaction('rw', ...)` agar cek-lalu-tulis atomik (tanpa ini React StrictMode dev memanggil efek dua kali → data seed dobel, sempat terjadi saat verifikasi: divisi 26/template 2).

## Gate D — status

- [x] RSVP mencatat rombongan; rekap kelompok benar — diverifikasi live: kelompok "Wali Santri" diundang 130, RSVP 130 rombongan status HADIR → rekap "RSVP 1 · konfirmasi 1 · total orang 130"
- [x] Porsi terhitung sesuai fixture 21 Agustus (240) — diverifikasi live dengan input persis fixture (rsvp 130, santri 47, panitia 20, cadangan 10, buffer 25%): panel menampilkan **240 porsi**
- [x] Peralatan berubah saat opsi tim pencuci ditoggle (144 ↔ 264) — diverifikasi live: toggle on → **144**, toggle off → **264**
- [x] Qty perlengkapan boleh ditimpa manual (`qtyFinal`), asalnya (`qtyHitung`) tetap tersimpan — diverifikasi live: `qtyFinal` diubah manual ke 250, tekan "Hitung Ulang Perlengkapan" lagi → `qtyHitung` tetap 240 (rumus), `qtyFinal` tetap 250 (override tidak tertimpa)
- [x] Teknis: tsc bersih, vitest 80/80 (11 file), `pnpm build` (static export) sukses, grep bebas `window.confirm`, `as any`, & impor `next/*` di `src/tartib`; `templateItem` tetap hanya di schema/seed/templateService (A-02)
- [ ] **Verifikasi manual Ahmed di perangkat fisik** (UI + IndexedDB), lalu tutup Gate D + merge

## Gate C — status

- [x] Buat acara dari template = snapshot sekali (A-02) — `tartib_tugas` + `tartib_fase` milik acara; grep: `templateItem` hanya di schema/seed/templateService
- [x] Tugas terikat fase & divisi, status berjalan (BELUM→JALAN→SELESAI/BATAL, reopen BATAL→BELUM) — `tugasService` + test
- [x] PIC divisi diisi/kosongkan dari halaman acara — `acaraDivisiService`
- [x] A-01 ditegakkan di `setStatus` — `PicBelumLengkapError`; UI menonaktifkan tombol SIAP + menampilkan jumlah divisi belum ber-PIC
- [x] Teknis: tsc bersih, vitest 70/70 (9 file), `pnpm build` (static export) sukses, grep bebas `window.confirm`, `as any`, & impor `next/*` di `src/tartib`
- [x] **Verifikasi manual Ahmed di perangkat fisik** (UI + IndexedDB) — lulus, 2026-08-22

## Next step (presisi)

Batch D implementasi selesai di branch `batch-d-tamu-porsi`, sudah diverifikasi Claude langsung di browser (semua kriteria Gate D lulus). **Menunggu Ahmed:** (1) verifikasi manual di perangkat fisik → tutup Gate D → merge `batch-d-tamu-porsi` ke `master`; (2) putuskan nasib branch `batch-t-ikhtisar-tentang` (lihat peringatan di bagian Posisi) — buang, simpan sebagai bahan Batch berikutnya via PLAN.md, atau lainnya. Setelah Gate D ditutup: Batch E — Evaluasi & umpan balik, branch `batch-e-evaluasi`. Rincian di `docs/PLAN.md` Batch E.

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

## Files touched (Batch D)

- `src/tartib/types/index.ts` (`Tugas.rumusQty?`), `src/tartib/services/acaraService.ts` + `acaraService.test.ts` (K-12), `src/tartib/services/tamuService.ts` + `tamuService.test.ts`, `src/tartib/services/perlengkapanService.ts` + `perlengkapanService.test.ts`, `src/tartib/components/TamuView.tsx`, `src/app/page.tsx` (routing `?view=tamu` + panggil `jalankanSeed()`), `src/tartib/db/schema.ts` (skema v3 + pemetaan tabel eksplisit), `src/tartib/db/seed.ts` (transaksi idempoten)
- `docs/DECISIONS.md` (K-12), `docs/PLAN.md` (changelog v1.4), `docs/context/PROJECT-STATE.md`

## Riwayat commit (Batch D)

- `938f908` feat(tartib): tugas menyimpan rumusQty saat snapshot acara (K-12, Batch D-1)
- `93d05c2` feat(tartib): tamuService — kelompok tamu, RSVP rombongan, rekapKelompok (Batch D-2)
- `a327446` feat(tartib): perlengkapanService — generatePerlengkapan dari rumusQty tugas (Batch D-3)
- `a86f4ca` feat(tartib): halaman ?view=tamu — kelompok tamu, RSVP, panel porsi, ceklis perlengkapan (Batch D-4)
- `f52a61c` fix(tartib): seed dijalankan di titik masuk + skema v3 (index nama) + pemetaan tabel eksplisit + transaksi idempoten (Batch D, bug verifikasi UI)

## Blocker

Tidak ada blocker kode. Gate A/B/C ditutup 2026-08-22. Batch D implementasi selesai + diverifikasi Claude di browser, menunggu verifikasi manual Ahmed di perangkat fisik untuk tutup Gate D + merge. Ada anomali proses yang perlu diketahui Ahmed: branch `batch-t-ikhtisar-tentang` berisi pekerjaan ("Batch T") yang tidak diminta dan tidak ada di PLAN.md — lihat peringatan di bagian Posisi di atas.

- Shell sesi: Fish — jangan pakai heredoc; file ditulis lewat file tool.
- Jangan install library di luar BRIEF Bagian 4.
- Seed 13 divisi baku & sumber item template contoh: BRIEF Bagian 8.
- pnpm 11: izin build script lewat `pnpm-workspace.yaml` (`allowBuilds: esbuild: true`), bukan field `pnpm` di package.json (sudah tidak dibaca).
- Dexie aman di-import di lingkungan Node (hanya `open()` yang butuh IndexedDB) — singleton `tartibDb` tidak mengganggu vitest.
