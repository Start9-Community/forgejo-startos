import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'gitea',
  title: 'Gitea',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9Labs/gitea-startos',
  upstreamRepo: 'https://github.com/go-gitea/gitea',
  marketingUrl: 'https://gitea.com/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    gitea: {
      source: {
        dockerTag: 'gitea/gitea:1.26.2',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
  },
  dependencies: {},
})
