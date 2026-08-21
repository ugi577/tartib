# INSTRUKSI SESI BARU — APLIKASI **TARTIB**
## Pembuat SOP Acara, berdiri sendiri & dapat diintegrasikan ke `mahad-askar-app-v3`

> **Cara pakai berkas ini:** simpan sebagai `docs/BRIEF.md` di repo baru, lalu jalankan prompt kickoff di Bagian 1. Sesi pertama bertugas menulis dokumen jangkar dari isi berkas ini — belum menulis kode fitur.

---

# BAGIAN 1 — PROMPT KICKOFF

Buat repo dulu:

```fish
mkdir -p ~/dev/tartib; and cd ~/dev/tartib
git init; and mkdir -p docs/context
# salin berkas ini ke docs/BRIEF.md
git add -A; and git commit -m "chore: brief awal Tartib"
clo
```

Lalu tempel prompt berikut:

```
Baca docs/BRIEF.md seluruhnya.

SESI 0 — DOCS ONLY, JANGAN TULIS KODE FITUR.

Tugas sesi ini:
1. Tulis docs/PRD.md dari Bagian 3-6 BRIEF (spesifikasi otoritatif
   + keputusan Terkunci + backlog).
2. Tulis docs/PLAN.md dari Bagian 7 — batch A sampai G, tiap
   sub-langkah menyebut file & fungsi konkret, tiap batch punya
   Gate checklist, ada protokol blocker, konvensi commit, dan
   changelog PLAN sendiri.
3. Tulis docs/DECISIONS.md dari Bagian 5 (keputusan Terkunci),
   entry terbaru di ATAS.
4. Tulis docs/context/PROJECT-STATE.md — posisi awal.
5. Scaffold Next.js 14 + TypeScript strict + Dexie + Tailwind,
   static export, TANPA fitur. Pastikan `pnpm tsc --noEmit` dan
   `pnpm vitest run` hijau di repo kosong.
6. Commit per langkah.

Shell = Fish (JANGAN heredoc), tulis file via file tool, jangan
install library di luar yang tercantum di BRIEF Bagian 4.
Kalau limit/blocker: commit WIP + tulis blocker di PROJECT-STATE
(Batch/Progress/Next step presisi/Files touched) lalu berhenti.
```

**Routing model:** Sesi 0 dan Batch A dengan `clo` effort **high** (keputusan skema). Batch B, D, F boleh `glm`/`cc-deep` effort **lo**. Batch C, E, G kembali ke `clo` — di situ letak aturan yang tidak boleh salah.

---

# BAGIAN 2 — MASALAH YANG DIPECAHKAN

Buku Panduan SOP Acara sudah ada dalam bentuk dokumen Word. Dokumen itu punya dua kelemahan yang tidak bisa diperbaiki dengan mengedit dokumen:

**Pertama, ceklis tanpa nama.** Temuan utama evaluasi 21 Agustus 2026: PJ bukhur tidak ada, pengatur sandal tidak ada, tukang parkir tidak terkoordinasi. Semuanya bukan kekurangan orang, melainkan **tidak ada nama di sebelah pekerjaannya.** Dokumen Word tidak bisa memaksa kolom PIC terisi. Aplikasi bisa.

**Kedua, umpan balik yang tidak pernah kembali.** Kalimat penutup buku itu: *"SOP yang tidak pernah berubah artinya tidak pernah dipakai."* Di Word, temuan evaluasi ditulis lalu berhenti di sana. Tahun berikutnya panitia memulai dari dokumen yang sama dan mengulang kesalahan yang sama.

**Maka dua hal inilah inti aplikasi ini**, bukan sekadar memindahkan ceklis ke layar:

1. **PIC wajib** — ditegakkan sebagai aturan sistem, bukan imbauan
2. **Evaluasi naik ke Template** — temuan satu acara menjadi ceklis acara berikutnya

Selebihnya (kalkulator porsi, linimasa, cetak) adalah pelengkap.

---

# BAGIAN 3 — LINGKUP

## Yang dikerjakan

| Kemampuan | Keterangan |
|---|---|
| Template per jenis acara | Tasyakuran khatam, maulid, haflah, wisuda, dauroh, rapat wali santri, PHBI, custom |
| Template berversi | Ubah template tidak mengubah acara yang sedang berjalan |
| Linimasa fleksibel | Fase (H-30 … H+1) adalah **data**, bukan enum keras — template kecil boleh hanya H-7 sampai H+1 |
| Divisi & PIC | 13 divisi baku, boleh tambah; **PIC wajib sebelum acara berstatus SIAP** |
| Tugas per fase | Materialisasi dari template, status: belum / jalan / selesai / batal |
| Kelompok tamu & RSVP | Termasuk **jumlah rombongan** per konfirmasi |
| Kalkulator porsi | Rumus di Bagian 6 |
| Ceklis perlengkapan | Jumlah dihitung otomatis dari porsi |
| Evaluasi H+1 | Per divisi: berjalan baik / kurang / usulan |
| **Promosi usulan → template** | Usulan evaluasi menjadi item template versi berikutnya |
| Cetak & ekspor | HTML A4 siap cetak, ekspor Markdown, **lembar tugas per PIC** |
| Offline penuh | Tanpa jaringan sama sekali |

## Yang TIDAK dikerjakan (backlog, jangan disentuh)

- Sinkronisasi antar perangkat
- Notifikasi/pengingat otomatis
- Manajemen anggaran & keuangan acara
- Undangan digital / RSVP daring
- Multi-bahasa
- Akun & hak akses

> Aturan Ahmed berlaku: fitur di luar daftar ini masuk **backlog PRD**, tidak dikerjakan. Anti-pattern **"Andai ada"** — parkir, jangan bangun.

---

# BAGIAN 4 — TUMPUKAN TEKNOLOGI (TERKUNCI)

Ikut persis `mahad-askar-app-v3`, tanpa penambahan:

- **Next.js 14** App Router, `output: 'export'` (static)
- **TypeScript strict** — `as any` dilarang, tanpa kecuali
- **Dexie** (IndexedDB)
- **Tailwind**
- **Capacitor** (Android) — menyusul, bukan di batch awal
- **Vitest** untuk unit test
- Routing **query param saja** — `?m=tartib&view=acara&id=...`

**Dilarang tanpa entry DECISIONS:** state manager tambahan, ORM lain, UI kit, date library berat (pakai `Intl` + util sendiri), form library.

## Pola wajib dari v2/v3

- `<AppDialog>` untuk **semua** dialog — tidak ada `window.confirm`
- `usePagedList` untuk semua daftar
- **Semua tulis DB lewat service layer** — komponen tidak menyentuh Dexie langsung
- Rupiah sebagai **integer**
- `lib/license.ts` dengan `isPremium()` selalu `true` selama pengembangan; kandidat premium dicatat di `PREMIUM-CANDIDATES.md`

---

# BAGIAN 5 — KEPUTUSAN TERKUNCI

Salin apa adanya ke `docs/DECISIONS.md`.

**K-01 — Nama modul: `tartib`.** Istilah "tartib acara" sudah dikenal di lingkungan pesantren, dan maknanya penyusunan/pengurutan. Sejalan dengan penamaan proyek lain (Turjuman, Syajarah, Sima'i).

**K-02 — Semua tabel Dexie berawalan `tartib_`.** Skema v3 sudah di v37; awalan mencegah tabrakan saat penggabungan.

**K-03 — Acara menyimpan SNAPSHOT template, bukan referensi hidup.** Saat acara dibuat, seluruh item template disalin ke tabel tugas. Perubahan template sesudahnya **tidak** mengubah acara yang berjalan. Alasan: acara yang sedang disiapkan tidak boleh berubah diam-diam. Ini penerapan langsung anti-pattern **"Deklarasi dianggap data"** — yang jadi pegangan panitia adalah tugas yang tersalin, bukan definisi template.

**K-04 — `TartibHost` adalah satu-satunya batas integrasi.** Modul **tidak boleh** mengimpor apa pun dari v3. Kebutuhan data luar (jumlah santri, daftar cabang, cetak) lewat adapter. Standalone memakai `standaloneHost`, v3 memakai `mahadHost`.

**K-05 — Fase adalah data, bukan enum keras.** Tiap template mendefinisikan fasenya sendiri (label + offset hari). Alasan: temuan Ahmed — *"undangan idealnya dua pekan, tapi bila SOP matang sepuluh hari pun cukup."* Linimasa harus bisa dipendekkan tanpa mengubah kode.

**K-06 — Aturan PIC wajib ditegakkan di service layer, bukan UI.** `acaraService.setStatus(id, 'SIAP')` melempar `PicBelumLengkapError` bila ada divisi bertugas tanpa PIC. UI hanya menampilkan pesannya. Alasan: aturan yang hanya dijaga UI akan bocor lewat impor, seed, atau jalur lain.

**K-07 — Routing query param saja.** Konsekuensi `output: 'export'`.

**K-08 — Bahasa antarmuka: Indonesia.** Istilah pesantren dipertahankan apa adanya (ikhtilath, musyrif, tasmi'), tidak diterjemahkan.

**K-09 — Offline penuh.** Tidak ada pemanggilan jaringan di jalur mana pun. Bila suatu fitur menuntut jaringan, fitur itu masuk backlog.

**K-10 — Integrasi dengan cara salin folder, bukan monorepo.** `src/tartib/` portabel; integrasi = salin folder ke v3 + sediakan `mahadHost` + naikkan versi Dexie. Alasan: menghindari tooling monorepo untuk satu modul.

---

# BAGIAN 6 — MODEL DATA & ATURAN

## Tabel

```ts
// src/tartib/db/schema.ts
tartib_jenisAcara   { id, nama, deskripsi, aktif }
tartib_template     { id, jenisAcaraId, versi, nama, catatan, dibuatPada, aktif }
tartib_fase         { id, templateId, urutan, label, offsetHari }   // offsetHari: -30, -7, 0, +1
tartib_templateItem { id, templateId, faseId, divisiId, judul, catatan,
                      wajib, rumusQty?, urutan }
tartib_divisi       { id, nama, tanggungJawab, urutan, baku }

tartib_acara        { id, nama, jenisAcaraId, templateId, templateVersi,
                      tanggal, jamMulai, jamSelesai, lokasi, cabangId?,
                      status, dibuatPada }
tartib_acaraDivisi  { id, acaraId, divisiId, picNama, picKontak, catatan }
tartib_tugas        { id, acaraId, faseId, divisiId, judul, catatan,
                      wajib, status, selesaiPada?, urutan }

tartib_kelompokTamu { id, acaraId, nama, targetUndangan, catatan }
tartib_rsvp         { id, acaraId, kelompokId, namaTamu, kontak,
                      status, jumlahRombongan, catatan }

tartib_perlengkapan { id, acaraId, divisiId, nama, satuan,
                      qtyHitung, qtyFinal, status, catatan }

tartib_evaluasi     { id, acaraId, divisiId, berjalanBaik, kurang,
                      usulan, sudahDipromosikan }
```

**`status` acara:** `DRAF` → `SIAP` → `BERJALAN` → `SELESAI` → `DIEVALUASI`

**`status` tugas:** `BELUM` → `JALAN` → `SELESAI` | `BATAL`

**`status` rsvp:** `BELUM` | `HADIR` | `TIDAK_HADIR`

## Empat aturan yang tidak boleh dilanggar

**A-01 — PIC wajib sebelum SIAP.**
Bila ada baris `tartib_acaraDivisi` yang divisinya punya minimal satu tugas, dan `picNama` kosong → status tidak boleh naik ke `SIAP`. Ini **inti aplikasi**; wajib ada test.

**A-02 — Snapshot template bersifat sekali.**
Setelah acara dibuat, tidak ada jalur kode yang membaca `tartib_templateItem` untuk acara itu. Verifikasi: cari referensi silang saat audit gate.

**A-03 — Promosi evaluasi membuat versi template BARU.**
Tidak pernah menimpa versi lama. Versi lama tetap ada karena masih dirujuk acara terdahulu.

**A-04 — Rumus qty tersimpan sebagai string ekspresi terbatas**, dievaluasi oleh parser sendiri — **bukan `eval`**. Token yang diizinkan: `porsi`, `santri`, `panitia`, `rsvp`, angka, `+ - * /`, `ceil()`, `round()`.

## Kalkulator porsi

```ts
// src/tartib/lib/porsi.ts
export function hitungPorsi(i: {
  rsvpHadir: number;        // jumlah rombongan terkonfirmasi
  jumlahSantri: number;     // dari host
  jumlahPanitia: number;
  cadangan?: number;        // default 10
  bufferPersen?: number;    // default 25
}): number

export function hitungPeralatan(porsi: number, adaTimPencuci: boolean): number
// adaTimPencuci  → ceil(porsi * 0.6)
// tanpa pencuci  → ceil(porsi * 1.1)
```

**Uji dengan angka nyata 21 Agustus 2026:** rsvp 130, santri 47, panitia 20, cadangan 10
→ porsi = ceil(130 × 1,25) + 47 + 20 + 10 = 163 + 77 = **240**
→ peralatan dengan tim pencuci = ceil(240 × 0,6) = **144**
→ tanpa tim pencuci = ceil(240 × 1,1) = **264**

Angka-angka ini menjadi **fixture test** Batch D.

## Adapter host

```ts
// src/tartib/host/TartibHost.ts
export interface TartibHost {
  db: Dexie;
  getCabangList(): Promise<{ id: string; nama: string }[]>;
  getJumlahSantri(cabangId?: string): Promise<number>;
  cariPetugas(q: string): Promise<{ id: string; nama: string; kontak?: string }[]>;
  cetak(payload: CetakPayload): Promise<void>;
}
```

- **`standaloneHost`** — Dexie sendiri (`tartib-db`), cabang & santri diisi manual, `cetak` memakai `window.print()`
- **`mahadHost`** (dibuat di Batch G, di dalam repo v3) — memakai Dexie v3, membaca tabel santri/cabang v3, `cetak` lewat Studio Print

---

# BAGIAN 7 — RENCANA BATCH

Tiap batch: branch sendiri, commit kecil per sub-langkah, gate ditutup hanya dengan pernyataan eksplisit Ahmed untuk butir verifikasi manual.

## Batch A — Fondasi & skema · `clo` high

1. `src/tartib/types/index.ts` — seluruh tipe dari Bagian 6
2. `src/tartib/db/schema.ts` — definisi tabel + versi Dexie
3. `src/tartib/db/seed.ts` — 13 divisi baku + 1 jenis acara + 1 template contoh (Tasyakuran Khatam) dengan fase H-30…H+1
4. `src/tartib/host/TartibHost.ts` + `standaloneHost.ts`
5. `src/tartib/lib/porsi.ts` + test
6. `src/tartib/lib/rumusQty.ts` — parser terbatas + test (termasuk kasus tolak: `eval`, pemanggilan fungsi asing)

**Gate A**
- [ ] `pnpm tsc --noEmit` bersih, nol `as any`
- [ ] `pnpm vitest run` hijau
- [ ] Seed menghasilkan 13 divisi + template contoh utuh
- [ ] Test porsi lulus dengan fixture 21 Agustus (240 / 144 / 264)
- [ ] Parser rumus menolak input berbahaya — ada test
- [ ] Tidak ada satu pun impor dari luar `src/tartib/` selain React & Dexie

## Batch B — Template CRUD · `glm`/`cc-deep` lo

1. `services/templateService.ts` — buat, duplikat, versi baru, arsip
2. `services/divisiService.ts`
3. Halaman `?view=template` — daftar + editor fase + editor item
4. `<AppDialog>` untuk semua konfirmasi

**Gate B**
- [ ] Template dapat dibuat, diduplikat, dan diversikan
- [ ] Fase dapat ditambah/urut ulang/hapus
- [ ] Item template terikat fase & divisi
- [ ] Versi lama tetap terbaca setelah versi baru dibuat
- [ ] Verifikasi manual Ahmed di perangkat fisik

## Batch C — Acara, tugas & aturan PIC · `clo` high ▲

1. `services/acaraService.ts` — `buatDariTemplate()` melakukan **snapshot**
2. `services/tugasService.ts`
3. `services/acaraDivisiService.ts` — penetapan PIC
4. **`acaraService.setStatus()` menegakkan A-01**, melempar `PicBelumLengkapError`
5. Halaman `?view=acara` — papan tugas per fase, tanggal nyata dihitung dari `tanggal - offsetHari`
6. Indikator kesiapan: berapa divisi belum ber-PIC

**Gate C**
- [ ] Acara dibuat dari template → seluruh item tersalin sebagai tugas
- [ ] Mengubah template **tidak** mengubah acara yang sudah dibuat — ada test
- [ ] `setStatus('SIAP')` gagal bila ada divisi bertugas tanpa PIC — ada test
- [ ] Tanggal tiap fase terhitung benar dari tanggal acara
- [ ] Tidak ada jalur kode yang membaca `templateItem` untuk acara berjalan
- [ ] Verifikasi manual Ahmed di perangkat fisik

## Batch D — Tamu, porsi, perlengkapan · `cc-deep` lo

1. `services/tamuService.ts` — kelompok tamu, RSVP, **jumlah rombongan**
2. Halaman `?view=tamu` — rekap per kelompok: diundang / konfirmasi / total orang
3. `services/perlengkapanService.ts` — generate dari `rumusQty` template
4. Panel porsi: menampilkan komponen perhitungan, bukan hanya hasil

**Gate D**
- [ ] RSVP mencatat rombongan; rekap kelompok benar
- [ ] Porsi terhitung sesuai fixture 21 Agustus
- [ ] Peralatan berubah saat opsi tim pencuci ditoggle
- [ ] Qty perlengkapan boleh ditimpa manual (`qtyFinal`), asalnya tetap tersimpan

## Batch E — Evaluasi & umpan balik · `clo` high ▲

1. `services/evaluasiService.ts`
2. Halaman `?view=evaluasi` — per divisi: berjalan baik / kurang / usulan
3. **`promosikanUsulan(evaluasiId, templateId)`** → membuat versi template baru berisi item tambahan
4. Penanda `sudahDipromosikan` agar tidak ganda

**Gate E**
- [ ] Siklus penuh terbukti: acara → evaluasi → promosi → acara baru memuat item hasil promosi
- [ ] Promosi membuat **versi baru**, versi lama utuh — ada test
- [ ] Usulan yang sudah dipromosikan tidak bisa dipromosikan lagi
- [ ] Verifikasi manual Ahmed

## Batch F — Cetak & ekspor · `glm` lo

1. `lib/cetak/lembarTugas.ts` — **satu halaman per PIC**, berisi hanya tugas divisinya
2. `lib/cetak/bukuAcara.ts` — SOP lengkap satu acara, A4
3. `lib/ekspor/markdown.ts`
4. Tombol cetak lewat `host.cetak()`

**Gate F**
- [ ] Lembar tugas per PIC tercetak, satu halaman per orang
- [ ] Buku acara A4 rapi, tidak ada teks menembus batas
- [ ] Ekspor Markdown dapat dibuka ulang
- [ ] **Ahmed mencetak fisik dan menyatakan lulus**

## Batch G — Integrasi v3 · `clo` xhigh ▲

Dikerjakan **di repo v3**, bukan di repo tartib.

1. Salin `src/tartib/` ke v3
2. `mahadHost.ts` — implementasi terhadap Dexie & tabel v3
3. Naikkan versi skema Dexie v3 + migrasi (hanya menambah tabel `tartib_*`)
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

# BAGIAN 8 — PENJAGA

## Anti-pattern yang berlaku

| Nama | Penerapan di proyek ini |
|---|---|
| **Rebuild whitelist** | Jangan menulis ulang modul yang sudah jalan hanya karena terasa rapi. Perbaiki di tempat. |
| **Deklarasi dianggap data** | Template adalah deklarasi; **tugas** adalah data. Panitia bekerja dari tugas. Lihat K-03. |
| **Nihil dianggap bukti** | Test hijau bukan bukti fitur jalan. Gate UI hanya ditutup setelah Ahmed memverifikasi di perangkat fisik. |
| **`as any` menutupi mata** | Nol toleransi. Bila tipe menyulitkan, perbaiki tipenya. |

## Aturan keras

- Tidak ada dua sesi agent bersamaan pada repo yang sama
- Tidak commit perubahan UI sebelum verifikasi perangkat fisik
- `PROJECT-STATE.md` dibaca **pertama** dan diperbarui **terakhir**, tanpa kecuali — WIP pun di-commit
- Model non-Claude yang menawarkan refactor di luar PLAN → **tolak, arahkan balik ke PLAN**
- Error yang sama gagal diperbaiki 2× → berhenti, lapor Ahmed dengan hipotesis dan yang sudah dicoba

## Seed 13 divisi baku

```
1  Ketua Panitia          — keputusan akhir, penghubung ke Mudir
2  Sekretaris             — surat, undangan, rekap konfirmasi, buku tamu
3  Bendahara              — anggaran, belanja, amplop, laporan
4  Acara & MC             — rundown, gladi, koordinasi pengisi acara
5  Konsumsi               — masak, hidang, peralatan makan, pencucian
6  Perlengkapan & Sound   — tenda, karpet, kursi, sound, listrik, genset
7  Penerima Tamu          — sambutan pintu, antar ke tempat duduk, buku tamu
8  Parkir & Sandal        — pengaturan kendaraan, rak sandal, penomoran
9  Kebersihan             — tempat sampah, sapu keliling
10 Dokumentasi & Live     — foto, video, streaming
11 Kesehatan              — P3K, obat dasar, nomor klinik
12 Koordinator Jamaah Putri — tempat duduk, ketenangan, konsumsi area putri
13 Aroma & Suasana        — bukhur, arang, pengharum, ventilasi
```

Sumber item template contoh: **Buku Panduan SOP Acara Ma'had Askar Qur'an**, Bagian 3 (linimasa) dan Bagian 4 (ceklis perlengkapan).

---

# BAGIAN 9 — DEFINISI SELESAI

Aplikasi dinyatakan siap pakai bila **satu acara nyata dapat dijalankan penuh dari dalamnya**, dari pembuatan sampai evaluasi:

1. Buat acara dari template Tasyakuran Khatam
2. Tetapkan PIC seluruh divisi — coba naikkan ke SIAP dengan satu PIC kosong, **harus ditolak**
3. Isi kelompok tamu dan RSVP berombongan
4. Porsi dan perlengkapan terhitung, boleh ditimpa manual
5. Cetak lembar tugas per PIC, bagikan ke panitia
6. Jalankan acara, centang tugas dari HP dalam keadaan offline
7. Isi evaluasi H+1
8. Promosikan satu usulan → template naik versi
9. Buat acara berikutnya → **item hasil promosi sudah ada di sana**

Langkah 9 adalah pembuktian bahwa aplikasi ini memang menyelesaikan masalah yang Bagian 2 sebutkan. Tanpa langkah itu, ini hanya ceklis di layar.
