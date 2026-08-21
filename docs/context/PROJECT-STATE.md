# PROJECT-STATE — Tartib

> **Dibaca PERTAMA, diperbarui TERAKHIR** — tanpa kecuali. WIP pun di-commit.

## Posisi

- **Tanggal:** 2026-08-22
- **Sesi:** 1 — Batch A (fondasi & skema) — **IMPLEMENTASI SELESAI, MENUNGGU VERIFIKASI AHMED + TUTUP GATE A**
- **Repo:** `/Users/ahmad/Projects/tartib-app` — path dipindah dari `~/dev/tartib` (keputusan user, 2026-08-22)
- **Branch:** `batch-a-fondasi-skema` (bercabang dari `master`; merge menunggu Gate A ditutup)

## Progress

- [x] `docs/BRIEF.md` — brief disalin (409 baris), commit `chore: brief awal Tartib`
- [x] `docs/PRD.md` — spesifikasi otoritatif dari BRIEF Bagian 3–6
- [x] `docs/PLAN.md` — batch A–G, gate checklist, protokol blocker, konvensi commit
- [x] `docs/DECISIONS.md` — K-01 s/d K-10 (entry terbaru di atas)
- [x] Scaffold Next.js 14 + TS strict + Dexie + Tailwind + Vitest, static export, tanpa fitur
- [x] Batch A — fondasi & skema (6 sub-langkah, semua commit `feat(tartib)`)

## Batch A — hasil

1. `src/tartib/types/index.ts` — 12 tipe domain + union `StatusAcara`/`StatusTugas`/`StatusRsvp`/`StatusPerlengkapan`
2. `src/tartib/db/schema.ts` — `TartibDb extends Dexie` (`tartib-db`, versi 1), 12 tabel `tartib_*` berindex, `buatId()`, singleton `tartibDb`
3. `src/tartib/db/seed.ts` — `seedDivisiBaku()` (13, BRIEF Bagian 8), `seedJenisAcara()` (8), `seedTemplateContoh()` (Tasyakuran Khatam, fase H-30/H-7/H-0/H+1, 33 item), `jalankanSeed()`; data murni diekspor & idempotent
4. `src/tartib/host/TartibHost.ts` + `standaloneHost.ts` — satu-satunya batas integrasi (K-04); `cetak` = `window.print()`
5. `src/tartib/lib/porsi.ts` — `hitungPorsi` (aritmetika integer, fixture 240 ✓) + `hitungPeralatan` (144/264 ✓)
6. `src/tartib/lib/rumusQty.ts` — parser terbatas tanpa `eval` (A-04): variabel porsi/santri/panitia/rsvp, `+ - * /`, kurung, `ceil`/`round`; selain itu `RumusError`

## Gate A — status

- [x] `pnpm tsc --noEmit` bersih, nol `as any` (grep terverifikasi)
- [x] `pnpm vitest run` hijau — 30/30 (scaffold 1, porsi 8, rumusQty 10, seed 11)
- [x] Seed: 13 divisi + 8 jenis + template contoh utuh — diuji lewat data murni (isi IndexedDB menunggu verifikasi manual Ahmed)
- [x] Test porsi lulus fixture 21 Agustus (240 / 144 / 264)
- [x] Parser rumus menolak input berbahaya — 10 test (`eval`, `alert`, `Math.ceil`, `fetch`, `porsi[0]`, arity, pembagian nol, dll.)
- [x] Tidak ada impor dari luar `src/tartib/` selain React & Dexie — grep: hanya `dexie`; `vitest` hanya di file test
- [ ] **Verifikasi manual Ahmed:** buka `pnpm dev` → seed menulis 13 divisi + template contoh ke IndexedDB, lalu tutup Gate A + merge ke `master`

## Next step (presisi)

Setelah Gate A ditutup: Batch B — CRUD acara sederhana + snapshot tugas (K-03) + aturan PIC-wajib (A-01), branch `batch-b-crud-acara`. Rincian di `docs/PLAN.md` Batch B.

## Files touched (Batch A)

- `src/tartib/types/index.ts`, `src/tartib/db/schema.ts`, `src/tartib/db/seed.ts`, `src/tartib/db/seed.test.ts`, `src/tartib/host/TartibHost.ts`, `src/tartib/host/standaloneHost.ts`, `src/tartib/lib/porsi.ts`, `src/tartib/lib/porsi.test.ts`, `src/tartib/lib/rumusQty.ts`, `src/tartib/lib/rumusQty.test.ts`
- `docs/PLAN.md` (changelog v1.1), `docs/context/PROJECT-STATE.md`

## Riwayat commit (Batch A)

- `a2fcaad` feat(tartib): tipe domain Tartib (Batch A-1)
- `cc8a5e1` feat(tartib): skema Dexie tartib-db versi 1 (Batch A-2)
- `9d47bd7` feat(tartib): seed divisi baku, jenis acara, template contoh (Batch A-3)
- `d73a694` feat(tartib): interface TartibHost + standaloneHost (Batch A-4)
- `07dba4d` feat(tartib): kalkulator porsi & peralatan dengan fixture 240/144/264 (Batch A-5)
- `96d186f` feat(tartib): parser rumus qty terbatas tanpa eval, tolak fungsi asing (Batch A-6)

## Blocker

Tidak ada. Satu hal perlu verifikasi manual Ahmed (bukan blocker kode): isi IndexedDB hasil seed.

## Catatan operasional

- Shell sesi: Fish — jangan pakai heredoc; file ditulis lewat file tool.
- Jangan install library di luar BRIEF Bagian 4.
- Seed 13 divisi baku & sumber item template contoh: BRIEF Bagian 8.
- pnpm 11: izin build script lewat `pnpm-workspace.yaml` (`allowBuilds: esbuild: true`), bukan field `pnpm` di package.json (sudah tidak dibaca).
- Dexie aman di-import di lingkungan Node (hanya `open()` yang butuh IndexedDB) — singleton `tartibDb` tidak mengganggu vitest.
