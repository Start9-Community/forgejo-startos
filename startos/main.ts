import { T } from '@start9labs/start-sdk'
import { createAdmin } from './actions/createAdmin'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { mount, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup (optional) ========================
   *
   * In this section, we fetch any resources or run any desired preliminary commands.
   */
  console.info(i18n('Starting Forgejo!'))

  const store = await storeJson.read().const(effects)

  if (!store) {
    throw new Error(i18n('Store not found'))
  }

  const {
    FORGEJO__server__ROOT_URL,
    FORGEJO__security__SECRET_KEY,
    FORGEJO__service__DISABLE_REGISTRATION,
    smtp,
  } = store

  let smtpCredentials: T.SmtpValue | null = null

  if (smtp.selection === 'system') {
    smtpCredentials = await sdk.getSystemSmtp(effects).const()
    const customFrom = smtp.value.customFrom as string | undefined
    if (smtpCredentials && customFrom) smtpCredentials.from = customFrom
  } else if (smtp.selection === 'custom') {
    const p = smtp.value.provider.value
    smtpCredentials = {
      host: p.host,
      port: Number(p.security.value.port),
      from: p.from,
      username: p.username,
      password: p.password,
      security: p.security.selection,
    }
  }

  let mailer: ForgejoMailer = {
    FORGEJO__mailer__ENABLED: 'false',
  }
  if (smtpCredentials) {
    mailer = {
      FORGEJO__mailer__ENABLED: 'true',
      FORGEJO__mailer__PROTOCOL:
        smtpCredentials.security === 'tls' ? 'smtps' : 'smtp+starttls',
      FORGEJO__mailer__SMTP_ADDR: smtpCredentials.host,
      FORGEJO__mailer__SMTP_PORT: String(smtpCredentials.port),
      FORGEJO__mailer__FROM: smtpCredentials.from,
      FORGEJO__mailer__USER: smtpCredentials.username,
    }
    if (smtpCredentials.password)
      mailer.FORGEJO__mailer__PASSWD = smtpCredentials.password
  }

  const sshDomain = new URL(FORGEJO__server__ROOT_URL).hostname
  const sshPort = await sdk.serviceInterface
    .getOwn(
      effects,
      'ssh',
      (i) =>
        i?.addressInfo?.filter({ exclude: { kind: 'plugin' } }).hostnames?.[0]
          ?.port ?? null,
    )
    .once()

  const env: ForgejoEnv = {
    FORGEJO__lfs__PATH: '/data/git/lfs',
    FORGEJO__server__ROOT_URL,
    FORGEJO__server__SSH_DOMAIN: sshDomain,
    ...(sshPort ? { FORGEJO__server__SSH_PORT: String(sshPort) } : {}),
    FORGEJO__service__DISABLE_REGISTRATION: String(
      FORGEJO__service__DISABLE_REGISTRATION,
    ),
    FORGEJO__security__INSTALL_LOCK: 'true',
    FORGEJO__security__SECRET_KEY,
    ...(mailer || {}),
  }

  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'forgejo' },
    mount,
    'forgejo-sub',
  )

  /**
   * ======================== Daemons ========================
   *
   * In this section, we create one or more daemons that define the service runtime.
   *
   * Each daemon defines its own health check, which can optionally be exposed to the user.
   */
  return sdk.Daemons.of(effects)
    .addDaemon('primary', {
      subcontainer,
      exec: {
        command: sdk.useEntrypoint(),
        env,
      },
      ready: {
        display: i18n('Web Interface'),
        gracePeriod: 120000,
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            effects,
            `http://forgejo.startos:${uiPort}/api/healthz`,
            {
              successMessage: i18n('Forgejo is ready'),
              errorMessage: i18n(
                'Forgejo is still starting. If this persists, please check the logs.',
              ),
            },
          ),
      },
      requires: [],
    })
    .addOneshot('admin-user', {
      subcontainer,
      exec: {
        fn: async () => {
          const res = await subcontainer.execFail(
            [
              'forgejo',
              'admin',
              'user',
              'list',
              '--admin',
              '--work-path',
              '/data',
            ],
            {
              user: 'git',
            },
          )
          const lines = (res.stdout as string).trim().split('\n')
          if (lines.length <= 1) {
            await sdk.action.createOwnTask(effects, createAdmin, 'important', {
              reason: i18n('Create your first admin user and password'),
            })
          }
          return null
        },
      },
      requires: ['primary'],
    })
})

type ForgejoEnv = ForgejoMailer & {
  FORGEJO__lfs__PATH: '/data/git/lfs'
  FORGEJO__server__ROOT_URL: string
  FORGEJO__server__SSH_DOMAIN: string
  FORGEJO__server__SSH_PORT?: string
  FORGEJO__security__INSTALL_LOCK: 'true'
  FORGEJO__security__SECRET_KEY: string
  FORGEJO__service__DISABLE_REGISTRATION: string
}

type ForgejoMailer =
  | {
      FORGEJO__mailer__ENABLED: 'false'
    }
  | {
      FORGEJO__mailer__ENABLED: 'true'
      FORGEJO__mailer__PROTOCOL: 'smtps' | 'smtp+starttls'
      FORGEJO__mailer__SMTP_ADDR: string
      FORGEJO__mailer__SMTP_PORT: string
      FORGEJO__mailer__FROM: string
      FORGEJO__mailer__USER: string
      FORGEJO__mailer__PASSWD?: string
    }
