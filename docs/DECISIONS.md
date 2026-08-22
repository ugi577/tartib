# DECISIONS — Tartib

Log keputusan permanen. **Entry terbaru di ATAS.** Format: `K-xx — tanggal — judul — keputusan`.

---

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
