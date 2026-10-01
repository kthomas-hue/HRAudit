import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173'
const OUT = '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const log = []

  await page.goto(BASE)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('text=What you’ll walk away with')
  const panel = await page.locator('.landing__panel').innerText()
  log.push(`landing-has-self-audit: ${/self-audit|handle on their HR|tick-and-flick/i.test(panel)}`)
  log.push(`landing-no-25-100: ${!/25–100|25-100/.test(panel)}`)
  await page.screenshot({ path: `${OUT}/ux-landing-value.png` })

  await page.click('button:has-text("Start the Health Check")')
  await page.waitForSelector('text=your report')
  log.push('contact-report-copy: ok')

  // Seed completed assessment quickly via storage
  await page.goto(BASE)
  await page.waitForTimeout(400)
  await page.evaluate(() => {
    const pack = JSON.parse(localStorage.getItem('dreamstone-hr-content-pack-v3'))
    const answers = {}
    for (const q of pack.questions) {
      if (q.type === 'scale') answers[q.id] = 4
      else if (q.type === 'yesno') answers[q.id] = false
      else if (q.type === 'single') answers[q.id] = q.options?.[0]?.id
      else if (q.type === 'multi') answers[q.id] = []
    }
    localStorage.setItem(
      'dreamstone-hr-health-check-v2',
      JSON.stringify({
        step: 'landing',
        categoryIndex: 0,
        questionIndex: -1,
        contact: {
          firstName: 'Jordan',
          lastName: 'Lee',
          email: 'jordan@example.com',
          phone: '0400111222',
          company: 'Northside Ops',
        },
        answers,
        privacyAccepted: true,
        completedAt: new Date().toISOString(),
      }),
    )
    sessionStorage.clear()
  })
  await page.reload()
  await page.click('button:has-text("View your leadership report")')
  await page.waitForSelector('text=Download PDF report')
  await page.waitForSelector('text=Download action plan PDF')
  await page.waitForSelector('text=Download resources PDF')
  log.push('results-pdf-buttons: ok')

  // Check section intro not chapter
  await page.goto(BASE)
  await page.evaluate(() => {
    localStorage.removeItem('dreamstone-hr-health-check-v2')
    localStorage.setItem(
      'dreamstone-hr-health-check-v2',
      JSON.stringify({
        step: 'landing',
        categoryIndex: 0,
        questionIndex: -1,
        contact: {
          firstName: 'Jordan',
          lastName: 'Lee',
          email: 'jordan@example.com',
          phone: '',
          company: 'Northside Ops',
        },
        answers: { 'pay-fwa-familiarity': 3 },
        privacyAccepted: true,
      }),
    )
    sessionStorage.clear()
  })
  await page.reload()
  await page.waitForSelector('button:has-text("Continue where you left off"), button:has-text("View your leadership report")')
  const btnText = await page.locator('.landing__actions button').first().innerText()
  log.push(`resume-button: ${btnText.replace(/\n/g, ' ')}`)
  await page.locator('.landing__actions button').first().click()
  await page.waitForSelector('text=Section')
  const noChapter = (await page.locator('text=/Chapter/').count()) === 0
  log.push(`no-chapter-label: ${noChapter}`)
  const stakesClass = await page.locator('.wizard__stakes').count()
  log.push(`stakes-present: ${stakesClass > 0}`)
  await page.screenshot({ path: `${OUT}/ux-section-intro.png` })

  // If on intro, continue into first question
  if (await page.locator('button:has-text("Continue")').count()) {
    await page.click('button:has-text("Continue")')
  }
  await page.waitForSelector('.scale-list__option, .scale-input__pip')
  const scaleList = await page.locator('.scale-list__option').count()
  log.push(`descriptive-scale-options: ${scaleList}`)
  await page.screenshot({ path: `${OUT}/ux-descriptive-scale.png`, fullPage: false })

  writeFileSync(`${OUT}/ux-polish-log.txt`, log.join('\n') + '\n')
  console.log(log.join('\n'))
  if (scaleList < 8) throw new Error('Expected descriptive scale list')
  if (!noChapter) throw new Error('Chapter label still present')
  await browser.close()
  console.log('PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
