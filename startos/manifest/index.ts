import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'forgejo',
  title: 'Forgejo',
  license: 'MIT',
  packageRepo: 'https://github.com/rpriven/forgejo-startos',
  upstreamRepo: 'https://codeberg.org/forgejo/forgejo',
  marketingUrl: 'https://forgejo.org/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    forgejo: {
      source: {
        dockerTag: 'codeberg.org/forgejo/forgejo:15.0.2',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
