import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getHttpInterfaceUrls } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  url: Value.dynamicSelect(async ({ effects }) => {
    const systemUrls = await getHttpInterfaceUrls(effects)

    return {
      name: i18n('URL'),
      values: systemUrls.reduce(
        (obj, url) => ({
          ...obj,
          [url]: url,
        }),
        {} as Record<string, string>,
      ),
      default: '',
    }
  }),
})

export const setPrimaryUrl = sdk.Action.withInput(
  // id
  'set-primary-url',

  // metadata
  async ({ effects }) => ({
    name: i18n('Set Primary Url'),
    description: i18n(
      'Choose which of your Forgejo http URLs should serve as the primary URL for the purposes of creating links, sending invites, etc.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => ({
    url:
      (await storeJson.read((s) => s.FORGEJO__server__ROOT_URL).once()) ||
      undefined,
  }),

  // the execution function
  async ({ effects, input }) =>
    storeJson.merge(effects, { FORGEJO__server__ROOT_URL: input.url }),
)
