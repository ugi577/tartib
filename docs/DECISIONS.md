# DECISIONS — Tartib

Log keputusan permanen. **Entry terbaru di ATAS.** Format: `K-xx — tanggal — judul — keputusan`.

---

## K-19 — 2026-08-22 — Sesi 14: audit pratinjau impor — daftar item yang dibuang wajib terlihat; ekspor .docx diuji pembaca ketat, bukan round-trip sendiri

Ahmed mengaudit pratinjau impor atas dokumen asli dan menunjuk tiga risiko. Keputusan:

1. **Klaim heuristik harus bisa diverifikasi dari UI (kelas RUSAK).** "84 item di luar linimasa tidak diimpor" adalah deklarasi, bukan bukti — item yang gagal dikenali akan hilang diam-diam. Sejak `a7a651f` parser mempertahankan teks item terbuang beserta heading bagiannya (`itemLuarLinimasa`), dan pratinjau menampilkan daftarnya (dilipat, dikelompokkan per BAGIAN). Audit walk independen atas dokumen contoh membuktikan 84 = 39 (BAGIAN 4 ceklis perlengkapan) + 33 (BAGIAN 5 peminjaman/pengembalian) + 12 (BAGIAN 6 protokol khusus); nol item linimasa yang hilang.
2. **Ekspor .docx cukup diuji round-trip dengan pembaca sendiri — TIDAK.** Bug nyata ditemukan justru oleh pembaca ketat: field ukuran central directory di EOCD ditulis 12 byte terlalu besar (dihitung dari `pos` yang sudah maju ke dalam EOCD), sehingga `unzip` menolak ("missing 12 bytes") dan `textutil` gagal membaca — sementara `bacaZip` (pembaca produksi sendiri, tidak memakai cdSize) lolos. Sejak `0d53a04` ekspor lulus `unzip -t` + `textutil`, dan invariant EOCD dikunci test regresi. Pelajaran: **format berkas yang ditulis manual harus divalidasi dengan pembaca pihak ketiga yang ketat, bukan hanya pembaca sendiri.** Unduhan .docx sebelum fix korup dan harus diunduh ulang.
3. **Fallback Ketua Panitia dipertahankan** — kriteria Ahmed: bila lebih dari separuh item jatuh ke fallback, heuristik tidak menghasilkan nilai dan lebih jujur dikosongkan. Dokumen contoh: 14/57 (24,6%) — jauh di bawah ambang, dan yang jatuh memang tugas generik ("Tetapkan tanggal, jam mulai…"). Hitungan tebakan vs fallback kini tampil di pratinjau SEBELUM simpan agar bisa dihakimi sebelum menyimpan.
4. **⚠️ pada label fase adalah isi dokumen** — heading asli dokumen contoh tertulis `"H-21 — Kunci pengisi acara ⚠️"`; aplikasi menyalin apa adanya (fidelitas isi), bukan ikon UI yang butuh legenda.

## K-18 — 2026-08-22 — Batch W: impor SOP dipindah ke tab Template; ekspor template .docx lokal & Google Drive (membatalkan K-17 poin 1)

Arahan Ahmed: *"salah posisi, mestinya fungsi import ini di tab template, berikan juga fungsi export, local dn gdrive"*. Keputusan:

1. **Titik masuk impor dipindah** dari daftar acara `?view=evaluasi` ke daftar template `?view=template` — **membatalkan K-17 poin 1**. Tab Evaluasi kembali hanya lembar evaluasi per divisi + promosi usulan. Hasil impor tetap template biasa (bisa dibaca / diduplikasi / dimodifikasi di editor template).
2. **Ekspor template dengan dua target**:
   - **Lokal** — unduh `.docx` (`lib/ekspor/tulisDocx.ts`): template → DOCX minimal (nama, jenis — catatan, fase tebal `H-offset — label`, item `☐ judul`), ZIP ditulis manual (`buatZip`/`crc32` di `lib/impor/zip.ts`). Round-trip terbukti: hasilnya terbaca ulang oleh `bacaZip` (importer sendiri) dan terbuka di Word/LibreOffice. *(Koreksi K-19 poin 2: klaim "terbuka di Word/LibreOffice" keliru — penulis punya bug cdSize 12 byte yang baru terlihat saat diuji `unzip`/`textutil`; lihat K-19.)*
   - **Google Drive** — OAuth 2.0 implicit flow (popup, `response_type=token`, scope `drive.file`, state nonce), token di localStorage `tartib.gdrive.token` (±1 jam, tanpa refresh), unggah dua langkah (POST `uploadType=media` → PATCH `files/{id}`). Client ID diambil dari Google Cloud Console, dimasukkan pengguna sekali di panel ekspor, disimpan di browser ini (`tartib.gdrive.clientId`). Authorized JS origins & redirect URIs yang perlu didaftarkan: `http://localhost:3000/` dan `https://ugi577.github.io/tartib/`.
3. **Tanpa library baru tetap berlaku** (BRIEF Bagian 4): ZIP ditulis manual (CRC32 tabel 0xedb88320, `CompressionStream('deflate-raw')`), OAuth & unggah Drive memakai `fetch` polos.

Status: Gate W teknis lulus (tsc, vitest 164/164 — 22 berkas, build statis, nol overflow 375px; alur popup & validasi client ID terverifikasi di browser). Tersisa verifikasi manual Ahmed: impor .docx asli di tab Template, buka hasil unduhan .docx di Word, alur Drive dengan client ID miliknya.

## K-17 — 2026-08-22 — Batch V: impor SOP dari dokumen .docx di tab Evaluasi; ZIP/XML diparse manual tanpa library

Arahan Ahmed: *"pada evaluasi, siapkan fungsi import, yg bisa dibaca/duplikasi dan modifikasi. contoh sop acara mahad ini"* (berkas `SOP ACARA - Mahad Askar Quran.docx`). Keputusan:

1. **Titik masuk: tab Evaluasi** (daftar acara) — sesuai arahan; hasil impor adalah **template biasa**, jadi "bisa dibaca / diduplikasi / dimodifikasi" otomatis terpenuhi lewat fitur template yang sudah ada (editor, Duplikat, Versi Baru).
2. **Tanpa library baru (BRIEF Bagian 4).** DOCX = ZIP: dibaca manual lewat end-of-central-directory + central directory, inflate `deflate-raw` memakai `DecompressionStream` (browser & Node ≥ 18). XML diparse dengan parser non-validating sendiri (`parseXmlLite`) — cukup untuk `word/document.xml`.
3. **Pemetaan dokumen → SOP (heuristik teruji pada dokumen asli).** Fase = paragraf tebal berawalan offset H (`H-30`, `Hari-H`, `H+1`); item = paragraf ☐; heading `BAGIAN n —` memutus fase aktif sehingga item di luar linimasa (cek lis perlengkapan dsb.) **tidak diimpor** dan dihitung untuk dilaporkan; sub-judul & prosa diabaikan. Divisi item = **tebakan kata kunci** (`tebakDivisi`, peta eksplisit; fallback Ketua Panitia) karena dokumen tidak mencantumkan divisi per item — pratinjau menampilkan ringkasannya dan editor template tetap bisa mengubahnya. Batas `BAGIAN n —` dan aturan tebal mengikuti format nyata dokumen contoh; dokumen berformat lain dilaporkan apa adanya (tidak dipaksakan).
4. **Penyimpanan atomik.** `imporTemplate` membangun template+fase+item (validasi penuh: nama/label/judul wajib, divisi dikenal, rumusQty sah) lalu menyimpan dalam satu transaksi Dexie — gagal satu item berarti tidak ada yang tersimpan.

Bukti: verifikasi end-to-end terhadap dokumen asli menghasilkan 9 fase (H-30, H-21, H-14, H-10, H-7, H-3, H-1, Hari-H, H+1), 57 item (43 tebakan, 14 fallback), 84 item luar linimasa dilaporkan. Gate V teknis lulus; verifikasi manual Ahmed tersisa (pilih berkas di browser — upload file tidak bisa diuji lewat browser otomatis).

## K-16 — 2026-08-22 — Batch U (UI): alat diganti Browser pane bawaan; dua temuan baseline diperlakukan sebagai bug, bukan percantikan

Ahmed menyetujui eksekusi `docs/PLAN-UI.md` ("cek apakah berjalan sesuai plan dan saran terbaiknya — sy konfirmasi — lalu kerjakan"). Sebelum eksekusi, rencana dikoreksi pada dua titik:

1. **Alat.** PLAN-UI v1 mengandalkan skill MCP `browser-use:control-browser` dan `browser-use:web-gui-tester`. Skill itu **tidak ada** di daftar skill sesi agen ini, jadi rencana tidak dapat dieksekusi apa adanya. Pengganti yang setara dan sudah terpasang: **Browser pane bawaan** — `preview_start` (tab ke `localhost:3000`), `navigate`, `read_page` (pohon aksesibilitas + `ref` elemen), `computer` (klik/ketik/screenshot), `form_input`, `resize_window` (lebar ponsel + `colorScheme` terang/gelap), `javascript_tool` (baca computed style), `read_console_messages`. Kemampuan yang dipakai PLAN-UI (navigasi tiap `?view=`, screenshot sebelum/sesudah, klik/isi form untuk smoke test) seluruhnya tercakup. Pelajaran: **rencana tidak boleh menyebut alat tanpa memverifikasi alat itu ada di sesi yang akan mengeksekusinya.**
2. **Klasifikasi temuan.** Audit baseline (localhost:3000, data nyata: seed template contoh + acara "Khatam Tasmi Angkatan 12" 33 tugas) menemukan dua hal yang **bukan soal selera** dan karena itu masuk kategori RUSAK — dikerjakan sebelum percantikan apa pun:
   - **BUG-U1 — tidak terbaca di mode gelap.** `body` tidak punya warna latar dan dokumen tidak menyatakan `color-scheme`; di perangkat/browser bermode gelap, kanvas bawaan menjadi hitam sementara teks tetap `slate-700/800` → judul dan navigasi nyaris tak terbaca. Terbukti: `getComputedStyle(document.body).backgroundColor` = `rgba(0,0,0,0)`, `colorScheme` = `normal`, `<h1>` = `rgb(30,41,59)` di atas kanvas hitam. Ini juga berlaku untuk situs publik https://ugi577.github.io/tartib/ — wajah publik aplikasi.
   - **BUG-U2 — dua tab hilang di ponsel.** `nav` memakai `flex gap-2` tanpa `flex-wrap` maupun scroll horizontal: pada kontainer selebar 359px tautan berakhir di x=545, sehingga **Evaluasi** dan **Tentang** keluar batas dan praktis tidak terjangkau; selain itu baris judul view (`flex items-center justify-between` tanpa `flex-wrap`) membuat teks keterangan tertimpa tombol aksi.

Konsekuensi: Batch U + Gate U masuk `docs/PLAN.md` (branch `batch-u-ui`), dengan U-1 = perbaikan dua bug di atas, baru U-2 token desain dan seterusnya. Token dibuat **semantik** (`aksen`, `permukaan`, `garis`) supaya keputusan branding yang masih terbuka bisa dijalankan dari satu berkas konfigurasi.

**Tambahan — 2026-08-22 (sesi 11, audit UI kedua, arahan Ahmed "fokus ke ui app ini … kerjakan"):** skill `browser-use:control-browser` **ternyata tersedia** di sesi ini — pernyataan poin 1 (alat tidak ada) berlaku untuk sesi 10 saja, bukan lingkungan secara umum; PLAN-UI dikoreksi. Audit browser ulang (keenam view, 1280px & 375px, detail & dialog, computed style) menemukan dua bug sisa yang lolos Batch U: (1) **`${KELAS.kartuIsi}` ditulis sebagai string literal** (bukan template literal) di `TamuView` (daftar acara) dan `EvaluasiView` (panel "Promosikan Usulan ke Template") — kelas kartu tidak pernah teraplikasi; diperbaiki `ed64c9c`; (2) **badge Aktif/Diarsipkan** di daftar & editor template memakai kelas inline sendiri (display block, berat 400, tanpa ring) padahal KELAS.badgeAksen/badgeNetral sudah baku, dan kartu kelompok tamu memakai `border-slate-200` mentah; disatukan ke token `7bd9331`. Sisanya bersih (nol overflow 375px, dialog muat viewport, `colorScheme light`, penanda cetak 11/3/2/2 utuh, `tsc`/`vitest` 128/128/`pnpm build` sukses). Elemen `alert` di pohon aksesibilitas diidentifikasi sebagai `__next-route-announcer__` bawaan Next.js (tersembunyi 1px — bukan bug).

## K-15 — 2026-08-22 — Keputusan final: Tartib dan mahadapp dipisahkan; pengganti integrasi = info/link di mahadapp menunjuk ke Tartib

Keputusan final Ahmed — *"sy putuskan pisahkan, cukup nnt ditambahkan di mahadapp info ke app tartib ini, misal dalam studio print sop acara linknya ke app ini"*. Latar belakang: kedua aplikasi direncanakan **fork dengan nama lain untuk rilis publik** (bukan rilis internal). Keputusan:

1. **Integrasi (Batch G) BATAL** — bukan lagi "menunggu konfirmasi" (menutup status K-14 poin 1 & 3): Tartib dan mahadapp berjalan sebagai aplikasi terpisah. Keuntungan integrasi (cetak native + data bersama) dikalahkan konteks fork-publik (privasi data, stabilitas UI/sistem mahadapp, kemudahan rebranding); keduanya bisa ditambahkan ke Tartib standalone di kemudian hari.
2. **Pengganti integrasi: info/link di mahadapp menunjuk ke aplikasi Tartib** — contoh Ahmed: di Studio Print, entri "SOP acara" menunjuk ke aplikasi Tartib. **Belum diimplementasikan** ("nnt ditambahkan"); tercatat di backlog PLAN v3.
3. **Komit G-1 (`ea10ea6`) dan G-3 (`4c204af`) tetap di cabang `batch-g-integrasi-v3`** — tidak di-revert, tidak dihapus, tidak di-push (keputusan K-14 poin 2 dipertahankan). Cabang bisa dihapus kapan saja — komitnya bisa dipulihkan via reflog (±90 hari).
4. Detail item info/link yang **belum diputuskan**: URL tujuan (Tartib belum di-hosting — tidak ada alamat publik; fork publik belum ada), penempatan persis, dan waktu pengerjaan.

**Tambahan — 2026-08-22 (sesi 9, status pelaksanaan):** poin 2–4 K-15 terpenuhi. (a) **Tartib di-hosting publik**: repo `ugi577/tartib` (publik) dengan GitHub Pages https://ugi577.github.io/tartib/ (terverifikasi HTTP 200); konten publik = snapshot kode bersih **tanpa `docs/` internal**. (b) **Link dikerjakan**: entri "SOP Acara" di Studio Print v3 (`f88dfe2`, wip) membuka URL publik via `window.open(..., "_blank")` — **menunggu uji manual Ahmed di device**. (c) Cabang `batch-g-integrasi-v3` **DIHAPUS** 2026-08-22 atas perintah Ahmed ("bersihkan skrg") — komit G-1 (`ea10ea6`)/G-3 (`4c204af`) bisa dipulihkan via reflog (±90 hari), skema DB v3 tetap v37. Keputusan pisahkan tidak berubah.

## K-14 — 2026-08-22 — Tartib berdiri sendiri; integrasi ke mahadapp menunggu konfirmasi

Ahmed memutuskan Tartib adalah **aplikasi mandiri** ("app ini saya buat berdiri sendiri"); opsi integrasi ke mahadapp **ditunda menunggu konfirmasi eksplisit** — "opsi integrasi tunggu konfirmasi", demi stabilitas tampilan UI dan sistem mahadapp. Keputusan:

1. **Batch G (integrasi v3) DITUNDA** — sub-langkah G-2 (`mahadHost.ts`), G-4 (menu/rute), G-5 (cetak) dan Gate G tidak dikerjakan sampai Ahmed menyatakan konfirmasi.
2. **Komit G-1 (`ea10ea6` salin `src/tartib/`) dan G-3 (`4c204af` skema v38 + backup VERSI 6) tetap di cabang `batch-g-integrasi-v3`** (pilihan Ahmed dari tiga opsi: simpan / revert / revert+hapus) — keduanya **inert**: modul belum dirujuk kode mana pun, skema hanya *menambah* tabel `tartib_*`, perilaku mahadapp tidak berubah. Tidak di-revert, tidak dihapus, tidak di-push.
3. Status lanjut dibuka lagi hanya bila Ahmed menyatakan keputusan baru.

## K-13 — 2026-08-22 — Posisi produk: SOP sebagai mesin eksekusi untuk acara kecil–menengah (riset pasar)

Riset lanskap Ahmed (2026-08-22): aplikasi pembuat SOP (AI SOP Genie, SOPmate, Quick SOP) berhenti di dokumen; aplikasi eksekusi acara (Coordon, ORGA) memulai dari SOP manual dan berat untuk skala kecil–menengah. Celah terbesar = jembatan dokumen ↔ eksekusi. Keputusan:

1. **Tartib diposisikan sebagai "SOP yang dieksekusi"**, bukan generator dokumen: template → snapshot acara → papan tugas ber tanggal nyata → laporan eksekusi. Arsitektur K-03/K-11 sudah menjadi jembatan itu; Batch T menambah lapisan yang tampak pengguna: ikhtisar progres (`lib/ikhtisar`), fase hari-ini/berikutnya, dan cetak Laporan Eksekusi.
2. **Halaman `?view=tentang`** mencatat posisi produk ini secara permanen di dalam aplikasi (peta lanskap, celah yang diisi, cara mengisinya).
3. **Integrasi eksternal (Slack/ERP/QMS/notifikasi push) tetap backlog** — melanggar K-09 (offline penuh); dicatat jujur di halaman Tentang sebagai visi, bukan janji fitur. Integrasi terdekat yang sah tetap TartibHost → v3 (Batch G).
4. Skala sasaran ditegaskan: **acara kecil–menengah** (tasyakuran, khataman, acara cabang) — kerumitan alat acara besar sengaja tidak dikejar.

Konsekuensi teknis: `CetakPayload` bertambah `ikhtisarEksekusi` (perluasan aditif batas K-04); hitungan ikhtisar = fungsi murni teruji; persen selesai mengecualikan tugas BATAL dari penyebut agar membatalkan tugas tidak menurunkan progres.

## K-12 — 2026-08-22 — `rumusQty` ikut disnapshot ke tugas (perluasan K-03/A-02, Batch D)

`tartib_tugas` menyimpan salinan `rumusQty` dari `tartib_templateItem` saat acara dibuat (sama seperti `judul`/`catatan`/`wajib`), bukan field baru yang dibaca belakangan. Alasan: `perlengkapanService.generatePerlengkapan()` (Batch D) perlu rumus qty per tugas untuk menghitung `qtyHitung`, tapi A-02 melarang kode apa pun membaca `tartib_templateItem` untuk acara yang sudah dibuat (diverifikasi grep, Gate C). Menyalin `rumusQty` ke `tugas` sekali di titik snapshot yang sama menjaga aturan itu tanpa jalur baca kedua ke template.

## K-11 — 2026-08-22 — Fase ikut disnapshot ke acara (perluasan K-03)

Saat acara dibuat dari template, **fase juga** disalin ke baris milik acara (`tartib_fase` dengan `templateId = id acara`), bukan hanya item ke `tartib_tugas`. Editor template memakai `templateId = id template`; papan acara memakai `templateId = id acara`. Akibat: edit template apa pun (termasuk hapus/ubah fase dan offset hari) **tidak pernah** mengubah acara yang berjalan — isolasi penuh dua arah.

## K-10 — 2026-08-22 — Integrasi dengan cara salin folder, bukan monorepo

`src/tartib/` portabel; integrasi = salin folder ke v3 + sediakan `mahadHost` + naikkan versi Dexie. Alasan: menghindari tooling monorepo untuk satu modul.

## K-09 — 2026-08-22 — Offline penuh

Tidak ada pemanggilan jaringan di jalur mana pun. Bila suatu fitur menuntut jaringan, fitur itu masuk backlog.

## K-08 — 2026-08-22 — Bahasa antarmuka: Indonesia

Istilah pesantren dipertahankan apa adanya (ikhtilath, musyrif, tasmi'), tidak diterjemahkan.

## K-07 — 2026-08-22 — Routing query param saja

Konsekuensi `output: 'export'`.

## K-06 — 2026-08-22 — Aturan PIC wajib ditegakkan di service layer, bukan UI

`acaraService.setStatus(id, 'SIAP')` melempar `PicBelumLengkapError` bila ada divisi bertugas tanpa PIC. UI hanya menampilkan pesannya. Alasan: aturan yang hanya dijaga UI akan bocor lewat impor, seed, atau jalur lain.

## K-05 — 2026-08-22 — Fase adalah data, bukan enum keras

Tiap template mendefinisikan fasenya sendiri (label + offset hari). Alasan: temuan Ahmed — *"undangan idealnya dua pekan, tapi bila SOP matang sepuluh hari pun cukup."* Linimasa harus bisa dipendekkan tanpa mengubah kode.

## K-04 — 2026-08-22 — `TartibHost` adalah satu-satunya batas integrasi

Modul **tidak boleh** mengimpor apa pun dari v3. Kebutuhan data luar (jumlah santri, daftar cabang, cetak) lewat adapter. Standalone memakai `standaloneHost`, v3 memakai `mahadHost`.

## K-03 — 2026-08-22 — Acara menyimpan SNAPSHOT template, bukan referensi hidup

Saat acara dibuat, seluruh item template disalin ke tabel tugas. Perubahan template sesudahnya **tidak** mengubah acara yang berjalan. Alasan: acara yang sedang disiapkan tidak boleh berubah diam-diam. Ini penerapan langsung anti-pattern **"Deklarasi dianggap data"** — yang jadi pegangan panitia adalah tugas yang tersalin, bukan definisi template.

## K-02 — 2026-08-22 — Semua tabel Dexie berawalan `tartib_`

Skema v3 sudah di v37; awalan mencegah tabrakan saat penggabungan.

## K-01 — 2026-08-22 — Nama modul: `tartib`

Istilah "tartib acara" sudah dikenal di lingkungan pesantren, dan maknanya penyusunan/pengurutan. Sejalan dengan penamaan proyek lain (Turjuman, Syajarah, Sima'i).

---

*Keputusan baru ditambahkan di bagian atas. Perubahan keputusan Terkunci = tulis entry baru di sini, bukan mengedit entry lama.*
