import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const stylePath = path.resolve(__dirname, 'public/style.css')
const starsPath = path.resolve(__dirname, 'public/stars.js')
const styleContent = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf-8') : ''
const starsContent = fs.existsSync(starsPath) ? fs.readFileSync(starsPath, 'utf-8') : ''

export default defineConfig({
  title: "ALP",
  description: "Autonomous Lifecycle Protocol",
  base: '/Autonomous-Lifecycle-Protocol-ALP/',
  markdown: {
    languageAlias: {
      alp: 'markdown',
      ebnf: 'markdown'
    }
  },
  vite: {
    ssr: {
      noExternal: ['vue'],
    },
  },
  transformHead: () => {
    const head: Array<[string, Record<string, string>, string]> = []
    if (styleContent) head.push(['style', {}, styleContent])
    if (starsContent) head.push(['script', {}, starsContent])
    return head
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Overview',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Business Model', link: '/business-model' },
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'Releases', link: '/releases' }
        ]
      },
      {
        text: 'Documentation',
        items: [
          { text: 'Tutorial', link: '/tutorial' },
          { text: 'Examples', link: '/examples' },
          { text: 'CLI Guide', link: '/guide/cli' },
          { text: 'Python SDK Snapshots', link: '/python-sdk-snapshot' },
          { text: 'Python SDK Diff', link: '/python-sdk-diff' },
          { text: 'Python SDK Refactor', link: '/python-sdk-refactor' },
          { text: 'Python SDK Search', link: '/python-sdk-search' },
          { text: 'Python SDK Copy', link: '/python-sdk-copy' },
          { text: 'Python SDK Stats', link: '/python-sdk-stats' },
          { text: 'Python SDK Templates', link: '/python-sdk-templates' },
          { text: 'Python SDK Move', link: '/python-sdk-move' },
          { text: 'Python SDK List', link: '/python-sdk-list' },
          { text: 'Best Practices', link: '/best-practices' },
          { text: 'FAQ', link: '/faq' },
          { text: 'Contributing', link: '/contributing' }
        ]
      },
      {
        text: 'Ecosystem & Tools',
        items: [
          { text: 'Execution Engine', link: '/execution-engine' },
          { text: 'CLI Tools Reference', link: '/cli-tools' },
          { text: 'MCP Server', link: '/mcp-server' },
          { text: 'VS Code Extension', link: '/vscode-extension' },
          { text: 'SHAM IDE', link: '/sham' }
        ]
      },
      { text: 'Specification', link: '/spec/01-overview' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Architecture', link: '/architecture' },
          { text: 'Business Model', link: '/business-model' },
          { text: 'Tutorial', link: '/tutorial' },
          { text: 'Examples', link: '/examples' },
          { text: 'CLI Usage', link: '/guide/cli' },
          { text: 'Python SDK Snapshots', link: '/python-sdk-snapshot' },
          { text: 'Python SDK Diff', link: '/python-sdk-diff' },
          { text: 'Python SDK Refactor', link: '/python-sdk-refactor' },
          { text: 'Python SDK Search', link: '/python-sdk-search' },
          { text: 'Python SDK List', link: '/python-sdk-list' },
          { text: 'Best Practices', link: '/best-practices' },
          { text: 'FAQ', link: '/faq' },
          { text: 'Contributing', link: '/contributing' },
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'SDKs', link: '/guide/sdk' }
        ]
      },
      {
        text: 'Ecosystem & Execution',
        items: [
          { text: 'Execution Engine', link: '/execution-engine' },
          { text: 'CLI Tools Reference', link: '/cli-tools' },
          { text: 'MCP Server', link: '/mcp-server' },
          { text: 'VS Code Extension', link: '/vscode-extension' },
          { text: 'SHAM IDE', link: '/sham' }
        ]
      },
      {
        text: 'Specification',
        items: [
          { text: '1. Overview', link: '/spec/01-overview' },
          { text: '2. Syntax', link: '/spec/02-syntax' },
          { text: '3. Protocol Objects', link: '/spec/03-protocol-objects' },
          { text: '4. Lifecycle', link: '/spec/04-lifecycle' },
          { text: '5. Engines', link: '/spec/05-engines' },
          { text: '6. Memory Model', link: '/spec/06-memory' },
          { text: '7. Dependency Graph', link: '/spec/07-dependency-graph' },
          { text: '8. Agent Model', link: '/spec/08-agent-model' },
          { text: '9. Directory Structure', link: '/spec/09-directory-structure' },
          { text: '10. Versioning', link: '/spec/10-versioning' },
          { text: '11. Plugin System', link: '/spec/11-plugins' },
          { text: '12. Expressions (ALPEL)', link: '/spec/12-expressions' },
          { text: '13. Multi-Project', link: '/spec/13-multi-project' },
          { text: '14. Plugin Registry', link: '/spec/14-plugin-registry' },
          { text: '15. Formal Grammar', link: '/spec/15-formal-grammar' },
          { text: '16. Compliance', link: '/spec/16-compliance' },
          { text: '17. Scheduling', link: '/spec/17-scheduling' },
          { text: '18. Contracts', link: '/spec/18-contracts' },
          { text: '19. Encrypted Vault', link: '/spec/19-vault' },
          { text: '20. Event Sourcing', link: '/spec/20-event-sourcing' },
          { text: '21. Workflow Visualization', link: '/spec/21-workflow-visualization' },
          { text: '22. Swarm Marketplace', link: '/spec/22-autonomous-marketplace' }
        ]
      }
    ],

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP' }
    ]
  }
})
