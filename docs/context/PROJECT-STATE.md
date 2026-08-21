# PROJECT-STATE — Tartib

> **Dibaca PERTAMA, diperbarui TERAKHIR** — tanpa kecuali. WIP pun di-commit.

## Posisi

- **Tanggal:** 2026-08-22
- **Sesi:** 0 — docs + scaffold (belum ada kode fitur)
- **Repo:** `/Users/ahmad/Projects/tartib-app` — path dipindah dari `~/dev/tartib` (keputusan user, 2026-08-22)
- **Branch:** `master`

## Progress

- [x] `docs/BRIEF.md` — brief disalin (409 baris), commit `chore: brief awal Tartib`
- [x] `docs/PRD.md` — spesifikasi otoritatif dari BRIEF Bagian 3–6
- [x] `docs/PLAN.md` — batch A–G, gate checklist, protokol blocker, konvensi commit
- [x] `docs/DECISIONS.md` — K-01 s/d K-10 (entry terbaru di atas)
- [x] Scaffold Next.js 14 + TS strict + Dexie + Tailwind + Vitest, static export, tanpa fitur
- [x] `pnpm tsc --noEmit` hijau
- [x] `pnpm vitest run` hijau

## Batch berjalan

**Tidak ada** — Sesi 0 selesai, belum mulai Batch A.

## Next step (presisi)

Batch A — Fondasi & skema, branch `batch-a-fondasi-skema`:

1. `src/tartib/types/index.ts` — seluruh tipe PRD 5.1 + status PRD 5.2
2. `src/tartib/db/schema.ts` — `TartibDb extends Dexie`, versi 1, tabel `tartib_*`
3. `src/tartib/db/seed.ts` — `seedDivisiBaku()` (13), `seedJenisAcara()` (8), `seedTemplateContoh()` (Tasyakuran Khatam, H-30…H+1)
4. `src/tartib/host/TartibHost.ts` + `standaloneHost.ts`
5. `src/tartib/lib/porsi.ts` + test fixture 240/144/264
6. `src/tartib/lib/rumusQty.ts` + test (tolak eval & fungsi asing)

Lalu tutup Gate A.

## Files touched (Sesi 0)

- `docs/BRIEF.md`, `docs/PRD.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/context/PROJECT-STATE.md`
- Scaffold: `package.json`, `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tests/scaffold.test.ts`, `.gitignore`

## Blocker

Tidak ada.

## Catatan operasional

- Shell sesi: Fish — jangan pakai heredoc; file ditulis lewat file tool.
- Jangan install library di luar BRIEF Bagian 4.
- Seed 13 divisi baku & sumber item template contoh: BRIEF Bagian 8.
