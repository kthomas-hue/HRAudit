import { describe, expect, it } from "vitest"
import { HR_SUPPORT, reviewMessages, submissionFromBody, type ReviewDelivery } from "./mail"

const raw = {
  name: "Alex Nguyen",
  email: "alex@harbour.example",
  phone: "0400000000",
  businessName: "Harbour & Co",
  state: "VIC",
  headcount: "under-15",
  award: "unsure",
  overall: 39,
  band: "low",
  headline: "Several core obligations look unsettled.",
  lede: "Work through the first actions in order.",
  dateLabel: "30 September 2026",
  priorities: [{ section: "Employment contracts", action: "Issue the missing contracts this week." }],
  sections: Array.from({ length: 12 }, (_, index) => ({
    title: index === 0 ? "Pay and entitlements" : `Section ${index}`,
    percent: index === 0 ? 20 : 80,
    band: index === 0 ? "low" : "high",
    reading: index === 0 ? "Pay is the area most likely to become an underpayment." : "In good shape.",
    actions: index === 0 ? ["Map every role to an award."] : [],
    impact: index === 0 ? "Mapping the award shows whether you are ahead or behind." : "",
    resources: index === 0 ? [{ title: "Pay and Conditions Tool", href: "https://calculate.fairwork.gov.au/" }] : [],
  })),
  notes: ["In Victoria, long service leave sits under the Long Service Leave Act 2018."],
}

describe("review email", () => {
  it("sends the report to the client and a notification to HR Support", () => {
    const parsed = submissionFromBody(raw)
    expect("error" in parsed).toBe(false)
    const delivery = parsed as ReviewDelivery
    expect(delivery.state).toBe("Victoria")
    expect(delivery.headcount).toContain("15")
    const messages = reviewMessages(delivery)

    expect(messages.client.to).toBe("alex@harbour.example")
    expect(messages.client.replyTo).toBe(HR_SUPPORT)
    expect(messages.client.subject).toContain("Harbour & Co")
    expect(messages.client.text).toContain("Pay is the area most likely to become an underpayment.")
    expect(messages.client.text).toContain("Map every role to an award.")
    expect(messages.client.text).toContain("https://calculate.fairwork.gov.au/")
    expect(messages.client.text).toContain("Long Service Leave Act 2018")

    expect(messages.notify.to).toBe(HR_SUPPORT)
    expect(messages.notify.replyTo).toBe("alex@harbour.example")
    expect(messages.notify.subject).toContain("finished")
    expect(messages.notify.text).toContain("This is the notification")
    expect(messages.notify.text).toContain("The full report was emailed to the client")
    expect(messages.notify.text).toContain("alex@harbour.example")
    expect(messages.notify.text).toContain("Pay and entitlements — 20")
    expect(messages.notify.text).not.toContain("Pay is the area most likely to become an underpayment.")
  })

  it("rejects a missing email and strips line breaks from the subject", () => {
    expect(submissionFromBody({ ...raw, email: "not-an-email" })).toEqual({
      error: "Enter a valid email address.",
    })
    const parsed = submissionFromBody({ ...raw, businessName: "Harbour\r\nBcc: someone@example.com" })
    const delivery = parsed as ReviewDelivery
    expect(delivery.businessName).not.toContain("\n")
    expect(reviewMessages(delivery).client.subject).not.toContain("\n")
  })
})
