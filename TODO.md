# Forgejo for StartOS — Status & TODO

Packaged from the `Start9Labs/gitea-startos` template (Forgejo is a Gitea fork).

## ✅ Done
- Cloned gitea-startos → forgejo-startos; upstream origin removed.
- Gitea → Forgejo conversion:
  - image → `codeberg.org/forgejo/forgejo:15.0.2`
  - env prefix `GITEA__` → `FORGEJO__` (49 refs)
  - admin CLI `gitea` → `forgejo`; identifiers (imageId / subcontainer / healthz host)
  - manifest id/title/description/repos/marketingUrl; version file → `v15.0.2` (no-op migration, first release)
  - i18n strings; (icon/README/instructions still TODO — see below)
- **Dropped riscv64**: Forgejo's upstream image ships only x86_64 + aarch64 (Gitea's had riscv64).
  Fixed in `manifest/index.ts` (`arch: ['x86_64','aarch64']`) + `Makefile` (`ARCHES := x86 arm`).
- `npm ci && make` builds clean → `forgejo_x86_64.s9pk` (66M) + `forgejo_aarch64.s9pk` (60M). `tsc` passes.

## 🧱 OPEN BLOCKER — install fails on StartOS 0.4.0-beta.9
`Error: /usr/lib/startos/package/index.js not found` when sideloaded to a fresh 0.4.0-beta.9 VM.
Ruled out: path (index.js IS at javascript.squashfs root → mounts to exactly that path), compression
(gzip), permissions. start-sdk 1.5.3 (gitea's pin); StartOS + start-cli both 0.4.0-beta.9.

**Leading hypothesis: LOCAL BUILD ENV, not StartOS.** (If it were a StartOS bug, *every* package would
fail and they'd have patched it — they haven't, so packages built in their CI work.) We built locally with
`tar2sqfs` from `squashfs-tools-ng`; suspect the resulting `javascript.squashfs` doesn't mount in StartOS's
kernel (→ empty mount → "not found"), even though the host's `unsquashfs` reads it fine.

### Next diagnostics / fixes (in order)
1. ✅ **Isolating test DONE (2026-05-29):** installed **Tor** from the Start9 marketplace on the VM — it
   installs + runs (health green). CONFIRMS: StartOS is fine; the `index.js not found` is OUR local build.
2. **Build via Start9 CI:** push to a GitHub fork; let `.github/workflows/build.yml` (shared-workflows) build
   the `.s9pk` in their controlled env; sideload that. If it installs → it was our local tar2sqfs/squashfs.
3. Compare our `tar2sqfs` version/flags vs what start-cli/their CI expects.
4. Lurk/search Start9 `#community-dev` Matrix for "index.js not found"; ask only if unresolved.

## 🧪 Test-env notes (StartOS VM)
- VM: libvirt/virt-install, StartOS 0.4.0-beta.9 nonfree (x86_64), 192.168.122.98, server "easy-storks".
- Auth: `start-cli auth login` must run in a real TTY (can't pipe — os error 6).
- TLS/sideload quirk: cert is for `easy-storks.local`; connecting by IP, `--insecure` works for API but the
  upload path does full verification → needs `--root-ca` + matching hostname. `.local` doesn't resolve from
  host (NAT, no mDNS). Fix: add `192.168.122.98 easy-storks.local` to /etc/hosts, then
  `-H https://easy-storks.local --root-ca <startos-ca.pem>`.

## 📋 Remaining for a PR-ready package
- Replace `icon.svg` with the Forgejo logo (still Gitea's).
- Rewrite `README.md` + `instructions.md` for Forgejo (still describe Gitea specifics).
- Resolve the install blocker (above) + full VM test: all 5 actions, health, SSH, git push/pull, backup/restore.
- Re-gate (confirm still unpackaged) → PR.
