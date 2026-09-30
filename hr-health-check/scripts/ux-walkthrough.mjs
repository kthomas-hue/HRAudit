import { chromium, devices } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const BASE = 'http://localhost:4174'
const OUT = '/opt/cursor/artifacts'
fs.mkdirSync(OUT, { recursive: true })

async function answerCurrentSection(page) {
  // Scale pips
  const scales = page.locator('.scale-input')
  const scaleCount = await scales.count()
  for (let i = 0; i < scaleCount; i++) {
    const pips = scales.nth(i).locator('.scale-input__pip')
    const n = await pips.count()
    await pips.nth(Math.min(6, n - 1)).click()
  }

  // Yes/No — pick Yes
  const yesnos = page.locator('.yesno')
  const ynCount = await yesnos.count()
  for (let i = 0; i < ynCount; i++) {
    await yesnos.nth(i).locator('.yesno__btn').first().click()
  }

  // Single choice — pick first option
  const singles = page.locator('.choice-list:not(.is-multi)')
  const sCount = await singles.count()
  for (let i = 0; i < sCount; i++) {
    await singles.nth(i).locator('.choice-list__item').first().click()
  }

  // Multi — pick first two if present
  const multis = page.locator('.choice-list.is-multi')
  const mCount = await multis.count()
  for (let i = 0; i < mCount; i++) {
    const items = multis.nth(i).locator('.choice-list__item')
    const ic = await items.count()
    if (ic > 0) await items.nth(0).click()
    if (ic > 1) await items.nth(1).click()
  }
}

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    recordVideo: { dir: path.join(OUT, 'pw-video'), size: { width: 1280, height: 820 } },
  })
  const page = await context.newPage()

  // Clear storage
  await page.goto(BASE)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('text=HR Health Check')

  await page.screenshot({ path: path.join(OUT, 'ux-01-landing.png'), fullPage: false })

  // Validation on contact
  await page.getByRole('button', { name: /Begin your HR Health Check/i }).click()
  await page.waitForSelector('text=Tell us who you are')
  await page.getByRole('button', { name: /Start the assessment/i }).click()
  await page.waitForSelector('.field-error')
  await page.screenshot({ path: path.join(OUT, 'ux-02-contact-validation.png') })

  await page.getByLabel('First name').fill('Alex')
  await page.getByLabel('Last name').fill('Morgan')
  await page.getByLabel('Email address').fill('alex@example.com')
  await page.getByPlaceholder('Enter your phone number').fill('0400 000 000')
  await page.getByLabel('Company name').fill('Acme Pty Ltd')
  await page.locator('.checkbox-field input').check()
  await page.getByRole('button', { name: /Start the assessment/i }).click()

  await page.waitForSelector('text=Pay & Entitlements')
  await page.screenshot({ path: path.join(OUT, 'ux-03-assessment-section1.png') })

  // Test incomplete next
  await page.getByRole('button', { name: /Next section/i }).click()
  await page.waitForSelector('.question-card.has-error, .field-error')
  await page.screenshot({ path: path.join(OUT, 'ux-04-validation-incomplete.png') })

  // Complete all 12 sections
  for (let section = 0; section < 12; section++) {
    await answerCurrentSection(page)
    if (section === 11) {
      const feedback = page.locator('textarea.text-area')
      if (await feedback.count()) {
        await feedback.fill('Helpful check — made us rethink our contracts.')
      }
      await page.screenshot({ path: path.join(OUT, 'ux-05-final-section.png') })
      await page.getByRole('button', { name: /Submit my answers/i }).click()
    } else {
      await page.getByRole('button', { name: /Next section/i }).click()
      await page.waitForTimeout(350)
    }
  }

  await page.waitForSelector('text=Your results are in')
  await page.screenshot({ path: path.join(OUT, 'ux-06-results-hero.png') })
  await page.locator('.results__body').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(OUT, 'ux-07-results-scorecard.png'), fullPage: false })

  // Open responses
  await page.locator('details.responses summary').click()
  await page.waitForTimeout(200)

  // Mobile viewport check
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(BASE)
  await page.waitForSelector('.landing__actions')
  await page.waitForTimeout(400)
  const bodyText = await page.locator('body').innerText()
  console.log('LANDING_SNIPPET', bodyText.slice(0, 500))
  await page.screenshot({ path: path.join(OUT, 'ux-08-mobile-resume.png') })
  const resumeBtn = page.getByRole('button', { name: /View your results|Continue where you left off/i })
  if (await resumeBtn.count()) {
    await resumeBtn.click()
    await page.waitForSelector('text=Your results are in')
    await page.screenshot({ path: path.join(OUT, 'ux-09-mobile-results.png') })
  } else {
    console.log('NO_RESUME_BUTTON')
    await page.screenshot({ path: path.join(OUT, 'ux-09-mobile-no-resume.png') })
  }

  const videoPath = await page.video()?.path()
  await context.close()
  await browser.close()

  if (videoPath) {
    const dest = path.join(OUT, 'hr-health-check-walkthrough.webm')
    fs.renameSync(videoPath, dest)
    console.log('VIDEO', dest)
  }
  console.log('DONE')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
