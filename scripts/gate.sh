#!/usr/bin/env bash
# Gate grep Tartib (K-22 + K-26): aturan proyek yang tidak bisa dijaga tsc/lint.
# Keluar 1 bila ada pelanggaran. Dipakai lokal (`pnpm gate`) dan CI.
set -u
cd "$(dirname "$0")/.."

gagal=0
lapor() { # $1 = judul, $2.. = baris temuan
  local judul="$1"; shift
  if [ "$#" -gt 0 ] && [ -n "$1" ]; then
    echo "✗ $judul"; printf '%s\n' "$@" | sed 's/^/    /'; gagal=1
  else
    echo "✓ $judul"
  fi
}

# 1. Nol window.alert/confirm/prompt di src/tartib — modal lewat AppDialog.
#    Kecuali lib/konfirmasi/eKonfirmasi.ts: string HTML berkas mandiri yang diekspor.
t=$(grep -rnE '(^|[^A-Za-z_.])(alert|confirm|prompt)\(' src/tartib src/app --include='*.ts' --include='*.tsx' \
  --exclude='*.test.ts' | grep -v 'lib/konfirmasi/eKonfirmasi.ts' | grep -vE '^\S+:\s*//' || true)
lapor "nol alert()/confirm()/prompt() (kecuali string HTML e-Konfirmasi)" "$t"

# 2. Nol `as any` (BRIEF: tanpa kecuali) dan `: any`.
t=$(grep -rnE 'as any\b|:\s*any\b' src --include='*.ts' --include='*.tsx' | grep -vE '^\S+:\s*//' || true)
lapor "nol as any / : any" "$t"

# 3. Aplikasi terang saja: nol varian dark: (Tailwind tanpa darkMode = media → aktif di HP gelap).
t=$(grep -rn 'dark:' src --include='*.tsx' --include='*.ts' | grep -vE '^\S+:\s*//' || true)
lapor "nol kelas dark:" "$t"

# 4. Navigasi dari src/tartib lewat prop callback — <a href="/?view=…"> rusak di basePath.
t=$(grep -rn 'href="/?view=' src/tartib || true)
lapor "nol <a href=\"/?view=…\"> di src/tartib" "$t"

# 5. Kelas Tailwind yang tidak terdefinisi (tanpa plugin) — no-op yang menyesatkan.
t=$(grep -rnE 'animate-in|fade-in|zoom-in-95|active:scale-98|animate-fade-in' src --include='*.tsx' | grep -vE '^\S+:\s*//' || true)
lapor "nol kelas Tailwind tak terdefinisi (animate-in/fade-in/zoom-in-95/active:scale-98/animate-fade-in)" "$t"

# 6. next/* hanya di src/app (K-04 / Gate A).
t=$(grep -rnE "from 'next/" src/tartib || true)
lapor "nol impor next/* di src/tartib" "$t"

# 7. @page tidak boleh bersarang di dalam selector (dibuang browser).
t=$(awk '/@page/ && d>1 {print FILENAME":"NR": "$0} /\{/{d++} /\}/{d--}' src/app/globals.css || true)
lapor "@page di globals.css tidak bersarang" "$t"

# 8. Nama pribadi yang dulu dikodekan keras tidak boleh kembali (aplikasi publik).
t=$(grep -rniE "lutfi|yudi nahyuddin|adrian maulana|juswandi|husnil" src --include='*.ts' --include='*.tsx' | grep -vE '^\S+:\s*//' || true)
lapor "nol nama pribadi yang dikodekan keras" "$t"

exit $gagal
