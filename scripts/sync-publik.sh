#!/usr/bin/env bash
# sync-publik.sh — sinkronisasi snapshot publik Tartib ke repo ugi577/tartib.
#
# Repo publik hanya boleh berisi apa yang memang pantas publik: README, workflow
# Pages, src/, test — TANPA docs/ (rencana & catatan internal) dan TANPA .claude/.
# Alih-alih mengandalkan ingatan, snapshot dibangun deterministik dari git archive.
#
# Pemakaian:
#   scripts/sync-publik.sh [ref]        # dry-run (default): bangun snapshot, laporkan, tidak mengubah apa pun
#   scripts/sync-publik.sh [ref] --push # bangun snapshot, commit di atas tip origin/main, push fast-forward
#
# ref default: master. --push TIDAK pernah memakai --force: server menolak bila
# bukan fast-forward, jadi sejarah publik tidak bisa ditulis ulang lewat skrip ini.
set -euo pipefail

REF="${1:-master}"
PUSH=false
for arg in "$@"; do
  if [ "$arg" = "--push" ]; then PUSH=true; fi
done

REMOTE="origin"
BRANCH="main"
# Direktori yang dikecualikan dari snapshot publik.
EXCLUDE=(docs .claude scripts)

if [ ! -d .git ]; then
  echo "ERROR: jalankan dari akar repo tartib-app (ada .git)." >&2
  exit 1
fi
if ! git rev-parse --verify -q "$REF" >/dev/null; then
  echo "ERROR: ref '$REF' tidak ada." >&2
  exit 1
fi
if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "ERROR: remote '$REMOTE' tidak terdaftar." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Ref sumber      : $REF ($(git rev-parse --short "$REF"))"
echo "Target          : $REMOTE/$BRANCH ($(git remote get-url "$REMOTE"))"

# 1. Bangun snapshot deterministik dari git archive (hanya berkas ter-track).
git archive --format=tar "$REF" | tar -x -C "$TMP"

# 2. Hapus direktori internal dari snapshot.
for d in "${EXCLUDE[@]}"; do
  if [ -e "$TMP/$d" ]; then rm -rf "$TMP/$d"; fi
done

# 3. Pengaman: snapshot final TIDAK boleh mengandung docs/ atau .claude/.
if [ -e "$TMP/docs" ] || [ -e "$TMP/.claude" ]; then
  echo "ERROR: snapshot masih mengandung docs/ atau .claude/ — hentikan." >&2
  exit 1
fi

BERKAS="$(find "$TMP" -type f | wc -l | tr -d ' ')"
echo "Berkas snapshot : $BERKAS (docs/, .claude/, scripts/ dikeluarkan)"

if [ "$PUSH" = false ]; then
  echo "Mode dry-run     : tidak ada yang diubah. Ulangi dengan --push untuk benar-benar sinkron."
  exit 0
fi

# 4. Bangun commit di atas tip origin/main (fast-forward saja, tanpa force).
git init -q "$TMP"
git -C "$TMP" remote add origin "$(git remote get-url "$REMOTE")"
git -C "$TMP" fetch -q origin "$BRANCH"
PARENT="$(git -C "$TMP" rev-parse "origin/$BRANCH")"
git -C "$TMP" add -A
TREE="$(git -C "$TMP" write-tree)"

# Pengaman kedua: pohon yang akan di-push juga bebas docs/ & .claude/.
if git -C "$TMP" ls-tree -r --name-only "$TREE" | grep -qE '(^|/)(docs|\.claude)/'; then
  echo "ERROR: pohon commit mengandung docs/ atau .claude/ — hentikan." >&2
  exit 1
fi

PESAN="chore(public): snapshot tartib dari $REF — $(date +%Y-%m-%d)"
NEW="$(git -C "$TMP" commit-tree "$TREE" -p "$PARENT" -m "$PESAN")"
echo "Commit          : ${NEW:0:12} (parent ${PARENT:0:12}, fast-forward)"
git -C "$TMP" push -q origin "$NEW:refs/heads/$BRANCH"
echo "Selesai — $REMOTE/$BRANCH diperbarui."
