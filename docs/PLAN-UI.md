# PLAN-UI — Rencana perbaikan & percantikan tampilan Tartib

> **Status: MENUNGGU PERSETUJUAN EKSEKUSI** — ditulis 2026-08-22 (sesi 9, item 5 Ahmed: *"plan mcp / tool lain untuk perbaiki / percantik uinya"*). Eksekusi dimulai hanya setelah Ahmed menyetujui.

## Latar belakang

Ahmed meminta rencana penggunaan MCP / tool lain untuk memperbaiki dan mempercantik UI Tartib (latar lama: *"spy tampilan ui nya stabil dan sistemnya plus bagus"*). Konteks baru memperkuat urgensi: Tartib kini punya **wajah publik** (https://ugi577.github.io/tartib/), dan kedua aplikasi direncanakan fork dengan nama lain untuk rilis publik — tampilan adalah kesan pertama.

## Alat yang tersedia (tanpa library baru)

| Alat | Peran |
|---|---|
| Skill `browser-use:control-browser` (MCP browser-use) | Buka localhost:3000, navigasi tiap `?view=`, inspeksi DOM, tangkap screenshot sebelum/sesudah |
| Skill `browser-use:web-gui-tester` | Uji hitam-kotak interaktif: klik nyata, isi form, scroll; verifikasi visual lewat screenshot; smoke test regresi tiap view |
| Tailwind 3.4 + `globals.css` | Token desain (warna, tipografi, radius, spacing) di `tailwind.config.ts` — saat ini **kosong** (`theme.extend {}`), warna dipakai inline di komponen |
| Vitest / tsc / `pnpm build` | Regresi fungsional: beautifikasi tidak boleh mematahkan logika (Nihil dianggap bukti) |

## Kendala & aturan

1. **BRIEF Bagian 4** — tidak ada library/UI kit/font baru tanpa persetujuan Ahmed. Rencana ini hanya memakai Tailwind + CSS yang sudah ada.
2. **Static export + routing `?view=`** — tidak ada server, tidak ada route baru; perubahan murni presentasional.
3. **"Nihil dianggap bukti"** — setiap perubahan diverifikasi di browser (screenshot) sebelum diklaim; verifikasi manual Ahmed tetap penutup.
4. **Konvensi PLAN** — tidak commit perubahan UI sebelum verifikasi perangkat fisik; eksekusi memakai batch kecil + commit `feat`/`fix` terpisah per area, Gate UI ditutup dengan pernyataan Ahmed.
5. **Jangan merusak cetak** — `@page A4 14mm` (Gate F) dan bagian `print:block`/`print:hidden` adalah batas keras; beautifikasi layar tidak boleh mengubah dokumen cetak.
6. Satu sesi agen pada repo yang sama; `.claude/` tidak disentuh.

## Audit awal (temuan saat ini)

- `tailwind.config.ts` kosong — **tidak ada token desain**; warna/radius/spacing ditulis inline per komponen (inkonsistensi antar view hampir pasti).
- `globals.css` hanya berisi `@page` cetak — belum ada reset/tipe dasar (ukuran font dasar, warna teks, antarmuka fokus).
- Komponen bersama yang sudah ada: `AppDialog`/`FormDialog`/`KonfirmasiDialog`, `usePagedList`, bar progres ikhtisar, badge fase — kandidat konsistensi pertama.
- View yang diaudit: beranda, template, acara, tamu, evaluasi, tentang + hasil cetak (lembar tugas, buku acara, laporan eksekusi) + dialog + navigasi + tampilan mobile/lebar layar.

## Tahapan eksekusi (setelah disetujui)

1. **Baseline** — `control-browser` ke localhost:3000: screenshot semua view (desktop + mobile), catat inkonsistensi (warna, spasi, ukuran, keterbacaan, elemen terpotong).
2. **Token desain** — tetapkan palet aksen, skala tipografi, radius, spacing di `tailwind.config.ts`; ganti kelas inline di komponen dengan token (perubahan paling berdampak, paling tidak berisiko).
3. **Konsistensi komponen bersama** — dialog, tombol, badge, kartu, bar progres, tabel, input; satu pola untuk status (BELUM/JALAN/SELESAI/BATAL, DRAF/SIAP/BERJALAN/SELESAI/DIEVALUASI).
4. **Per view** — beranda (ringkasan & pintu masuk), template (editor fase/item), acara (papan tugas & progres), tamu (rekap & panel porsi), evaluasi (lembar per divisi), tentang (posisi produk).
5. **Regresi cetak** — verifikasi lembar tugas/buku acara/laporan eksekusi tetap utuh setelah beautifikasi.
6. **Regresi fungsional** — vitest hijau, tsc bersih, `pnpm build` sukses, smoke `web-gui-tester` tiap view (klik CRUD inti).
7. **Bukti** — screenshot sebelum/sesudah per view untuk Ahmed → verifikasi manual → Gate UI ditutup pernyataan Ahmed → commit per batch kecil.

## Di luar scope (butuh keputusan terpisah)

Dark mode, font baru, set ikon baru, UI kit/komponen pihak ketiga, animasi besar — semuanya menuntut persetujuan (BRIEF Bagian 4) dan tidak masuk rencana ini sampai diputuskan.

## Status tracker

- [ ] Disetujui Ahmed untuk eksekusi
- [ ] Baseline & audit (tahap 1)
- [ ] Token desain (tahap 2)
- [ ] Komponen bersama (tahap 3)
- [ ] Per view (tahap 4)
- [ ] Regresi cetak & fungsional (tahap 5–6)
- [ ] Gate UI — verifikasi manual Ahmed
