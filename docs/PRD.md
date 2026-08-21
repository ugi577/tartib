# PRD — Tartib

**Pembuat SOP Acara** — modul standalone, dapat diintegrasikan ke `mahad-askar-app-v3`.

- Status: **otoritatif** (satu-satunya acuan spesifikasi)
- Sumber: `docs/BRIEF.md` (2026-08-22)
- Dokumen terkait: `docs/DECISIONS.md` (keputusan Terkunci), `docs/PLAN.md` (cara eksekusi), `docs/context/PROJECT-STATE.md` (posisi terkini)

---

## 1. Masalah yang dipecahkan

Buku Panduan SOP Acara sudah ada dalam bentuk dokumen Word dengan dua kelemahan yang tidak bisa diperbaiki dengan mengedit dokumen:

1. **Ceklis tanpa nama** — PJ bukhur tidak ada, pengatur sandal tidak ada, tukang parkir tidak terkoordinasi. Bukan kekurangan orang, melainkan **tidak ada nama di sebelah pekerjaannya**. Dokumen Word tidak bisa memaksa kolom PIC terisi; aplikasi bisa.
2. **Umpan balik yang tidak pernah kembali** — temuan evaluasi ditulis lalu berhenti di sana; tahun berikutnya panitia memulai dari dokumen yang sama dan mengulang kesalahan yang sama.

**Inti aplikasi** — bukan sekadar memindahkan ceklis ke layar:

1. **PIC wajib** — ditegakkan sebagai aturan sistem, bukan imbauan.
2. **Evaluasi naik ke Template** — temuan satu acara menjadi ceklis acara berikutnya.

Selebihnya (kalkulator porsi, linimasa, cetak) adalah pelengkap.

---

## 2. Lingkup

### 2.1 Yang dikerjakan

| Kemampuan | Keterangan |
|---|---|
| Template per jenis acara | Tasyakuran khatam, maulid, haflah, wisuda, dauroh, rapat wali santri, PHBI, custom |
| Template berversi | Ubah template tidak mengubah acara yang sedang berjalan |
| Linimasa fleksibel | Fase (H-30 … H+1) adalah **data**, bukan enum keras — template kecil boleh hanya H-7 sampai H+1 |
| Divisi & PIC | 13 divisi baku, boleh tambah; **PIC wajib sebelum acara berstatus SIAP** |
| Tugas per fase | Materialisasi dari template, status: belum / jalan / selesai / batal |
| Kelompok tamu & RSVP | Termasuk **jumlah rombongan** per konfirmasi |
| Kalkulator porsi | Rumus di bagian 5.4 |
| Ceklis perlengkapan | Jumlah dihitung otomatis dari porsi |
| Evaluasi H+1 | Per divisi: berjalan baik / kurang / usulan |
| **Promosi usulan → template** | Usulan evaluasi menjadi item template versi berikutnya |
| Cetak & ekspor | HTML A4 siap cetak, ekspor Markdown, **lembar tugas per PIC** |
| Offline penuh | Tanpa jaringan sama sekali |

### 2.2 Yang TIDAK dikerjakan (backlog — jangan disentuh)

- Sinkronisasi antar perangkat
- Notifikasi/pengingat otomatis
- Manajemen anggaran & keuangan acara
- Undangan digital / RSVP daring
- Multi-bahasa
- Akun & hak akses

> **Aturan Ahmed:** fitur di luar daftar masuk **backlog**, tidak dikerjakan. Anti-pattern **"Andai ada"** — parkir, jangan bangun.

---

## 3. Tumpukan teknologi (Terkunci)

Ikut persis `mahad-askar-app-v3`, tanpa penambahan:

- **Next.js 14** App Router, `output: 'export'` (static)
- **TypeScript strict** — `as any` dilarang, tanpa kecuali
- **Dexie** (IndexedDB)
- **Tailwind**
- **Capacitor** (Android) — menyusul, bukan di batch awal
- **Vitest** untuk unit test
- Routing **query param saja** — `?m=tartib&view=acara&id=...`

**Dilarang tanpa entry DECISIONS:** state manager tambahan, ORM lain, UI kit, date library berat (pakai `Intl` + util sendiri), form library.

### Pola wajib dari v2/v3

- `<AppDialog>` untuk **semua** dialog — tidak ada `window.confirm`
- `usePagedList` untuk semua daftar
- **Semua tulis DB lewat service layer** — komponen tidak menyentuh Dexie langsung
- Rupiah sebagai **integer**
- `lib/license.ts` dengan `isPremium()` selalu `true` selama pengembangan; kandidat premium dicatat di `PREMIUM-CANDIDATES.md`

---

## 4. Keputusan Terkunci (ringkasan)

Detail lengkap di `docs/DECISIONS.md` (entry terbaru di atas).

| ID | Keputusan |
|---|---|
| K-01 | Nama modul: `tartib` |
| K-02 | Semua tabel Dexie berawalan `tartib_` |
| K-03 | Acara menyimpan **snapshot template**, bukan referensi hidup |
| K-04 | `TartibHost` satu-satunya batas integrasi; modul tidak mengimpor apa pun dari v3 |
| K-05 | Fase adalah **data**, bukan enum keras |
| K-06 | Aturan PIC wajib ditegakkan di **service layer**, bukan UI |
| K-07 | Routing query param saja (konsekuensi static export) |
| K-08 | Bahasa antarmuka: Indonesia; istilah pesantren dipertahankan |
| K-09 | Offline penuh — tidak ada pemanggilan jaringan di jalur mana pun |
| K-10 | Integrasi dengan cara **salin folder**, bukan monorepo |

---

## 5. Model Data & Aturan

### 5.1 Tabel

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

### 5.2 Status

- **`status` acara:** `DRAF` → `SIAP` → `BERJALAN` → `SELESAI` → `DIEVALUASI`
- **`status` tugas:** `BELUM` → `JALAN` → `SELESAI` | `BATAL`
- **`status` rsvp:** `BELUM` | `HADIR` | `TIDAK_HADIR`

### 5.3 Empat aturan yang tidak boleh dilanggar

**A-01 — PIC wajib sebelum SIAP.**
Bila ada baris `tartib_acaraDivisi` yang divisinya punya minimal satu tugas, dan `picNama` kosong → status tidak boleh naik ke `SIAP`. Ini **inti aplikasi**; wajib ada test.

**A-02 — Snapshot template bersifat sekali.**
Setelah acara dibuat, tidak ada jalur kode yang membaca `tartib_templateItem` untuk acara itu. Verifikasi: cari referensi silang saat audit gate.

**A-03 — Promosi evaluasi membuat versi template BARU.**
Tidak pernah menimpa versi lama. Versi lama tetap ada karena masih dirujuk acara terdahulu.

**A-04 — Rumus qty tersimpan sebagai string ekspresi terbatas**, dievaluasi oleh parser sendiri — **bukan `eval`**. Token yang diizinkan: `porsi`, `santri`, `panitia`, `rsvp`, angka, `+ - * /`, `ceil()`, `round()`.

### 5.4 Kalkulator porsi

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

**Fixture uji — angka nyata 21 Agustus 2026:** rsvp 130, santri 47, panitia 20, cadangan 10

- porsi = ceil(130 × 1,25) + 47 + 20 + 10 = 163 + 77 = **240**
- peralatan dengan tim pencuci = ceil(240 × 0,6) = **144**
- tanpa tim pencuci = ceil(240 × 1,1) = **264**

Angka-angka ini menjadi **fixture test Batch D**.

### 5.5 Adapter host

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

## 6. Definisi Selesai

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

Langkah 9 adalah pembuktian bahwa aplikasi menyelesaikan masalah Bagian 1. Tanpa langkah itu, ini hanya ceklis di layar.

---

## 7. Anti-pattern yang berlaku

| Nama | Penerapan di proyek ini |
|---|---|
| **Rebuild whitelist** | Jangan menulis ulang modul yang sudah jalan hanya karena terasa rapi. Perbaiki di tempat. |
| **Deklarasi dianggap data** | Template adalah deklarasi; **tugas** adalah data. Panitia bekerja dari tugas. Lihat K-03. |
| **Nihil dianggap bukti** | Test hijau bukan bukti fitur jalan. Gate UI hanya ditutup setelah Ahmed memverifikasi di perangkat fisik. |
| **`as any` menutupi mata** | Nol toleransi. Bila tipe menyulitkan, perbaiki tipenya. |

---

*Dokumen ini otoritatif. Perubahan spesifikasi wajib melalui entry baru di `docs/DECISIONS.md`, lalu PRD diperbarui.*
