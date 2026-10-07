import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:4173'

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-position=0,0', '--window-size=1400,900'],
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

  await page.goto(`${BASE}/admin`)
  await sleep(600)
  await page.fill('input[type="password"]', 'dreamstone')
  await sleep(300)
  await page.click('button:has-text("Enter admin")')
  await page.waitForSelector('text=Health Check admin')
  await sleep(700)
  await page.click('button.admin-tab:has-text("Responses")')
  await page.waitForSelector('text=Client responses')
  await sleep(800)
  const first = page.locator('.responses-list button').first()
  if (await first.count()) {
    await first.click()
    await sleep(1000)
    await page.mouse.wheel(0, 350)
    await sleep(900)
    await page.mouse.wheel(0, 400)
    await sleep(1000)
  }
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
