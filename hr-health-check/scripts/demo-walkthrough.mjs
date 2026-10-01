import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173'
const OUT = '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--window-position=0,0', '--window-size=1400,900'],
  })
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await context.newPage()

  // Admin login
  await page.goto(`${BASE}/admin`)
  await sleep(800)
  await page.fill('input[type="password"]', 'dreamstone')
  await sleep(400)
  await page.click('button:has-text("Enter admin")')
  await page.waitForSelector('text=Health Check admin')
  await sleep(900)

  await page.click('button.admin-tab:has-text("Report content")')
  await page.waitForSelector('text=Action plan items')
  await sleep(1200)
  await page.mouse.wheel(0, 400)
  await sleep(900)
  await page.mouse.wheel(0, 500)
  await sleep(1000)

  await page.click('button.admin-tab:has-text("Questions")')
  await page.waitForSelector('text=Add question')
  await sleep(800)
  const firstQ = page.locator('.admin-list button').first()
  if (await firstQ.count()) {
    await firstQ.click()
    await sleep(900)
  }

  await page.click('button.admin-tab:has-text("Settings")')
  await sleep(1100)

  // Seed results and show brief
  await page.goto(BASE)
  await page.waitForSelector('button:has-text("Start the Health Check"), button:has-text("View your leadership brief"), button:has-text("Continue where you left off")')
  await sleep(500)
  await page.evaluate(() => {
    const packRaw = localStorage.getItem('dreamstone-hr-content-pack-v1')
    if (!packRaw) throw new Error('missing content pack')
    const pack = JSON.parse(packRaw)
    const answers = {}
    for (const q of pack.questions) {
      if (q.type === 'scale') answers[q.id] = (q.scale && q.scale.min) || 3
      else if (q.type === 'yesno') answers[q.id] = false
      else if (q.type === 'single') answers[q.id] = (q.options && q.options[0] && q.options[0].id) || null
      else if (q.type === 'multi') answers[q.id] = (q.options || []).slice(0, 1).map((o) => o.id)
      else if (q.type === 'text') answers[q.id] = 'Test note'
    }
    localStorage.setItem(
      'dreamstone-hr-health-check-v2',
      JSON.stringify({
        step: 'landing',
        categoryIndex: 0,
        questionIndex: -1,
        contact: {
          firstName: 'Alex',
          lastName: 'Leader',
          email: 'alex@example.com',
          phone: '0400000000',
          company: 'Acme Growth Co',
        },
        answers,
        privacyAccepted: true,
        completedAt: new Date().toISOString(),
      }),
    )
  })
  await page.reload()
  await page.waitForSelector('button:has-text("View your leadership brief")')
  await sleep(700)
  await page.click('button:has-text("View your leadership brief")')
  await page.waitForSelector('text=Detailed action plan')
  await sleep(1200)
  await page.locator('.report-deep').scrollIntoViewIfNeeded()
  await sleep(1000)
  await page.mouse.wheel(0, 450)
  await sleep(900)
  await page.mouse.wheel(0, 500)
  await sleep(1100)
  await page.locator('.category-report').nth(1).scrollIntoViewIfNeeded().catch(() => {})
  await sleep(1200)

  await page.screenshot({ path: `${OUT}/demo-results-final.png`, fullPage: false })
  await browser.close()
  console.log('demo-walkthrough-done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
