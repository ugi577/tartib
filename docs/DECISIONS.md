# DECISIONS — Tartib

Log keputusan permanen. **Entry terbaru di ATAS.** Format: `K-xx — tanggal — judul — keputusan`.

---

## K-25 — 2026-08-29 — Sesi 20 — rupa kaca krem–teal–emas dari referensi UI Ahmed

Arahan Ahmed: *"terapkan ui ini ke proyek, cek dan pahami dl, tetap pertahankan ornamen yg sudah ada,
jangan terapkan garis gold yg gelombang dan bintang 4 arah dr file ini"* (berkas `~/Documents/ui
tartib.html`). Tema referensi: teal gelap (#1A5A4A/#246B5A/#518E7F) + emas (#C5A87B) di atas krem
(#F5F5F0), glassmorphism, tab pil dengan aktif = teal gelap berbingkai emas, kartu berornamen sudut
emas, tombol utama gradasi teal berbingkai emas. Keputusan:

1. **Palet `aksen` emerald → teal** (50–950, inti 500 `#3f8372`/600 `#246b5a`/700 `#1a5a4a`/800
   `#144738`) + **palet `emas` baru** (100 `#f3ecdd` s/d 900 `#5a462d`, inti 500 `#c5a87b`) di
   `tailwind.config.ts`. `permukaan.dasar` = `#f5f5f0` (krem, latar seluruh app), `permukaan.kontras`
   = `#144738`, `glowAksen` = kilau putih 1px + bayangan teal 50%.
2. **Rupa "liquid glass di atas krem"** — pola referensi dipertahankan memakai token yang ada:
   kartu/kartuIsi = putih translusen (`bg-permukaan-kartu`) + `border-emas-300/60` + blur; tombol
   utama = gradasi `aksen-700→600` + `ring-1 ring-emas-400/70` + `shadow-glowAksen`; badge info =
   `bg-emas-100/70` + teks `emas-700`; nav tab = pil kaca putih/70, aktif = gradasi teal gelap +
   `ring-emas-400/80`.
3. **Header gelap teal berbingkai emas** — gradasi `aksen-800→700→600`, `border-b border-emas-400/40`,
   judul & tagline putih/emas; baris tab di bawahnya kaca gradasi teal-tua→putih→emas (pola sesi 16
   diteruskan dengan warna baru).
4. **Ornamen lama dipertahankan apa adanya** — `BintangDelapan` ×3 + `LogoTartib` + `PitaIslami`
   (12 bintang) tetap satu-satunya ornamen; diwarnai ulang samar `emas-200/*` agar selaras.
   **DITOLAK sesuai arahan: garis gold gelombang dan bintang 4 arah dari berkas referensi TIDAK
   diterapkan** (kode maupun aset dekoratifnya tidak pernah masuk proyek).
5. **Cetak tidak berubah** — `@page A4 14mm` + `background-image: none` di blok cetak (glow kaca tidak
   ikut tercetak); rupa baru murni presentasional layar.
6. **Ikon ikut teal** — `LogoTartib.tsx` (artwork identik `src/app/icon.svg`) dan favicon
   `#059669` → `#246b5a`; badge status Tamu "SELESAI" memakai `badgeAksen` (token, bukan slate mentah).

---

## K-24 — 2026-08-29 — Sesi 19: Batch Y — sub-tugas, kategori rutin, cetak multi-ukuran, ekspor/impor papan

Empat arahan Ahmed: *(1) "ubah teks headernya 'pembuat SOP Acara' menjadi = 'Pembuat SOP'*, *(2) fungsi
sub dari tugas, artinya dalam satu checklist bisa dibuatkan sub sehingga lebih detail tugas yg
diberikan, dan ya mirip seperti anggota dan tugasnya juga*, *(3) pastikan bisa di print pdf a4 / f4
dan ukuran lainnya (pasti bisa export/import jg)*, *(4) berikan tambahan catatan bahwa pekerjaan rutin
harian, mingguan, bulanan, part, insidential/saat dibutuhkan sj". Keputusan:

1. **Sub-tugas = tabel sendiri `tartib_sopSubItem` (skema v5), bukan rekursi pada `tartib_sopItem`.**
   Tiap sub: `itemId` induk + `sopId` penyangga (reset/duplikat/hapus papan cukup satu query per
   papan), judul, PIC, catatan, ceklis + `selesaiPada`. Satu tingkat sub saja — "rincian di bawah
   amanah" sesuai arahan; sub dari sub disengaja tidak ada. Hapus item menghapus sub-nya (tidak ada
   yatim); hapus/duplikat/reset papan mengikat seluruh sub dalam satu transaksi; salinan me-reset
   ceklis sub juga. **Progres papan menghitung SEMUA baris tercentang (item + sub)** = jumlah kotak
   ceklis yang tampak, ditambah keterangan "· termasuk N sub-tugas".
2. **Kategori rutin = `SopItem.rutin?: string` bebas teks dengan saran datalist** — Harian, Mingguan,
   Bulanan, Part, Tahunan, "Insidental (saat dibutuhkan saja)". Kata "part" Ahmed dipertahankan apa
   adanya di daftar saran; isian bebas menampung frekuensi lain ("setiap semester") tanpa skema baru.
   Hanya di level item (sub mewarisi konteks induknya). Tampil sebagai badge amber; kolom "Rutin"
   ikut tercetak. Seed papan amanah kini membawa rutin per amanah.
3. **Cetak PDF multi-ukuran lewat dialog cetak, bukan pembuat PDF baru** (tanpa library — BRIEF 4).
   Pilihan kertas per perangkat (localStorage `tartib.sop.kertas`): A4, F4/Folio (210×330),
   Letter, Legal, A5. `@page { size: …; margin: 12mm }` di-inject sebagai `<style>` di dalam blok
   cetak sehingga menimpa `@page A4` global saat tercetak; hint di layar: PDF = pilih "Save as PDF"
   di dialog cetak sistem. Tabel cetak bertambah kolom Rutin dan baris sub "↳".
4. **Ekspor/impor papan meniru pola round-trip template (K-19/K-20)**: `tulisDocxSop` menulis
   document.xml yang terbaca manusia (☐ item, ↳ sub, "— PIC: … — Rutin: … — Catatan: …") PLUS entry
   `tartib/sop.json` berisi seluruh data; importer `dokumenSopPapan` memakai JSON itu dulu (penuh,
   tanpa tebakan), berkas Word biasa jatuh ke heuristik ☐/↳/atribut berlabel. Impor selalu menghasilkan
   SOP kustom baru dengan ceklis kosong; pratinjau menampilkan jumlah item/sub/PIC sebelum simpan.
   Impor file lewat file chooser tidak bisa diuji browser otomatis — diikat test round-trip
   ekspor→impor di Node (6 test).
5. **Cadangan naik ke v3** (tabel sub-tugas ikut) dengan aturan kompatibilitas deklaratif
   `BOLEH_HILANG_SEJAK`: v1 tanpa sop/sopItem/sopSubItem, v2 tanpa sopSubItem — keduanya tetap sah
   dibaca; selain itu ditolak.
6. **Judul header & metadata menjadi "Tartib — Pembuat SOP"** (layout description ikut); tagline tidak
   diubah karena masih menggambarkan alur utama acara.

---

## K-23 — 2026-08-29 — Sesi 18: Batch X — menu SOP berdiri sendiri: papan amanah semi-paten + SOP kustom

Dua arahan Ahmed: *"tambahkan menu SOP untuk hal bersifat semi paten, misal SOP daftar
tugas/amanah/khidmah santri dan PICnya yg mudah ceklist jg."* dan *"menu SOP customable"*. Keputusan:

1. **Satu tab "SOP" dengan dua bagian, bukan dua tab baru** — jumlah tab utama menjadi **tujuh** (melebihi
   catatan K-21 poin 4 "tetap enam" secara sadar, karena ini kelompok fitur baru yang setara), tetapi
   pelajaran BUG-U2 dijaga: nav tab dibuat **selalu membungkus** (`sm:flex-wrap`, bukan `sm:flex-nowrap`)
   sehingga tidak ada tab yang keluar batas di lebar mana pun; di ponsel tetap grid 3 kolom (3+3+1).
   Bagian dalam memakai pola sub-nav Pengaturan: **Amanah & Khidmah** dan **SOP Kustom**.
2. **"Semi-paten" = papan baku yang strukturnya relatif tetap tetapi isinya hidup.** Papan baku
   "Amanah & Khidmah Santri" di-seed (11 amanah inti madrasah: imam, muadzin, khatib Jumat, temanasma,
   piket kebersihan, penjaga gudang, tutor halaqah, koperasi, pelayanan wudhu, ronda). Aturannya:
   **tidak dapat dihapus** (`hapusSop` menolak papan `baku`), tetapi item bebas ditambah/ubah/hapus/diurut
   dan PIC diisi pengguna. PIC **tidak dihubungkan ke tabel Divisi** — amanah dipegang nama santri
   (bebas teks), bukan divisi panitia acara; dua domain yang memang berbeda.
3. **Ceklis = boolean + `selesaiPada`** (pola `perubahanStatusTugas`): masuk selesai mengisi waktu,
   keluar menghapusnya — bukan siklus 4 status seperti tugas acara, karena permintaannya "mudah
   ceklist". UI: centang satu klik dengan update **optimis**, bar progres x/y/%, tombol **Reset Ceklis**
   per papan (dialog konfirmasi non-bahaya) untuk pemakaian harian/pekanan.
4. **Idempotensi seed per TANDA `baku`, bukan per judul** — pengguna boleh mengganti judul papan baku
   tanpa memicu seed menanam salinan kedua saat halaman dimuat ulang. `SopView` juga **self-heal**:
   bila papan baku tidak ditemukan (data baru yang belum selesai di-seed — race seed-vs-load — atau
   pemulihan cadangan lama v1), ia menanam sendiri lewat `seedSopAmanah()` yang idempoten.
5. **Salinan SOP me-reset ceklis** — `duplikatSop` menyalin judul "(Salinan)", PIC, urutan, dan isi
   item, tetapi semua centang dikosongkan: salinan adalah awal yang bersih, bukan arsip status lama.
   Salinan papan baku menjadi SOP kustom biasa (`baku: false`).
6. **Cadangan naik ke versi 2 dengan kompatibilitas baca v1** — tabel `tartib_sop`/`tartib_sopItem`
   masuk `IsiCadangan`, statistik, dan pemulihan. `bacaCadangan` menerima berkas **v1** (dibuat sebelum
   tabel SOP ada) dengan bagian SOP dibaca kosong, menolak selain v1/v2, dan mempertahankan `versi`
   sumber pada objek hasil baca. Konsekuensi yang disengaja: memulihkan cadangan v1 tidak membawa SOP —
   papan baku kembali lewat self-heal saat tab SOP dibuka / seed dijalankan ulang.
7. **Cetak lembar ceklis A4** lewat varian `CetakPayload` baru `{ jenis: 'papanSop'; sopId }` (perluasan
   aditif K-04): tabel ☐ / Amanah / PIC / Catatan berbingkai, kop lembaga ikut (`KopCetak`). Blok cetak
   diletakkan **di luar kartu kaca** (jebakan CSS print K-22 poin 3) dan seluruh layar dibungkus
   `print:hidden` saat mencetak. `flushSync` sebelum `host.cetak()` mengikuti pola Batch F/sesi 15.
8. **Skema v4: `baku` sengaja TIDAK diindex** — boolean bukan kunci sah IndexedDB; pemilahan
   papan baku/kustom cukup dengan filter memori (jumlah papan kecil). `urutan` SOP hanya dipakai
   untuk menempelkan duplikat di akhir; daftar kustom diurut dari `urutan`.

---

## K-22 — 2026-08-23 — Sesi 17: CI, ESLint, pemecahan TemplateView, pengingat cadangan — kualitas rekayasa tanpa menyentuh stack runtime

Empat saran audit dikerjakan sekaligus atas arahan Ahmed *"oke kerjakan semuanya secara profesional"*. Keputusan:

1. **ESLint & CI adalah tooling DEV, bukan stack runtime** — BRIEF Bagian 4 (terkunci) mengatur apa yang di-*bundle* aplikasi; linter & workflow tidak ikut ter-bundle sama sekali. Tetap dicatat di sini agar sah sesuai klausa "dilarang tanpa entry DECISIONS". Versi dikunci ke pasangan Next: `eslint@8.57` + `eslint-config-next@14.2.5`.
2. **Aturan bermasalah diperbaiki di sumbernya, bukan dimatikan** — `react/no-unescaped-entities` menemukan 2 kutip telanjang di JSX (EKonfirmasiView, TemplateView); diperbaiki dengan `&quot;`. Nol pengecualian aturan — `.eslintrc.json` hanya berisi `"extends": "next/core-web-vitals"`.
3. **Refactor TemplateView = perpindahan verbatim, nol perubahan perilaku** (1416 → 930 baris; `components/template/{PanelImporTemplate,PanelEksporTemplate,bersama}`). Panel ekspor kini mengambil ulang divisi sendiri via `daftarDivisi()` (sebelumnya bergantung peta induk) agar panel benar-benar mandiri. **Jebakan CSS print yang selamat:** formulir panduan A4 TETAP di TemplateView induk, DI LUAR pembungkus `print:hidden` — memindahkannya ke dalam panel akan membuatnya ikut tersembunyi saat mencetak.
4. **Pengingat cadangan: ambang 14 hari, penanda di localStorage** (`tartib.cadangan.terakhir`, K-21 poin 2 — milik perangkat, TIDAK ikut berkas cadangan; cadangan yang membawa waktu dirinya sendiri aneh). Fungsi murni teruji (6 test): `statusPengingatCadangan` mengembalikan umur hari utuh non-negatif dan `perluIngatkan` untuk "belum pernah" maupun ≥ ambang. UI: status tenang/warning di Pengaturan › Data & Cadangan; waktu tercatat hanya saat unduhan benar-benar terjadi (bukan dibatalkan).
5. **Token semantik baru `peringatan` (= amber)** mengikuti disiplin Batch U — komponen memakai nama semantik, nilai warna cukup diubah dari `tailwind.config.ts`.

## K-21 — 2026-08-22 — Sesi 16: identitas header (ikon kalender-ceklis), tab Pengaturan, dan cadangan data sebagai fitur wajib

Tiga arahan Ahmed: *(1) "ganti headernya dengan gradasi warna, tulisan, icon seperti ini" + gambar referensi*, *(2) "buat tab baru pengaturan, dan tambahkan seting dari saran terbaik kamu, termasuk juga masukkan tab 'tentang' yg ada ke dalam tab pengaturan ini, dan rapikan kembali isinya sesuai data yang ada"*, *(3) "icon LogoTartib.tsx ini tdk pas yg lebih pas, isyarat acara dan kotak centang cek list"*. Keputusan:

1. **Ikon aplikasi = kalender berisi ceklis** (dua tercentang, satu menunggu). Iterasi dokumen+panah-grafik dari gambar referensi dibuang atas koreksi Ahmed: ikon harus membawa dua isyarat produk sekaligus — **acara bertanggal** (kalender) dan **item SOP yang dikerjakan** (kotak centang). Artwork tetap kembar dengan favicon `src/app/icon.svg` (aturan lama dipertahankan). Judul header tetap "Tartib — Pembuat SOP Acara" (arahan Ahmed sesi 15), kata "Tartib —" dibuang dari tagline agar tidak berulang; gradasi header dipertegas sky→emerald.
2. **Pengaturan disimpan di localStorage, BUKAN IndexedDB.** Isinya preferensi milik perangkat (kop cetak, nilai baku porsi), bukan data acara — alasan yang sama dengan client ID Drive (K-18). Konsekuensi yang disengaja: pengaturan **tidak ikut** dalam berkas cadangan data, dan skema Dexie tidak perlu naik versi. `bacaPengaturan` wajib mengembalikan objek sah untuk masukan apa pun (rusak/tipe salah/di luar batas → klem + nilai baku): pengaturan yang tidak terbaca tidak boleh menjatuhkan aplikasi.
3. **Cadangan & pemulihan .json adalah fitur wajib, bukan pelengkap.** Tartib offline penuh tanpa akun (K-09): membersihkan data peramban = seluruh data acara hilang tanpa jejak, dan sampai sesi 16 tidak ada jalan keluar sama sekali. Pemulihan mengganti SELURUH isi basis data dalam satu transaksi (`clear` + `bulkAdd` semua tabel) — separuh terpulihkan lebih berbahaya daripada gagal, dan berkas asing ditolak sebelum menyentuh data (validasi `aplikasi`/`versi`/tiap tabel/`id` tiap baris).
4. **Tab "Tentang" dihapus dari navigasi utama** dan menjadi bagian di dalam tab Pengaturan (sub-navigasi Umum / Data & Cadangan / Tentang). Tautan lama `?view=tentang` **tidak dimatikan** — dipetakan ke Pengaturan dengan bagian Tentang terpilih, tab Pengaturan tetap tersorot. Jumlah tab utama tetap enam (aturan mobile sesi 15: semua tab selalu terlihat).
5. **Isi Tentang harus mencerminkan data & fitur yang benar-benar ada** — daftar kemampuan disusun per tab dan menyebut yang selama ini tak tercatat (impor .docx, ekspor .docx/Drive, cetak panduan A4, cadangan). Angka yang bisa dihitung diambil dari sumbernya (jumlah divisi baku dibaca dari `DIVISI_BAKU`, bukan diketik manual) agar tidak basi diam-diam.
6. **Kop cetak lembaga** dari Pengaturan disisipkan ke SEMUA blok cetak (buku acara, laporan eksekusi, lembar tugas, panduan template) lewat satu komponen `KopCetak` (`print:block`). Kosong = lembar tanpa kop, persis perilaku sebelum sesi 16.
7. **WIP Capacitor Ahmed AKHIRNYA dikomit** atas perintah *"push semua"* — 53 berkas proyek Android (~780 KB) dengan hasil build dikecualikan lewat `.gitignore` yang sudah disiapkan Ahmed sendiri.

## K-20 — 2026-08-22 — Sesi 15: header berlogo; template baku sebagai panduan manual pengisian (cetak A4 + .docx)

Dua arahan Ahmed: header memuat judul + ikon aplikasi; tab Template punya template baku yang bisa diunduh/diekspor dan dicetak sebagai panduan manual pengisian. Keputusan:

1. **Template baku dipilih BERISI TEKS CONTOH, bukan kosong** — setiap item diawali "Contoh:" (17 item, 6 fase H-30…H+1, jenis Custom) supaya dokumen cetak/unduhan sekaligus mengajarkan model data: fase ber-offset, item milik divisi, PIC per tugas. Nama: "SOP Baku (Panduan Manual)".
2. **Seed panduan idempoten PER NAMA**, bukan "hanya bila tabel template kosong" (beda dengan seed template contoh) — supaya template ini muncul juga pada data pengguna yang sudah berisi template lain.
3. **Cetak panduan lewat `host.cetak`** dengan varian `CetakPayload` baru `{ jenis: 'panduanTemplate'; templateId }` (perluasan aditif K-04, pola Batch F: `flushSync` → cetak). Formulir kertas A4: kop template + kolom identitas acara (nama/tanggal Hari-H/lokasi) + per fase kolom tanggal + per item divisi & kolom PIC — garis kosong untuk tulisan tangan. Tombol ada di panel "Ekspor & Cetak Template" dan berlaku untuk template mana pun, bukan hanya template baku.
4. **Header: `LogoTartib`** (SVG inline, squircle candy glass berisi ceklis berprogres; artwork identik favicon `icon.svg`) + judul "Tartib — Pembuat SOP Acara". Rupa **liquid glass** (WIP Ahmed di working tree: token alpha, backdrop-blur, pil) dikomit utuh setelah diverifikasi karena token tetap semantik — keputusan branding masa depan tetap cukup mengubah `tailwind.config.ts`. **WIP Capacitor Ahmed TIDAK ikut dikomit** (menunggu keputusannya sendiri).
5. **Catatan proses:** commit `a7a651f` tanpa sengaja menyertakan UI "Hapus template" milik WIP (fungsi service-nya baru dikomit `0295761`) — pelajaran tercatat: **periksa diff per berkas sebelum `git add`** pada working tree yang memuat pekerjaan orang lain.

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
