import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173'
const OUT = '/opt/cursor/artifacts'
const ROOT = new URL('..', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

async function main() {
  const log = []

  // API smoke
  const empty = await fetch(`${BASE}/api/responses`)
  log.push(`api-get-status: ${empty.status}`)
  if (!empty.ok) throw new Error('API GET failed')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  await page.goto(BASE)
  await page.waitForSelector('button:has-text("Start the Health Check"), button:has-text("View your leadership brief"), button:has-text("Continue where you left off")')
  await page.waitForTimeout(400)

  const submissionId = await page.evaluate(() => {
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
    const completedAt = new Date().toISOString()
    localStorage.setItem(
      'dreamstone-hr-health-check-v2',
      JSON.stringify({
        step: 'landing',
        categoryIndex: 0,
        questionIndex: -1,
        contact: {
          firstName: 'Sam',
          lastName: 'Tester',
          email: 'sam.tester@example.com',
          phone: '0411222333',
          company: 'TestCo Pty Ltd',
        },
        answers,
        privacyAccepted: true,
        completedAt,
      }),
    )
    sessionStorage.removeItem('dreamstone-hr-last-saved-submission-id')
    return completedAt
  })
  log.push(`seeded-completedAt: ${submissionId}`)

  await page.reload()
  await page.waitForSelector('button:has-text("View your leadership brief")')
  await page.click('button:has-text("View your leadership brief")')
  await page.waitForSelector('text=Download your report')
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(OUT, 'results-download-cta.png') })

  // Wait for API save
  let found = false
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${BASE}/api/responses`)
    const data = await res.json()
    found = (data.submissions || []).some((s) => s.contact?.email === 'sam.tester@example.com')
    if (found) {
      log.push(`api-submissions: ${data.submissions.length}`)
      break
    }
    await page.waitForTimeout(300)
  }
  if (!found) throw new Error('Submission not persisted to API')

  const dataFile = join(ROOT, 'data', 'responses.json')
  log.push(`data-file-exists: ${existsSync(dataFile)}`)
  if (existsSync(dataFile)) {
    const parsed = JSON.parse(readFileSync(dataFile, 'utf8'))
    log.push(`data-file-count: ${parsed.submissions?.length ?? 0}`)
  }

  // Admin responses
  await page.goto(`${BASE}/admin`)
  await page.fill('input[type="password"]', 'dreamstone')
  await page.click('button:has-text("Enter admin")')
  await page.waitForSelector('text=Health Check admin')
  await page.click('button.admin-tab:has-text("Responses")')
  await page.waitForSelector('text=Client responses')
  await page.waitForSelector('text=Sam Tester')
  await page.click('button:has-text("Sam Tester")')
  await page.waitForSelector('text=Download report')
  await page.waitForSelector('text=sam.tester@example.com')
  await page.screenshot({ path: join(OUT, 'admin-responses-inbox.png'), fullPage: true })
  log.push('admin-responses: ok')

  // Trigger download via evaluate of report builder path — click download and confirm no throw
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
    page.click('button.btn--lime:has-text("Download report")'),
  ])
  if (download) {
    const path = await download.path()
    log.push(`download: ${download.suggestedFilename()} path=${!!path}`)
  } else {
    log.push('download: event-not-captured-but-click-ok')
  }

  writeFileSync(join(OUT, 'responses-feature-log.txt'), log.join('\n') + '\n')
  console.log(log.join('\n'))
  await browser.close()
  console.log('PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
