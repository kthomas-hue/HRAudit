import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173'
const OUT = '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const log = []

  await page.goto(BASE)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
  await page.waitForSelector('text=Start the Health Check')

  const landing = await page.locator('.landing').innerText()
  const hasAudience = /business leaders, founders & owners/i.test(landing)
  const noTitles = !/\bGMs?\b|\bCEOs?\b/i.test(landing)
  const diverse = /retail|trade|hospitality|healthcare|every size|every shape|sector/i.test(landing)
  const mentionsAi = /AI at work/i.test(landing)
  log.push(`landing-audience: ${hasAudience}`)
  log.push(`landing-no-titles: ${noTitles}`)
  log.push(`landing-diverse: ${diverse}`)
  log.push(`landing-mentions-ai: ${mentionsAi}`)
  await page.screenshot({ path: `${OUT}/audience-landing.png`, fullPage: true })

  await page.click('button:has-text("Start the Health Check")')
  await page.waitForSelector('text=your report')
  const contact = await page.locator('.contact-panel').innerText()
  log.push(`contact-audience: ${/business leaders, founders and owners/i.test(contact)}`)
  log.push(`contact-diverse: ${/industries and team sizes/i.test(contact)}`)
  await page.screenshot({ path: `${OUT}/audience-contact.png` })

  // Seed completed assessment including AI category via content pack v3
  await page.goto(BASE)
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    const packRaw = localStorage.getItem('dreamstone-hr-content-pack-v4')
    if (!packRaw) throw new Error('content pack v3 missing')
    const pack = JSON.parse(packRaw)
    const answers = {}
    for (const q of pack.questions) {
      if (q.type === 'scale') answers[q.id] = 5
      else if (q.type === 'yesno') answers[q.id] = true
      else if (q.type === 'single') answers[q.id] = q.options?.[0]?.id
      else if (q.type === 'multi') {
        answers[q.id] = q.options?.find((o) => !o.isGap)?.id
          ? [q.options.find((o) => !o.isGap).id]
          : []
      }
    }
    localStorage.setItem(
      'dreamstone-hr-health-check-v2',
      JSON.stringify({
        step: 'landing',
        categoryIndex: 0,
        questionIndex: -1,
        contact: {
          firstName: 'Alex',
          lastName: 'Rivera',
          email: 'alex@example.com',
          phone: '0400111222',
          company: 'Rivera Trading',
        },
        answers,
        privacyAccepted: true,
        completedAt: new Date().toISOString(),
      }),
    )
  })
  await page.reload()
  await page.waitForSelector('button:has-text("View your leadership report")')
  await page.click('button:has-text("View your leadership report")')
  await page.waitForSelector('text=Your leadership report')

  const results = await page.locator('.results, main, body').first().innerText()
  const hasAiCategory = /AI at Work/i.test(results)
  log.push(`results-ai-category: ${hasAiCategory}`)
  log.push(`results-no-gm-ceo: ${!/\bGMs?\b|\bCEOs?\b/i.test(results)}`)
  log.push(`results-focus-first: ${/Focus first/i.test(results) && /response confidence|Exposure if left alone/i.test(results)}`)
  log.push(`results-human-ai: ${/human judgment|Human–AI|Human-AI|named owner/i.test(results)}`)

  // Jump to AI detail if scorecard link exists
  const aiJump = page.locator('button, a', { hasText: /AI/i }).first()
  if (await aiJump.count()) {
    await aiJump.click().catch(() => {})
  }
  await page.screenshot({ path: `${OUT}/audience-results-ai.png`, fullPage: true })

  // Admin: confirm AI category in CMS
  await page.goto(`${BASE}/admin`)
  await page.waitForTimeout(600)
  const pwd = page.locator('input[type="password"]')
  if (await pwd.count()) {
    await pwd.fill('dreamstone')
    const submit = page.locator('button[type="submit"], button:has-text("Enter"), button:has-text("Sign in"), button:has-text("Log in")')
    if (await submit.count()) await submit.first().click()
    else await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
  await page.getByRole('button', { name: /Categories/i }).click()
  await page.waitForSelector('text=AI at Work')
  log.push('admin-ai-category: ok')
  await page.screenshot({ path: `${OUT}/audience-admin-ai-category.png` })

  await page.getByRole('button', { name: /Questions/i }).click()
  await page.waitForSelector('text=Optional feedback question')
  const catSelect = page.locator('.admin-inline select').first()
  await catSelect.selectOption('ai')
  await page.waitForSelector('text=acceptable AI use')
  const qText = await page.locator('.admin-list').innerText()
  log.push(
    `admin-ai-questions: ${/acceptable AI use|human judgment|named person accountable|How clear is your business about where AI/i.test(qText)}`,
  )
  log.push(
    `admin-ai-question-count: ${qText.split('\n').filter((l) => /^\d+\./.test(l.trim())).length >= 8}`,
  )
  await page.screenshot({ path: `${OUT}/audience-admin-ai-questions.png` })

  writeFileSync(`${OUT}/verify-ai-audience.log`, log.join('\n') + '\n')
  console.log(log.join('\n'))

  const failed = log.some((l) => /: false$|: missing/i.test(l) || l.includes('Error'))
  await browser.close()
  if (failed) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
