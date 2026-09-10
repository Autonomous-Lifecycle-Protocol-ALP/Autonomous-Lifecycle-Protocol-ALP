import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'HYDRA Portable',
  description: 'Open-source autonomous personal AI — CPU-first, offline-first, portable.',
  base: '/hydra-portable/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/daemon' },
      { text: 'CLI', link: '/cli' }
    ],
    sidebar: {
      '/guide/': [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Architecture', link: '/guide/architecture' },
        { text: 'Multimodal Generation', link: '/guide/multimodal-generation' }
      ],
      '/api/': [
        { text: 'Daemon HTTP API', link: '/api/daemon' },
        { text: 'Python SDK', link: '/api/python-sdk' }
      ],
      '/cli': [
        { text: 'CLI Reference', link: '/cli' }
      ]
    },
    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ]
  },
  ignoreDeadLinks: [/^\/guide\/.*$/, /^\/api\/.*$/, /^\/cli$/]
})
