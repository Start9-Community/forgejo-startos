import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'forgejo',
  title: 'Forgejo',
  license: 'GPL-3.0-or-later',
  packageRepo: 'https://github.com/Start9-Community/forgejo-startos',
  upstreamRepo: 'https://codeberg.org/forgejo/forgejo',
  marketingUrl: 'https://forgejo.org/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    forgejo: {
      source: {
        dockerTag: 'codeberg.org/forgejo/forgejo:15.0.3',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
