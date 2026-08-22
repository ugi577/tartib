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
- [x] **Verifikasi manual Ahmed** — **Gate U DITUTUP 2026-08-22** atas perintah eksplisit Ahmed: *"merge semua ke master"* (sesi 11; lihat changelog v1.15). Audit browser sesi 11 menambah dua perbaikan sebelum merge: `ed64c9c` (dua string literal `${KELAS.kartuIsi}` — kartu di daftar acara Tamu & panel promosi Evaluasi tampil polos) dan `7bd9331` (badge Aktif/Diarsipkan → token KELAS)

---

## Batch V — Impor SOP dari dokumen (.docx) · `clo` high

Branch: `master` (langsung, pasca Gate U). Arahan Ahmed (2026-08-22): *"pada evaluasi, siapkan fungsi import, yg bisa dibaca/duplikasi dan modifikasi. contoh sop acara mahad ini"* — dengan berkas **`SOP ACARA - Mahad Askar Quran.docx`** sebagai contoh nyata. Hasil impor adalah **template biasa** — otomatis bisa dibaca (daftar/editor), diduplikasi (Duplikat), dan dimodifikasi (editor fase/item) seperti template lain.

Kendala teknis: **tanpa library baru** (BRIEF Bagian 4) → ZIP dibaca manual (EOCD + central directory + inflate `deflate-raw` via `DecompressionStream`), XML diparse dengan parser non-validating sendiri, keduanya murni & teruji.

1. **V-1 Parser** — `src/tartib/lib/impor/`: `zip.ts` (`bacaZip`), `xml.ts` (`parseXmlLite`), `dokumenSop.ts` (`dokumenXmlKeSop` + `tebakDivisi` + `offsetDariLabel` + `labelFaseBersih`) — 15 test. Pemetaan berdasarkan struktur nyata dokumen contoh: fase = paragraf tebal berawalan H-offset (H-30…Hari-H…H+1), item = paragraf ☐, `BAGIAN n —` memutus fase aktif (item di luar linimasa — mis. ceklis perlengkapan — diabaikan & dihitung), sub-judul/prosa diabaikan; divisi item = tebakan kata kunci (fallback Ketua Panitia).
2. **V-2 Service** — `templateService.bangunStrukturImpor` (murni, 3 test: urutan/keterhubungan, tolak divisi tak dikenal, tolak judul kosong & rumusQty tak sah) + `imporTemplate` (satu transaksi Dexie: gagal satu item = tidak ada yang tersimpan).
3. **V-3 UI** — panel "Impor SOP dari Dokumen (.docx)" di daftar `?view=evaluasi`: pilih berkas → parse → dialog pratinjau (fase + offset + jumlah item, nama template & jenis acara bisa diubah, catatan item di luar linimasa) → Simpan sebagai Template → pesan ringkas (fase/item, divisi tebakan vs fallback) + arahan buka tab Template.

**Gate V**
- [x] Pipeline terbukti pada **dokumen asli** (`SOP ACARA - Mahad Askar Quran.docx`, verifikasi end-to-end Node): judul `BUKU PANDUAN SOP ACARA`, sub-judul `Ma'had Askar Qur'an`, **9 fase** (H-30, H-21, H-14, H-10, H-7, H-3, H-1, Hari-H, H+1) — **57 item** (43 divisi ditebak, 14 fallback Ketua Panitia), 84 item luar linimasa diabaikan & dilaporkan
- [x] Tanpa library baru — hanya API platform (`DecompressionStream`, `TextDecoder`, `Blob`)
- [x] Simpan atomik — `imporTemplate` satu transaksi; template hasil impor langsung terbaca di tab Template (bisa dibaca/duplikat/modifikasi)
- [x] Teknis: `tsc` bersih, `vitest` 146/146 (20 berkas), `pnpm build` statis sukses, nol overflow di 375px (panel impor)
- [ ] **Verifikasi manual Ahmed** — pilih berkas .docx nyata di browser (upload file tidak bisa diuji lewat browser otomatis), periksa pratinjau & hasil di tab Template

---

## Batch W — Impor SOP pindah ke tab Template + Ekspor Template (.docx lokal & Google Drive) · `clo` high

Branch: `master` (langsung, pasca Batch V). Arahan Ahmed (2026-08-22): *"salah posisi, mestinya fungsi import ini di tab template, berikan juga fungsi export, local dn gdrive"* — K-18 **membatalkan K-17 poin 1**: titik masuk impor SOP dipindah dari tab Evaluasi ke daftar tab Template, dan ditambah fungsi **ekspor** dengan dua target: **lokal** (unduh `.docx`) dan **Google Drive**.

Kendala teknis: tetap **tanpa library baru** (BRIEF Bagian 4) → penulis ZIP manual (local header + central directory + EOCD, deflate via `CompressionStream('deflate-raw')`, CRC32 tabel), penulis DOCX minimal 3-entry (`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`), OAuth 2.0 implicit flow popup + unggah dua langkah ke Drive (`uploadType=media` → PATCH `files/{id}`) — semuanya manual.

1. **W-1 Posisi** — panel impor SOP dipindah ke daftar `?view=template` (state/dialog/`pilihBerkasImpor`/`simpanImpor` di `EvaluasiView` dihapus −194 baris; panel pindah ke `TemplateView`). Pratinjau tetap menawarkan nama template & jenis acara yang bisa diubah sebelum disimpan.
2. **W-2 Ekspor lokal** — `src/tartib/lib/ekspor/tulisDocx.ts`: template → DOCX 3-entry memakai `buatZip` (penulis produksi di `lib/impor/zip.ts`, round-trip terbukti oleh `bacaZip`, 4 test); tombol "Unduh .docx" di editor template (nama berkas `SOP-<nama>.docx`).
3. **W-3 Ekspor Google Drive** — `src/tartib/lib/gdrive.ts` murni & teruji (6 test): OAuth 2.0 implicit flow popup (`response_type=token`, scope `drive.file`, state nonce, `tungguTokenPopup` polling hash), token di `localStorage` ±1 jam tanpa refresh; unggah `uploadType=media` → PATCH `files/{id}` → tautan buka berkas. Client ID diisi sekali di aplikasi (dari Google Cloud Console; origins `http://localhost:3000/` + `https://ugi577.github.io/tartib/`), tersimpan di browser.
4. **W-4 UI ekspor** — panel "Ekspor Template" di editor template: tombol "Unduh .docx" (utama) + "Simpan ke Google Drive" (sekunder, label "Mengunggah…" selama proses); tanpa client ID → form inline; galat memakai dialog/pesan aplikasi (tanpa `alert`).

**Gate W**
- [x] Impor SOP **tampil di daftar `?view=template`** dan **hilang dari tab Evaluasi** (verifikasi browser; `EvaluasiView` bersih −194 baris)
- [x] Ekspor **.docx lokal** — bytes dokumen lulus **pembaca ketat**: `unzip -t` bersih + `textutil` (mesin teks native macOS) membaca isinya (sesi 14, setelah bug cdSize diperbaiki `0d53a04`); invariant EOCD dikunci test regresi. *(Koreksi sesi 14: klaim awal "download event terpicu" ternyata tidak cukup — berkas yang diunduh sebelum `0d53a04` korup 12 byte dan ditolak pembaca ketat.)*
- [x] Pratinjau impor **memperlihatkan daftar item yang dibuang** (dilipat, dikelompokkan per heading BAGIAN) + hitungan tebakan vs fallback **sebelum simpan** (sesi 14, `a7a651f`, tindak lanjut audit Ahmed — K-19)
- [x] Ekspor **Google Drive** — alur token popup, simpan/baca client ID, unggah dua langkah teruji unit (6 test murni); tanpa client ID → form inline + validasi "Client ID tidak boleh kosong" (verifikasi browser)
- [x] Tanpa library baru — penulis ZIP manual + `CompressionStream`, DOCX 3-entry, OAuth/unggah manual
- [x] Teknis: `tsc` bersih, `vitest` 165/165 (22 berkas), `pnpm build` statis sukses
- [ ] **Verifikasi manual Ahmed** — impor .docx asli di tab Template (upload file tidak bisa diuji lewat browser otomatis): periksa daftar item yang dibuang di pratinjau → simpan → buka hasilnya; unduh ulang `.docx` (unduhan lama korup) dan buka di Word; alur Drive end-to-end dengan client ID miliknya

---

## Changelog PLAN

- **2026-08-22 — v1.20** — **Sesi 15 — header berlogo + template baku "SOP Baku (Panduan Manual)" + Cetak Panduan A4 (dua arahan Ahmed) + header bilah penuh sesuai referensi gambar.** Arahan: *(1) "masukkan ini 'Tartib — Pembuat SOP Acara' dalam header masukkan juga iconnya"*, *(2) "pada tab template buat template baku yg kosong atau di isi teks sebagai contoh, bisa didownload/export, dan jg bisa di print manual dan dan jadi akan panduan manual pengisian datanya"*, *(3) "buat header aplikasi sesuai referensi ini" + gambar (bilah penuh glass gradasi biru→hijau, logo kotak emerald di kiri, judul satu baris, tab pil di kanan, garis pemisah putih + shadow lembut)*. Lima commit: `ff89db1` logo Tartib (`LogoTartib.tsx` SVG inline squircle candy glass, artwork identik `icon.svg` favicon) + judul berikon + **rupa liquid glass** (WIP Ahmed di working tree — diverifikasi tsc/vitest 165/165 lalu dikomit; token tetap semantik), `0295761` `hapusTemplate` service (melengkapi tombol Hapus yang tanpa sengaja terbawa `a7a651f` — pelajaran: periksa diff per berkas sebelum `git add`), `8bd32e4` template baku + cetak (seed `TEMPLATE_PANDUAN` idempoten per nama — 6 fase H-30…H+1, 17 item "Contoh:", jenis Custom — + tombol "Cetak Panduan (A4)" di panel "Ekspor & Cetak Template", `CetakPayload` + varian `panduanTemplate`; formulir kertas: kop + identitas + tanggal per fase + PIC per item; penanda cetak 12/4/3), `01988d4` **header bilah penuh** sesuai referensi: `sticky top-0` glass gradasi `sky-50→white→emerald-50` + `border-b border-white/70` + shadow lembut, logo kiri, judul+tagline, nav `aria-label` pil di kanan (turun baris sendiri di layar sempit), konten `max-w-3xl`. Verifikasi browser 4173: banner terbaca (logo/judul/tagline/nav), **375px: 6 tab lengkap, scrollWidth==clientWidth, nol overflow**, template baku muncul (muat ulang cukup — balapan seed), editor 6 fase/17 item, klik Cetak memblokir webview (dialog cetak sistem — pola Batch F; **cetak fisik = verifikasi manual Ahmed**), Unduh .docx terpicu. tsc bersih, vitest **169/169**. **WIP Capacitor Ahmed TIDAK dikomit — menunggu keputusannya.**

- **2026-08-22 — v1.19** — **Sesi 14 — tindak lanjut audit impor oleh Ahmed: 84 item terbuang teraudit penuh, pratinjau kini memperlihatkan daftarnya, dan BUG PENULIS ZIP ditemukan + diperbaiki.** Ahmed mengaudit pratinjau impor (dokumen asli) dan menyorot tiga hal: (1) klaim "84 item di luar linimasa" tak bisa diverifikasi dari UI — **kelas RUSAK**; (2) ikon ⚠ tanpa keterangan di fase "Kunci pengisi acara"; (3) rasio fallback Ketua Panitia. **Audit walk independen atas dokumen asli:** seluruh 84 item terbuang berasal dari tiga bagian lampiran — BAGIAN 4 Ceklis Perlengkapan **39** + BAGIAN 5 Peminjaman & Pengembalian **33** + BAGIAN 6 Protokol Khusus **12** — nol item linimasa yang hilang; ⚠️ ternyata **isi dokumen** (heading asli: `"H-21 — Kunci pengisi acara ⚠️"`), bukan ikon aplikasi; fallback **14/57 (24,6%)** — di bawah ambang separuh, heuristik dipertahankan (K-19). Dua commit: `a7a651f` — parser mempertahankan teks item terbuang + konteks bagian (`itemLuarLinimasa`), pratinjau menampilkan daftar dilipat per bagian + hitungan "N tertebak, M tanpa kecocokan" sebelum simpan; `0d53a04` — **bug `buatZip`**: field ukuran central directory di EOCD dihitung dari `pos` yang sudah maju 12 byte ke dalam EOCD → cdSize 12 byte terlalu besar → **ekspor .docx ditolak pembaca ketat** (`unzip`: "missing 12 bytes"; `textutil` gagal) meski round-trip `bacaZip` (pembaca sendiri, toleran) lolos. Fix + test invariant `ofset CD + ukuran CD = posisi EOCD`; hasil fix lulus `unzip -t` dan terbaca `textutil`. **Unduhan .docx sebelum `0d53a04` (termasuk `SOP-Tasyakuran-Khatam.docx` milik Ahmed) korup — harus diunduh ulang.** Ekspor statis 4173 dibangun ulang; tsc bersih, vitest 165/165.

- **2026-08-22 — v1.18** — **Batch W — impor SOP pindah ke tab Template + ekspor template (.docx lokal & Google Drive)** (branch `master`, arahan Ahmed: *"salah posisi, mestinya fungsi import ini di tab template, berikan juga fungsi export, local dn gdrive"* — K-18 membatalkan K-17 poin 1). Tiga commit: `60a86cf` penulis ZIP (`crc32` tabel + `buatZip`: local header + central directory + EOCD, deflate `CompressionStream('deflate-raw')`; test ZIP lama kini memakai penulis produksi) + `tulisDocx` (DOCX 3-entry, 4 test round-trip), `5ceb1f4` `gdrive.ts` (OAuth 2.0 implicit flow popup + token localStorage ±1 jam tanpa refresh + unggah dua langkah `uploadType=media` → PATCH, 6 test murni), `3d59197` UI: panel impor pindah ke daftar `?view=template` (EvaluasiView dibersihkan −194 baris) + panel "Ekspor Template" di editor (Unduh .docx / Simpan ke Google Drive, form client ID inline). Tanpa library baru: ZIP, DOCX, OAuth, dan unggah semuanya manual. Verifikasi browser: impor tampil di tab Template, tab Evaluasi bersih, download `.docx` terpicu, form client ID + validasi muncul. Gate W teknis lulus (tsc, vitest 164/164, build statis); **tersisa verifikasi manual Ahmed** (impor .docx asli, buka hasil unduhan di Word, alur Drive end-to-end dengan client ID miliknya).

- **2026-08-22 — v1.17** — **Batch V — Impor SOP dari dokumen .docx selesai diimplementasi** (branch `master`, arahan Ahmed: *"pada evaluasi, siapkan fungsi import, yg bisa dibaca/duplikasi dan modifikasi. contoh sop acara mahad ini"* — K-17). Tiga commit: `a57e33c` parser (ZIP manual + XML lite + pemetaan document.xml → fase/item + tebak divisi, 15 test), `82ecad9` `imporTemplate` atomik + `bangunStrukturImpor` murni (3 test), `9b38bed` panel & dialog pratinjau di `?view=evaluasi`. Tanpa library baru: ZIP lewat EOCD/central directory + `DecompressionStream('deflate-raw')`. Terbukti pada dokumen asli: 9 fase (H-30…H+1), 57 item (43 tebakan divisi, 14 fallback), 84 item luar linimasa dilaporkan. Gate V teknis lulus (tsc, vitest 146/146, build, 375px); **tersisa verifikasi manual Ahmed** (pilih berkas di browser + cek tab Template). *Catatan: titik masuk impor kemudian dipindah ke tab Template oleh Batch W (K-18) — lihat v1.18.*

- **2026-08-22 — v1.16** — **Snapshot publik disinkronkan pertama kali (sesi 11, perintah Ahmed: "push").** (1) **Tab Tentang dibersihkan dari nama merek** (`941e4bd`, arahan Ahmed: *"hilangkan semua merk aplikasi tertentu ganti dgn kata ganti aplikasi sejenis/aplikasi lain"*) — kartu lanskap "AI SOP Genie, SOPmate, Quick SOP" / "Coordon, ORGA" → "Aplikasi sejenis — penyusun dokumen SOP" / "Aplikasi sejenis — pengelola eksekusi acara", "sinkronisasi Slack/WhatsApp" → "sinkronisasi pesan instan", paragraf riset menyebut "(nama produk tidak disebutkan)"; nama asli tetap di DECISIONS K-13 (internal). (2) **`scripts/sync-publik.sh master --push` dijalankan** — snapshot deterministik 61 berkas (59 + `kelas.ts` + `kelas.test.ts`; `docs/`, `.claude/`, `scripts/` dikecualikan), commit `42429f3` fast-forward di atas `origin/main` (tanpa force), workflow "Deploy ke GitHub Pages" sukses (51s), konten baru **terverifikasi live** di https://ugi577.github.io/tartib/ (bundle berisi "…sampai H+1 dan cetak laporannya", "Aplikasi sejenis — penyusun dokumen SOP", "sinkronisasi pesan instan"). Skrip terbukti dipakai; sinkronisasi berikutnya = perintah yang sama.

- **2026-08-22 — v1.15** — **Gate U DITUTUP + Batch U di-merge ke `master` (sesi 11)**. (1) **Tagline dikoreksi**: "…kawal tugas panitia sampai hari-H" → "**sampai H+1**" (header `page.tsx` + halaman Tentang) — papan eksekusi nyatanya mencakup fase Evaluasi H+1 (offset +1 pada template contoh), jadi "sampai hari-H" mengecilkan cakupan (koreksi atas arahan Ahmed: *"…sampai hari-H = sampai h+1"*). (2) **Audit UI kedua** (skill `browser-use:control-browser` — tersedia di sesi ini, K-16 dikoreksi) menemukan & memperbaiki dua sisa masalah sebelum merge: **`ed64c9c`** — `${KELAS.kartuIsi}` tertulis sebagai string literal di `TamuView` (daftar acara) & `EvaluasiView` (panel promosi usulan) sehingga kartu tampil tanpa latar/garis/radius; **`7bd9331`** — badge Aktif/Diarsipkan template memakai kelas inline sendiri (display block, berat 400) → `KELAS.badgeAksen`/`badgeNetral`, kartu kelompok tamu `border-slate-200` → token `border-garis`. Verifikasi penuh: tsc bersih, vitest 128/128, `pnpm build` sukses, penanda cetak utuh (11/3/2/2), nol overflow 375px di keenam view + detail + dialog, `colorScheme light` terjaga. (3) **Gate U ditutup** atas perintah Ahmed *"merge semua ke master"* — **`batch-u-ui` di-merge `--no-ff` ke `master`** (12 commit: 6 Batch U + `8e51183` + `75751ad` + sesi 11 `ed64c9c`/`7bd9331`/`8f03f80` docs + tagline + pass-gate). **Belum dilakukan:** sinkronisasi repo publik `ugi577/tartib` (skrip `sync-publik.sh` siap, dry-run 59 berkas — menunggu keputusan Ahmed).

- **2026-08-22 — v1.14** — **Tindak lanjut audit sesi 10 (sesi 10b)** — saran audit dirapikan: (1) **11 kelas inline bernilai identik diganti token** di enam komponen (`8e51183`, branch `batch-u-ui` — total 8 commit di branch); (2) **Gate U diverifikasi ulang di browser sesi ini** — BUG-U1 terbukti hilang (setelah reload tab: `colorScheme light`, `bodyBg rgb(248,250,252)`, `bodyColor rgb(51,65,85)` — cocok dengan klaim `f8403a0`; dev server ternyata tidak basi, tab browser yang basi); BUG-U2 terbukti hilang (375px: enam link nav lengkap, `scrollWidth == clientWidth` == 375, `flex-wrap: wrap`); smoke klik "→ JALAN" → "0 dari 34 tugas selesai · 1 sedang berjalan" → status dikembalikan ke BELUM (data Ahmed utuh); (3) `pnpm build` sukses — `@page{size:A4;margin:14mm}` dan `color-scheme:light` ada di CSS hasil build, dev server di-restart (HTTP 200); (4) **angka Batch U dikoreksi** — `c510eaa` mengganti **103 baris** kelas inline (bukan 88), `b7f5a9a` menyeragamkan **162 `text-slate-*` → 161 `teks-*`** (bukan 151), Batch U = **6 commit** (bukan 5, +`882302f` docs closeout); (5) **`scripts/sync-publik.sh` dibuat** (`75751ad`) — snapshot publik deterministik dari `git archive`, menolak `docs/`/`.claude/` di pohon final, dry-run default, `--push` = commit-tree di atas tip `origin/main` + push **tanpa force** (fast-forward saja); dry-run teruji: 59 berkas, tidak mengubah apa pun. **Belum dilakukan:** merge `batch-u-ui` → `master`, sinkronisasi repo publik (menunggu Gate U ditutup pernyataan Ahmed), keputusan pemakaian `sync-publik.sh`.

- **2026-08-22 — v1.13** — **Batch U selesai diimplementasi** (branch `batch-u-ui`, 6 commit): `309e12e` docs (K-16), `f8403a0` fix dua bug tampilan, `72fa1be` token desain + `src/tartib/ui/kelas.ts` + 7 test, `c510eaa` **103 baris** kelas inline diganti token di enam komponen, `b7f5a9a` hierarki per view (kosakata teks: **162 `text-slate-*` → 161 `teks-*`**, nilai warna identik), `882302f` docs closeout. Yang berubah bagi pengguna: aplikasi terbaca di perangkat mode gelap; keenam tab terjangkau di ponsel; beranda punya lima pintu masuk (Evaluasi & Tentang sebelumnya hanya lewat tab); satu gaya tombol dengan aksi utama tunggal per kartu; status tugas kini badge seperti status acara; tombol cetak/ekspor dikelompokkan sebagai panel "Cetak & ekspor"; editor template tidak lagi didominasi 33 tombol "Hapus" merah. Gate U teknis **lulus** (tsc bersih, vitest 128/128, build statis, penanda cetak identik). **Tersisa verifikasi manual Ahmed** — Gate U belum ditutup, belum di-merge ke `master`, belum disinkronkan ke repo publik. Catatan operasional: `pnpm build` dan `next dev` berebut direktori `.next` (chunk dev jadi 404) — jalankan build saat dev berhenti, atau restart dev setelah build.

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
