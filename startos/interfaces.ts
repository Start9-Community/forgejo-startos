import { sdk } from './sdk'
import { httpInterfaceId, uiPort } from './utils'
import { i18n } from './i18n'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, 'main')

  // http
  const httpOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
  })
  const httpInterface = sdk.createInterface(effects, {
    name: i18n('Web UI and git (HTTP)'),
    id: httpInterfaceId,
    description: i18n('Web UI for Forgejo. Also used for git over HTTP'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const httpReceipt = await httpOrigin.export([httpInterface])

  // ssh
  const sshOrigin = await uiMulti.bindPort(22, {
    protocol: 'ssh',
  })
  const sshInterface = sdk.createInterface(effects, {
    name: i18n('git (SSH)'),
    id: 'ssh',
    description: i18n('Used for git over SSH'),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: 'git',
    path: '',
    query: {},
  })
  const sshReceipt = await sshOrigin.export([sshInterface])

  return [httpReceipt, sshReceipt]
})
