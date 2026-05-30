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

## ✅ RESOLVED — was our LOCAL build env, not StartOS
**2026-05-29: the CI-built `.s9pk` installs + RUNS perfectly** on the 0.4.0-beta.9 VM (health green,
web UI + git interfaces up, admin-user action works). Root cause confirmed: building locally with our
freshly-installed `tar2sqfs` produced a `javascript.squashfs` StartOS couldn't mount. **Fix: build via
Start9 CI** (push to GitHub fork → `build.yml` → download artifact). Always use CI-built artifacts, not local.
(Sideload that worked: StartOS web UI from the host browser at https://easy-storks.local — start-cli's
TLS-by-IP was too flaky; GUI upload bypasses it.)

### (historical) The blocker that's now resolved
`Error: /usr/lib/startos/package/index.js not found` when sideloading a LOCAL build to 0.4.0-beta.9.
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

## ✅ VALIDATED END-TO-END (2026-05-29)
CI-built package: installs → runs (health green) → web UI loads → **admin login + dashboard work**
(Forgejo 15.0.2 on StartOS 0.4.0-beta.9 VM). Set-Primary-URL action works (ROOT_URL correct).
NOTE: a login 500 (`RegenerateSession: invalid 'sid' 26 != 16`) was just a **stale cross-domain session
cookie from Rob's own Forgejo** — fixed by an incognito window. NOT a package bug.

## 📋 Remaining for a PR-ready package
- Replace `icon.svg` with the Forgejo logo (still Gitea's).
- Rewrite `README.md` + `instructions.md` for Forgejo (still describe Gitea specifics).
- Resolve the install blocker (above) + full VM test: all 5 actions, health, SSH, git push/pull, backup/restore.
- Re-gate (confirm still unpackaged) → PR.
