import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z
  .object({
    FORGEJO__server__ROOT_URL: z.string().catch(''),
    FORGEJO__security__SECRET_KEY: z.string(),
    FORGEJO__service__DISABLE_REGISTRATION: z.boolean().catch(true),
    smtp: smtpShape,
  })
  .strip()

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
