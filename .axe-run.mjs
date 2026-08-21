import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
const routes = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').filter(Boolean)
const theme = process.argv[3] || 'light'
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 1440, height: 1200 } })
await c.addInitScript(t => { try { localStorage.setItem('theme', t) } catch {} }, theme)
const p = await c.newPage()
let total = 0, worst = 99
for (const r of routes) {
  try {
    await p.goto(`http://localhost:3000${r}`, { waitUntil: 'networkidle', timeout: 90000 })
    await p.waitForTimeout(350)
    const res = await new AxeBuilder({ page: p }).withRules(['color-contrast']).analyze()
    const v = res.violations.flatMap(x => x.nodes)
    total += v.length
    for (const n of v) {
      const m = /contrast of ([0-9.]+)/.exec(n.any?.[0]?.message || '')
      if (m && Number(m[1]) < worst) worst = Number(m[1])
      if (m && Number(m[1]) < 2) console.log(`  LOW ${m[1]} ${r} :: ${n.target.join(' ').slice(0,90)}`)
    }
  } catch (e) { console.log(`ERROR ${r} ${e.message.split('\n')[0].slice(0,60)}`) }
}
console.log(`=== ${theme}: ${total} violations, worst ratio ${worst} ===`)
await b.close()
