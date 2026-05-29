import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { getSecretKey } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    await storeJson.merge(effects, {
      FORGEJO__security__SECRET_KEY: getSecretKey(),
    })
  } else {
    await storeJson.merge(effects, {})
  }
})
