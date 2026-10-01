import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173'
const OUT = '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const log = []

  // --- Admin portal ---
  await page.goto(`${BASE}/admin`)
  await page.waitForSelector('text=Content admin')
  await page.fill('input[type="password"]', 'dreamstone')
  await page.click('button:has-text("Enter admin")')
  await page.waitForSelector('text=Health Check admin')
  log.push('admin-login: ok')

  await page.click('button.admin-tab:has-text("Report content")')
  await page.waitForSelector('text=Report content by category')
  const hasActions = await page.locator('text=Action plan items').count()
  const hasResources = await page.locator('text=Resource links').count()
  log.push(`admin-report-tab: actions=${hasActions} resources=${hasResources}`)
  if (!hasActions || !hasResources) throw new Error('Admin report tab missing actions/resources editors')
  await page.screenshot({ path: `${OUT}/admin-report-content.png`, fullPage: true })

  await page.click('button.admin-tab:has-text("Questions")')
  await page.waitForSelector('text=Add question')
  await page.screenshot({ path: `${OUT}/admin-questions.png`, fullPage: true })
  log.push('admin-questions: ok')

  await page.click('button.admin-tab:has-text("Report content")')
  const urlInputs = page.locator('.admin-action-block input')
  const count = await urlInputs.count()
  log.push(`admin-resource-inputs: ${count}`)

  // --- Seed completed assessment & open results ---
  await page.goto(BASE)
  await page.waitForSelector('button:has-text("Start the Health Check"), button:has-text("View your leadership brief")')
  await page.waitForTimeout(400)
  await page.evaluate(() => {
    const packRaw = localStorage.getItem('dreamstone-hr-content-pack-v1')
    if (!packRaw) throw new Error('content pack not in localStorage')
    const pack = JSON.parse(packRaw)
    const answers = {}
    for (const q of pack.questions) {
      if (q.type === 'scale') answers[q.id] = (q.scale && q.scale.min) || 3
      else if (q.type === 'yesno') answers[q.id] = false
      else if (q.type === 'single') answers[q.id] = (q.options && q.options[0] && q.options[0].id) || null
      else if (q.type === 'multi')
        answers[q.id] = (q.options || []).slice(0, 1).map((o) => o.id)
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
  await page.click('button:has-text("View your leadership brief")')
  await page.waitForSelector('text=Detailed action plan')
  await page.waitForSelector('text=Recommended actions')
  await page.waitForSelector('.resource-list a')
  const resourceLinks = await page.locator('.resource-list a').count()
  const timedActions = await page.locator('.action-timeline li').count()
  log.push(`results-resource-links: ${resourceLinks}`)
  log.push(`results-timed-actions: ${timedActions}`)
  await page.screenshot({ path: `${OUT}/results-top.png`, fullPage: false })
  await page.locator('.report-deep').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${OUT}/results-detailed-plan.png`, fullPage: false })
  await page.locator('.category-report').first().screenshot({ path: `${OUT}/results-category-detail.png` })

  writeFileSync(`${OUT}/manual-test-log.txt`, log.join('\n') + '\n')
  console.log(log.join('\n'))

  if (resourceLinks < 5 || timedActions < 5) {
    throw new Error(`Report too thin: links=${resourceLinks} actions=${timedActions}`)
  }

  await browser.close()
  console.log('PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
