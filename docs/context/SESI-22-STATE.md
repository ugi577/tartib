# SESI 22 — catatan state berjalan (2026-09-08)

> Berkas ini = jaring pengaman bila sesi agen terputus. Dibaca setelah PROJECT-STATE.md.

## Arahan Ahmed (kutipan)

- "banyak sekali kekacauan di proyek ini, spt header di beberapa menu terlalu besar, fungsi copi paste dll di struktur organisasi, print privew yg tdk mengikuti ukuran kertas sebenarnya, aplikasi ini jg akan direkomendasikan dr menu studio print di proyek mahad app v3 selain defaultnya berdiri sendiri untuk siapapun yg instal"
- "ingat sll amankan proses yg brjalan karena bisa berhenti tiba2 krn limit agen, lanjut"

## Status langkah

- [x] Baseline: tsc bersih, lint bersih, vitest 266/266 (31 berkas), dev server hidup :3000 (pid 36622)
- [x] Checkpoint WIP Ahmed di-commit: `a433b56 wip(kbm): preset KBM pesantren…` (KbmMatriksView, presets, types/kbm, build:apk)
- [ ] Audit multi-agent (workflow `audit-kekacauan-tartib`, run `wf_373059a8-db6`) — hasil akan disalin ke `docs/context/AUDIT-SESI-22.md`
- [ ] Perbaikan per paket (satu commit per paket, verifikasi tsc+lint+vitest tiap paket)
- [ ] Verifikasi browser 375px + 1280px
- [ ] Perbarui PROJECT-STATE.md + PLAN.md changelog

## Temuan awal (sebelum audit, sudah dibaca langsung)

1. `src/app/globals.css` — `@page` ditulis BERSARANG di dalam `body[data-kertas=…]` → CSS tidak valid, ukuran kertas cetak tidak pernah diterapkan (`size: auto` saja).
2. `PrintReadyCanvas.tsx` — lembar `w-[210mm] min-h-[297mm]` tidak diskalakan fit-to-width di HP (transform scale tidak mengubah layout box; zoom hanya `sm:flex`); safe-zone `inset-3.5` = 14px ≈ 3,7mm bukan 10mm.
3. Dua sistem kertas: `SopView` (A4/F4 210×330/Letter/Legal/A5, localStorage `tartib.sop.kertas`, `@page` inline) vs kanvas (`a4|f4 215×330|thermal`).
4. `SopView.tsx` `muat()`/`bukaUbah`/render — hack nama pribadi ("lutfi" → "Yudi Nahyuddin") menulis ulang data pengguna diam-diam. Harus dihapus.
5. `CanvasHubView.tsx` — kop hardcode "PONDOK PESANTREN & MADRASAH TARTIB", tiket thermal dummy "Adrian Maulana"; tidak memakai kop Pengaturan (`KopCetak`).
6. `window.alert/confirm` di `PresetLibraryView.tsx:42`, `KbmMatriksView.tsx:377,443,470,485` — melanggar aturan proyek (KonfirmasiDialog).
7. View `template`, `evaluasi`, `konfirmasi` tidak terjangkau dari nav/beranda (hanya via URL/Cari?).
8. Context menu struktur: shortcut Ctrl+C/X/V/D ditampilkan tanpa handler; potong→tempel memberi akhiran "(Salinan)"; tanpa transaksi; hanya klik kanan (HP tidak bisa); logika duplikat antara PanelItemSop & BaganOrganisasi.
9. Kelas no-op: `animate-in fade-in zoom-in-95`, `active:scale-98`, `animate-fade-in`, `dark:` (tanpa plugin/darkMode).
10. Printer BT/USB "berhasil dicetak" palsu (setTimeout 600ms) + printer simulasi baterai palsu.

## Rancangan paket perbaikan (draft sebelum hasil audit; satu commit per paket)

1. **P1 kejujuran & aturan proyek** — hapus hack nama "lutfi→Yudi" di `sopService.daftarItemSop/daftarSubItemSop` + 4 tempat di `SopView` (muat ×2, bukaUbah, render ×2); ganti `alert/confirm` di `KbmMatriksView` (reset, hapus template, impor gagal) & `PresetLibraryView` dengan `KonfirmasiDialog`/pesan inline; kop kanvas dari Pengaturan (`KopCetak`/`barisKop`) bukan hardcode; tiket thermal tanpa nama dummy (isi dari data papan baku / placeholder netral).
2. **P2 cetak mengikuti kertas** — `types/kbm.ts` `UkuranKertas` → `IdKertas` dari `lib/cetak/kertas.ts`; `globals.css` buang `@page` bersarang (sisakan baku + reset margin `main` saat print); `PrintReadyCanvas`: lembar `width/minHeight` dalam mm dari `dimensiKertas`, padding = margin kertas, safe-zone = tepi padding (bukan 14px), fit-to-width via `useUkuranElemen` + `transform: scale`, wadah tinggi = tinggi×skala, `<style>{aturanPage(...)}</style>` saat cetak, pilihan kertas A4/F4/Letter/Legal/A5/Thermal80/58 + orientasi, preferensi `bacaPilihanKertas`; `CanvasHubView`: bungkus UI layar `print:hidden` kecuali lembar, wadah meja kerja `print:` reset; `SopView` pakai daftar kertas & `aturanPage` yang sama (hapus `UKURAN_KERTAS` lokal + `tartib.sop.kertas`); `webPrinterService.jalankanCetak` → hapus atribut body, jalur BT/USB tidak lagi mengaku berhasil (jatuh ke dialog cetak sistem + pesan jujur).
3. **P3 header kompak** — komponen `HeaderView` (judul `text-lg`, keterangan `text-xs`, slot aksi), `KELAS.judulHalaman` diperkecil; terapkan ke Preset/Kanvas/PIC/KBM/Pengaturan/Template/Acara/Tamu/Evaluasi/e-Konfirmasi; `main` `pt-14`→ sesuai tinggi kontrol melayang; kurangi tumpukan bar di Kanvas (gabung pemilih dokumen + toolbar) & KBM (toolbar 1 baris ringkas + menu "Lainnya").
4. **P4 copy-paste struktur** — service baru di `sopService`: `salinItemDenganSub(itemId, sopIdTujuan, {akhiran?})` & `pindahkanSubItem(subId, itemIdTujuan)` & `pindahkanItem(itemId, sopIdTujuan)` dalam transaksi; satu builder menu `bangunMenuJabatan/bangunMenuTugas` (`lib/struktur/menuStruktur.ts`) dipakai PanelItemSop & BaganOrganisasi; potong = pindah (tanpa "(Salinan)"); shortcut ditampilkan hanya bila handler keydown ada (tambah handler global saat fokus di papan) — atau hapus label shortcut; tombol "⋯" di tiap kartu/baris untuk HP; klip `data: any` → union bertipe; `ContextMenu` buang kelas no-op, hitung tinggi dari pemisah, `role=menuitem`.
5. **P5 navigasi & rapi** — beranda: kartu Template SOP Acara, Evaluasi, e-Konfirmasi kembali; `PemilihIkonManual` buang `dark:`/kelas no-op → token KELAS; `HariKbm` normalisasi Jumat; komentar page.tsx; pecah `SopView.tsx` → `BaganOrganisasi.tsx`, `PanelItemSop.tsx` (verbatim).
6. **P6 verifikasi** — tsc/lint/vitest/build; browser 375px & 1280px tiap view; CSSOM `@page` terpasang saat cetak (cek `<style>` ter-render); update PROJECT-STATE + PLAN changelog v1.31 + DECISIONS K-26.
