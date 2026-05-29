import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const registrations = sdk.Action.withoutInput(
  // id
  'registrations',

  // metadata
  async ({ effects }) => {
    const disabled = await storeJson
      .read((s) => s.FORGEJO__service__DISABLE_REGISTRATION)
      .const(effects)

    return {
      name: disabled
        ? i18n('Enable Registrations')
        : i18n('Disable Registrations'),
      description: disabled
        ? i18n(
            'Registrations are currently disabled. Run this action to permit new registrations.',
          )
        : i18n(
            'Registrations are currently enabled. Run this action to prohibit new registrations.',
          ),
      warning: disabled
        ? i18n(
            'Anyone with your Forgejo URL will be able to create an account on your server, which represents a security risk. Be careful!',
          )
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  // the execution function
  async ({ effects }) => {
    const disabled = await storeJson
      .read((s) => s.FORGEJO__service__DISABLE_REGISTRATION)
      .const(effects)

    await storeJson.merge(effects, {
      FORGEJO__service__DISABLE_REGISTRATION: !disabled,
    })
  },
)
