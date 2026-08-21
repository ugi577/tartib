# PLAN — Tartib

Cara eksekusi proyek, batch demi batch. Sumber: `docs/BRIEF.md` Bagian 7.

- Tiap batch: **branch sendiri**, commit kecil per sub-langkah.
- Gate ditutup hanya dengan pernyataan eksplisit Ahmed untuk butir verifikasi manual.
- Routing model: Batch A & C (`clo` high), E & G (`clo` high/xhigh) — di situ aturan yang tidak boleh salah. Batch B, D, F boleh `glm`/`cc-deep` effort lo.

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

**Gate D**
- [ ] RSVP mencatat rombongan; rekap kelompok benar
- [ ] Porsi terhitung sesuai fixture 21 Agustus (240)
- [ ] Peralatan berubah saat opsi tim pencuci ditoggle (144 ↔ 264)
- [ ] Qty perlengkapan boleh ditimpa manual (`qtyFinal`), asalnya (`qtyHitung`) tetap tersimpan

## Batch T — Ikhtisar eksekusi & Tentang (amandemen riset pasar 2026-08-22) · `glm` lo

Branch: `batch-t-ikhtisar-tentang` — ditambahkan dari riset lanskap Ahmed (K-13): celah terbesar
adalah jembatan dokumen SOP ↔ eksekusi real-time untuk acara kecil–menengah. Batch F (cetak
lembar tugas/buku acara) tidak terpengaruh; Batch T fokus lapisan ikhtisar + posisi produk.

1. `src/tartib/lib/ikhtisar.ts` — fungsi murni: `ikhtisarTugas` (persen selesai, BATAL dikecualikan dari penyebut), `ikhtisarPerDivisi`, `statusWaktuFase` (LALU/HARI_INI/MENDATANG), `faseHariIni`, `faseBerikutnya`
2. Papan acara — progres keseluruhan (bar + persen), badge Hari ini/Mendatang per fase, x/y selesai per fase, progres per divisi di baris PIC
3. Cetak Laporan Eksekusi — payload `ikhtisarEksekusi` di `TartibHost.cetak`; kop laporan khusus print; kontrol interaktif `print:hidden`
4. Halaman `?view=tentang` — posisi produk: peta lanskap (pembuat dokumen vs eksekusi acara), celah yang diisi, dan yang disengaja backlog (notifikasi/ERP — K-09)

**Gate T**
- [x] Teknis: tsc bersih, vitest 94/94 (12 file), `pnpm build` statis sukses
- [x] Progres & waktu fase dihitung fungsi murni yang teruji (14 test ikhtisar)
- [ ] Verifikasi manual Ahmed: papan progres, badge fase, cetak laporan eksekusi di printer fisik

## Batch E — Evaluasi & umpan balik · `clo` high ▲

Branch: `batch-e-evaluasi`

1. `src/tartib/services/evaluasiService.ts` — `simpanEvaluasi()`, `daftarEvaluasi()`
2. Halaman `?view=evaluasi` — per divisi: berjalan baik / kurang / usulan
3. **`promosikanUsulan(evaluasiId, templateId)`** — membuat versi template baru berisi item tambahan dari usulan (A-03)
4. Penanda `sudahDipromosikan` agar usulan tidak dipromosikan dua kali

**Gate E**
- [ ] Siklus penuh terbukti: acara → evaluasi → promosi → acara baru memuat item hasil promosi
- [ ] Promosi membuat **versi baru**, versi lama utuh — ada test
- [ ] Usulan yang sudah dipromosikan tidak bisa dipromosikan lagi
- [ ] Verifikasi manual Ahmed

## Batch F — Cetak & ekspor · `glm` lo

Branch: `batch-f-cetak`

1. `src/tartib/lib/cetak/lembarTugas.ts` — **satu halaman per PIC**, berisi hanya tugas divisinya
2. `src/tartib/lib/cetak/bukuAcara.ts` — SOP lengkap satu acara, A4
3. `src/tartib/lib/ekspor/markdown.ts` — ekspor Markdown
4. Tombol cetak lewat `host.cetak()` (standalone: `window.print()`)

**Gate F**
- [ ] Lembar tugas per PIC tercetak, satu halaman per orang
- [ ] Buku acara A4 rapi, tidak ada teks menembus batas
- [ ] Ekspor Markdown dapat dibuka ulang
- [ ] **Ahmed mencetak fisik dan menyatakan lulus**

## Batch G — Integrasi v3 · `clo` xhigh ▲

Branch: di **repo v3**, bukan di repo tartib.

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

## Changelog PLAN

- **2026-08-22 — v1.4** — Amandemen riset pasar (K-13): Batch T `batch-t-ikhtisar-tentang` ditambahkan & langsung selesai (4 commit `feat(tartib)`): `lib/ikhtisar.ts` murni + 14 test, progres eksekusi di papan acara (persen keseluruhan, fase hari-ini/berikutnya, per fase & per divisi), cetak Laporan Eksekusi (payload `ikhtisarEksekusi`, kop khusus print, kontrol `print:hidden`), halaman `?view=tentang` (posisi produk). PRD diamandemen (§8). Gate T teknis lulus (tsc, 94/94, build statis); tersisa verifikasi manual Ahmed. Batch D juga di-fix saat verifikasi UI (seed di titik masuk, skema v3 + pemetaan tabel, transaksi idempoten).

- **2026-08-22 — v1.3** — Batch C selesai diimplementasi (branch `batch-c-acara-pic`, 6 commit `feat(tartib)` + 1 docs). Yang dibangun: `acaraService.buatDariTemplate()` snapshot sekali (K-03/A-02: item → `tartib_tugas`, fase → salinan `tartib_fase` milik acara K-11), `setStatus` menegakkan A-01 (`PicBelumLengkapError`), `tugasService` (status cycling + `selesaiPada`), `acaraDivisiService` (PIC), `lib/tanggal.ts` (geserTanggal/format Indonesia/H-offset, kalender lokal), halaman `?view=acara` penuh (daftar + buat dari template + papan tugas per fase dengan tanggal nyata + PIC + indikator kesiapan). Gate C teknis: tsc bersih, vitest 70/70 (9 file), build statis sukses, audit A-02 (`templateItem` hanya di schema/seed/templateService), bebas `window.confirm`/`as any`/impor `next/*` di `src/tartib`. Tersisa verifikasi manual Ahmed di perangkat fisik.
- **2026-08-22 — v1.2** — Batch B selesai diimplementasi (branch `batch-b-template-crud`, 5 commit `feat(tartib)`). Yang dibangun: `templateService` (buat/duplikat/versiBaru/arsip + editor fase & item), `divisiService`, skema Dexie v2 (index `dibuatPada`), `usePagedList` lokal, `AppDialog`/`FormDialog`/`KonfirmasiDialog` (nol `window.confirm`), halaman `?view=template` + shell routing `?view=` di `src/app`. Keputusan baru: K-11 (fase ikut disnapshot ke acara). Gate B teknis: tsc bersih, vitest 39/39, build statis sukses, audit bebas `window.confirm` & impor `next/*` di `src/tartib`. Tersisa verifikasi manual Ahmed di perangkat fisik.
- **2026-08-22 — v1.1** — Batch A selesai diimplementasi (branch `batch-a-fondasi-skema`, 6 sub-langkah, 7 commit `feat(tartib)`). Gate A: tsc bersih (nol `as any`), vitest 30/30 hijau, seed 13 divisi + 8 jenis + template contoh teruji lewat data murni, fixture porsi 240/144/264 lulus, parser rumus menolak eval/fungsi asing, impor luar `src/tartib/` hanya `dexie` (+ `vitest` di file test). Tersisa verifikasi Ahmed: seed tertulis ke IndexedDB via `pnpm dev` + tutup Gate A.
- **2026-08-22 — v1.0** — disusun dari BRIEF Bagian 7 (Sesi 0). Batch A–G, konvensi commit, protokol blocker.
