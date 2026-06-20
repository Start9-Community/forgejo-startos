import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '15.0.3:0',
  releaseNotes: {
    en_US: `Initial Forgejo release for StartOS.`,
    es_ES: `Versión inicial de Forgejo para StartOS.`,
    de_DE: `Erste Forgejo-Veröffentlichung für StartOS.`,
    pl_PL: `Pierwsze wydanie Forgejo dla StartOS.`,
    fr_FR: `Version initiale de Forgejo pour StartOS.`,
  },
  migrations: {
    // First release of the Forgejo package — nothing to migrate from.
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
