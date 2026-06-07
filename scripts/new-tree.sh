#!/usr/bin/env bash
# Spin up a git worktree for parallel work (one Claude per tree).
#
#   scripts/new-tree.sh <name> [base-branch]
#
# Creates ~/tenplusone-trees/<name> on a new branch tree/<name>, shares the
# installed frontend deps via symlink (no re-install), and pre-links Vercel so
# `npx vercel deploy` works from the tree. Default base is main.
set -euo pipefail

name="${1:?usage: scripts/new-tree.sh <name> [base-branch]}"
base="${2:-main}"
root="$(git rev-parse --show-toplevel)"
parent="$HOME/tenplusone-trees"
dir="$parent/$name"
branch="tree/$name"

[ -e "$dir" ] && { echo "✗ $dir already exists"; exit 1; }
mkdir -p "$parent"

# fresh worktree on a new branch off the chosen base
git -C "$root" worktree add "$dir" -b "$branch" "$base"

# share installed deps (same lockfile) — fast, no GBs of duplicate install
if [ -d "$root/frontend/node_modules" ] && [ ! -e "$dir/frontend/node_modules" ]; then
  ln -s "$root/frontend/node_modules" "$dir/frontend/node_modules"
  echo "  ↳ linked frontend/node_modules → main"
fi

# pre-link Vercel so deploys work from the tree (preview by default)
[ -d "$root/.vercel" ] && cp -R "$root/.vercel" "$dir/.vercel" && echo "  ↳ copied .vercel (pre-linked)"

echo "✓ worktree ready: $dir"
echo "  branch:   $branch  (off $base)"
echo "  build:    cd $dir/frontend && npx tsc --noEmit -p tsconfig.app.json && npx vite build"
echo "  preview:  cd $dir && npx vercel deploy --yes        # preview URL"
echo "  remove:   git worktree remove $dir && git branch -D $branch"
