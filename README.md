<p align="center">
  <img src="icon.svg" alt="Forgejo Logo" width="21%">
</p>

# Forgejo on StartOS

> **Upstream docs:** <https://forgejo.org/docs>
>
> Everything not listed in this document behaves identically to upstream Forgejo. If a feature, setting, or behavior is not mentioned here, the upstream documentation is accurate and fully applicable.

[Forgejo](https://codeberg.org/forgejo/forgejo) is a community managed lightweight code hosting solution written in Go. This repository packages Forgejo for [StartOS](https://github.com/Start9Labs/start-os/).

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [SMTP / Email](#smtp--email)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Aspect | Standard Docker/Compose | StartOS |
|---|---|---|
| Image | `codeberg.org/forgejo/forgejo` (upstream) | Same image, unmodified |
| Architectures | Depends on host | x86_64, aarch64 |
| Container orchestration | Docker / Docker Compose | StartOS SDK (`SubContainer`) — no user-facing `docker-compose.yml` |
| Entrypoint | Default Forgejo entrypoint | Same (via `sdk.useEntrypoint()`) |

The upstream Forgejo image is used unmodified. No custom Dockerfile exists. StartOS wraps the container with its own lifecycle management, health checks, and action system.

---

## Volume and Data Layout

| Aspect | Standard Docker/Compose | StartOS |
|---|---|---|
| Primary volume | User-defined bind mount or named volume | Single managed volume `main`, mounted at `/data` |
| LFS storage | Configurable | Hardcoded to `/data/git/lfs` |
| Extra metadata | None | `/data/store.json` — StartOS-managed settings file (see [Configuration Management](#configuration-management)) |
| Database | Configurable (SQLite, PostgreSQL, MySQL) | Defaults to SQLite inside `/data` (no external DB dependency) |

All persistent state lives under `/data` on a single StartOS-managed volume. There is no separate database container.

---

## Installation and First-Run Flow

Standard Forgejo presents a web-based installation wizard on first launch where you configure the database, admin account, server URL, and more.

**On StartOS, this wizard is skipped entirely.** The wrapper handles setup automatically:

1. **Pre-install:** A `store.json` file is written with:
   - A randomly generated 32-character `SECRET_KEY`
   - `ROOT_URL` set to empty (populated during init)
   - User registration disabled by default
   - SMTP disabled by default

2. **Init:** The primary URL is auto-selected from available interface addresses (prefers `.local`).

3. **First start:** The environment variable `FORGEJO__security__INSTALL_LOCK=true` is set, which tells Forgejo to skip its installation wizard.

4. **Admin user creation:** A oneshot task checks whether any admin users exist. If none are found, StartOS surfaces an **"important" task** prompting the user to create their first admin account (username, email). A strong 22-character password is auto-generated and displayed once.

**Key difference:** There is no web-based setup wizard. Admin account creation happens through the StartOS action system, not through the Forgejo UI.

---

## Configuration Management

Forgejo normally uses `app.ini` or environment variables for configuration. On StartOS, a subset of settings are managed externally via environment variables injected at container start, with values persisted in `/data/store.json`.

### Settings managed by StartOS (not `app.ini`)

These settings are controlled exclusively through StartOS actions and cannot be changed via `app.ini` or the Forgejo admin panel:

| Setting | Env Var | Managed Via |
|---|---|---|
| Server root URL | `FORGEJO__server__ROOT_URL` | "Set Primary URL" action |
| Install lock | `FORGEJO__security__INSTALL_LOCK` | Always `true` (hardcoded) |
| Secret key | `FORGEJO__security__SECRET_KEY` | Auto-generated at install, stored in `store.json` |
| User registration | `FORGEJO__service__DISABLE_REGISTRATION` | "Enable/Disable Registrations" action |
| LFS path | `FORGEJO__lfs__PATH` | Always `/data/git/lfs` (hardcoded) |
| Session cookie name | `FORGEJO__session__COOKIE_NAME` | Always `i_like_forgejo` (hardcoded) — avoids cookie collisions with other services on the same local hostname |
| SMTP/mailer | `FORGEJO__mailer__*` | "Configure SMTP" action |

### Settings NOT managed by StartOS

Everything else — repository settings, webhook configuration, OAuth, labels, user management, organization settings, etc. — works exactly as documented upstream via Forgejo's admin panel or `app.ini`.

---

## Network Access and Interfaces

StartOS exposes two network interfaces for Forgejo:

### HTTP Interface (port 3000)
- **Purpose:** Web UI and git-over-HTTP
- **Protocols available:**
  - HTTPS over `.local` (LAN via mDNS)
  - HTTP over `.onion` (Tor — encrypted by Tor itself)

### SSH Interface (port 22)
- **Purpose:** git-over-SSH
- **Username:** `git`

### Network access summary

| Access method | Supported |
|---|---|
| LAN IP:port | Yes |
| `.local:port` (mDNS) | Yes |
| `.onion` (Tor) | Yes |
| Public/private custom domains | Yes — can be configured in StartOS and selected as primary URL |
| SSH over LAN | Yes (via LAN IP:port or custom domain) |
| SSH over Tor | Yes |

Each interface gets a unique port on the LAN. You can access Forgejo via `<lan-ip>:<port>` or `<hostname>.local:<port>`. Public or private domains can be added in StartOS and selected as the primary URL via the "Set Primary URL" action.

### Using git over HTTP/Tor

Requires a Tor proxy running on port 9050 on the client machine.

```bash
# Global config
git config --global http.proxy "socks5h://127.0.0.1:9050"

# Per-repo clone
git clone http://<onion-address>/<user>/<repo> \
  --config "http.proxy=socks5h://127.0.0.1:9050"

# Or via environment variable
http_proxy=socks5h://127.0.0.1:9050 git clone http://<onion-address>/<user>/<repo>
```

### Using git over SSH/Tor

Add to `~/.ssh/config`:

```
Host *.onion
  ProxyCommand /usr/bin/nc -x localhost:9050 -X5 %h %p
```

Requires `netcat` (`nc`) installed on the client.

---

## Actions (StartOS UI)

StartOS adds management actions accessible from the service's page in the StartOS UI. These have no equivalent in standard Forgejo's admin panel.

| Action | Visibility | Availability | Purpose |
|---|---|---|---|
| Create Admin User | Hidden | Running only | Create first admin account (auto-triggered if none exist) |
| Reset Admin Password | Visible | Running only | Generate new password for an existing admin |
| Set Primary URL | Visible | Any | Choose which URL serves as Forgejo's `ROOT_URL` |
| Enable/Disable Registrations | Visible | Any | Toggle user self-registration |
| Configure SMTP | Visible | Any | Set up email sending |

### Create Admin User
- **Inputs:** Username, email
- **Outputs:** Username and auto-generated 22-character password (displayed once)
- Runs `forgejo admin user create` internally

### Reset Admin Password
- **Inputs:** Select from list of existing admin users
- **Outputs:** Username and new auto-generated 22-character password
- Runs `forgejo admin user change-password` internally

### Set Primary URL
- **Inputs:** Select from available HTTP interface URLs (`.local`, `.onion`, custom domains)
- **Outputs:** None (takes effect on next start)
- Affects generated links, clone URLs, email links, etc.

### Enable/Disable Registrations
- **Inputs:** None (toggle action)
- **Outputs:** None (takes effect on next start)
- Shows warning when enabling: anyone with the URL can create an account
- Disabled by default for security

### Configure SMTP
- **Inputs:** Mode (disabled, system SMTP, or custom), plus credentials if custom
- **Outputs:** None (takes effect on next start)
- Custom mode supports overriding the "from" address

---

## SMTP / Email

| Aspect | Standard Forgejo | StartOS |
|---|---|---|
| Configuration | `app.ini` `[mailer]` section | "Configure SMTP" action in StartOS UI |
| System SMTP | N/A | Can use StartOS system-level SMTP credentials |
| Custom SMTP | Via `app.ini` | Via action form (server, port, from, login, password) |
| Default state | Disabled unless configured | Disabled |

SMTP settings configured through the Forgejo admin panel or `app.ini` will be overridden by the environment variables set by StartOS on each restart.

---

## Backups and Restore

| Aspect | Standard Forgejo | StartOS |
|---|---|---|
| Backup method | `forgejo dump` or manual file copy | StartOS backup system — full volume snapshot of `/data` |
| Backup scope | Configurable | Entire `/data` volume (repos, DB, LFS, config, `store.json`) |
| Restore | Manual | StartOS restore flow — volume is fully restored before service starts |
| Scheduling | Manual or via cron | Managed through StartOS backup settings |

The `forgejo dump` command is not used. StartOS backs up the raw volume contents.

---

## Health Checks

| Aspect | Standard Forgejo | StartOS |
|---|---|---|
| Endpoint | N/A (or custom Docker healthcheck) | `GET /api/healthz` on port 3000 |
| Grace period | N/A | 120 seconds |
| Display | N/A | "Web Interface" status shown in StartOS UI |
| Failure message | N/A | "Forgejo is still starting. If this persists, please check the logs." |

---

## Dependencies

None. Forgejo runs with an embedded SQLite database and has no external service dependencies.

---

## Limitations and Differences

1. **No web-based installation wizard** — setup is fully automated by StartOS.
2. **No external database** — uses embedded SQLite only. No PostgreSQL or MySQL option.
3. **Certain settings are environment-locked** — `ROOT_URL`, `INSTALL_LOCK`, `SECRET_KEY`, `DISABLE_REGISTRATION`, `LFS_PATH`, and mailer settings are injected as environment variables and override any `app.ini` values.
4. **Registration disabled by default** — must be explicitly enabled via action (standard Forgejo defaults to enabled).

---

## What Is Unchanged from Upstream

Everything not listed above works exactly as documented at <https://forgejo.org/docs>. This includes but is not limited to:

- Repository management (create, fork, mirror, archive, transfer)
- Git operations (push, pull, fetch, LFS)
- Issues, pull requests, milestones, labels, projects
- Wiki pages
- Organization and team management
- Webhooks and integrations
- OAuth2 / OpenID Connect authentication
- Two-factor authentication
- User and admin panel settings (except the env-locked settings above)
- API (`/api/v1/...`)
- Forgejo Actions (CI/CD)
- Package registry
- RSS/Atom feeds
- Markdown rendering, syntax highlighting
- All `app.ini` settings not overridden by environment variables

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: forgejo
image: codeberg.org/forgejo/forgejo
architectures: [x86_64, aarch64]
volumes:
  main: /data
ports:
  http: 3000
  ssh: 22
dependencies: none
startos_managed_env_vars:
  - FORGEJO__server__ROOT_URL
  - FORGEJO__security__INSTALL_LOCK
  - FORGEJO__security__SECRET_KEY
  - FORGEJO__service__DISABLE_REGISTRATION
  - FORGEJO__lfs__PATH
  - FORGEJO__session__COOKIE_NAME
  - FORGEJO__mailer__ENABLED
  - FORGEJO__mailer__SMTP_ADDR
  - FORGEJO__mailer__SMTP_PORT
  - FORGEJO__mailer__FROM
  - FORGEJO__mailer__USER
  - FORGEJO__mailer__PASSWD
actions:
  - create-admin
  - reset-admin
  - set-primary-url
  - registrations
  - manage-smtp
```
