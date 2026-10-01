import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const BASE = 'http://localhost:4173'
const OUT = '/opt/cursor/artifacts'
fs.mkdirSync(OUT, { recursive: true })

async function currentQuestionId(page) {
  const el = page.locator('.question-card.is-focused')
  if (!(await el.count())) return null
  return el.getAttribute('id')
}

async function waitForQuestionChange(page, prevId) {
  await page.waitForFunction(
    (id) => {
      const el = document.querySelector('.question-card.is-focused')
      if (!el) return !!document.querySelector('.wizard__intro') || !!document.body.innerText.includes('Your results are in')
      return el.id !== id
    },
    prevId,
    { timeout: 8000 },
  ).catch(() => {})
}

async function answerCurrentQuestion(page) {
  if (await page.locator('text=Your results are in').count()) return 'done'
  if (await page.locator('.wizard__intro').count()) {
    await page.getByRole('button', { name: /^Continue$/i }).click()
    await page.waitForSelector('.question-card.is-focused', { timeout: 5000 })
    return 'intro'
  }

  const prevId = await currentQuestionId(page)

  if (await page.getByRole('button', { name: /See my results/i }).count()) {
    await page.getByRole('button', { name: /See my results/i }).click()
    return 'submit'
  }

  const scale = page.locator('.scale-input__pip')
  if (await scale.count()) {
    await scale.nth(6).click({ force: true })
    await waitForQuestionChange(page, prevId)
    return 'scale'
  }

  const yes = page.locator('.yesno__btn').first()
  if (await yes.count()) {
    await yes.click({ force: true })
    await waitForQuestionChange(page, prevId)
    return 'yesno'
  }

  const single = page.locator('.choice-list:not(.is-multi) .choice-list__item').first()
  if (await single.count()) {
    await single.click({ force: true })
    await waitForQuestionChange(page, prevId)
    return 'single'
  }

  const multi = page.locator('.choice-list.is-multi .choice-list__item')
  if (await multi.count()) {
    await multi.nth(0).click({ force: true })
    await page.getByRole('button', { name: /^Continue$/i }).click()
    await waitForQuestionChange(page, prevId)
    return 'multi'
  }

  const text = page.locator('textarea.text-area')
  if (await text.count()) {
    await text.fill('Helpful, calm experience — contracts stood out.')
    await page.getByRole('button', { name: /See my results|Continue/i }).click()
    await page.waitForTimeout(400)
    return 'text'
  }

  // Fallback continue
  const cont = page.getByRole('button', { name: /^Continue$/i })
  if (await cont.count()) {
    await cont.click()
    await page.waitForTimeout(250)
  }
  return 'unknown'
}

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    recordVideo: { dir: path.join(OUT, 'pw-video'), size: { width: 1280, height: 820 } },
  })
  const page = await context.newPage()

  await page.goto(BASE)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('text=Know where your HR is')
  await page.screenshot({ path: path.join(OUT, 'v3_landing.png'), fullPage: false })

  await page.getByRole('button', { name: /Start the Health Check|Begin your HR Health Check/i }).click()
  await page.waitForSelector('text=your brief')
  await page.screenshot({ path: path.join(OUT, 'v3_contact.png') })

  await page.getByLabel('First name').fill('Alex')
  await page.getByLabel('Last name').fill('Morgan')
  await page.getByLabel('Email address').fill('alex@example.com')
  await page.getByPlaceholder('Enter your phone number').fill('0400 000 000')
  await page.getByLabel('Company name').fill('Acme Pty Ltd')
  await page.locator('.checkbox-field input').check()
  await page.getByRole('button', { name: /Start the assessment/i }).click()

  await page.waitForSelector('text=Chapter 1')
  await page.screenshot({ path: path.join(OUT, 'v3_chapter_intro.png') })
  await page.getByRole('button', { name: /^Continue$/i }).click()
  await page.waitForSelector('.question-card.is-focused')
  await page.screenshot({ path: path.join(OUT, 'v3_question.png') })

  for (let i = 0; i < 130; i++) {
    if (await page.locator('text=Your results are in').count()) break
    const kind = await answerCurrentQuestion(page)
    if (kind === 'done') break
  }

  await page.waitForSelector('text=Your leadership brief', { timeout: 15000 })
  await page.screenshot({ path: path.join(OUT, 'v3_results.png') })
  await page.locator('.action-grid').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(OUT, 'v3_results_actions.png') })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(BASE)
  await page.waitForSelector('text=View your leadership brief')
  await page.screenshot({ path: path.join(OUT, 'v3_mobile_landing.png') })
  await page.getByRole('button', { name: /View your leadership brief/i }).click()
  await page.waitForSelector('text=Your leadership brief')
  await page.screenshot({ path: path.join(OUT, 'v3_mobile_results.png') })

  const videoPath = await page.video()?.path()
  await context.close()
  await browser.close()

  if (videoPath) {
    const dest = path.join(OUT, 'hr_health_check_leader_brief.webm')
    fs.renameSync(videoPath, dest)
    console.log('VIDEO', dest)
  }
  console.log('DONE')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
