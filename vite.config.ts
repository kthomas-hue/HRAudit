/// <reference types="vitest/config" />
import fs from "node:fs"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import nodemailer from "nodemailer"
import { HR_SUPPORT, reviewMessages, submissionFromBody } from "./src/mail"

const recentSends = new Map<string, number[]>()

function tooMany(ip: string): boolean {
  const now = Date.now()
  const window = (recentSends.get(ip) ?? []).filter((at) => now - at < 60 * 60 * 1000)
  if (window.length >= 8) {
    recentSends.set(ip, window)
    return true
  }
  window.push(now)
  recentSends.set(ip, window)
  return false
}

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim()
  return req.socket.remoteAddress ?? "local"
}

async function sendMails(messages: ReturnType<typeof reviewMessages>): Promise<boolean> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    const dir = path.resolve(process.cwd(), "data/outbox")
    fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `${Date.now()}.json`)
    fs.writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), messages }, null, 2))
    return false
  }
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  })
  const from = process.env.MAIL_FROM ?? `DreamStoneHR <${user}>`
  await transport.sendMail({
    from,
    to: messages.client.to,
    replyTo: messages.client.replyTo,
    subject: messages.client.subject,
    text: messages.client.text,
  })
  await transport.sendMail({
    from,
    to: HR_SUPPORT,
    replyTo: messages.notify.replyTo,
    subject: messages.notify.subject,
    text: messages.notify.text,
  })
  return true
}

function leadsApi(): Plugin {
  const handle = (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") {
      res.statusCode = 405
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ error: "Method not allowed" }))
      return
    }
    if (tooMany(clientIp(req))) {
      res.statusCode = 429
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ error: "Too many reports from this network. The one on the page is still yours." }))
      return
    }
    const chunks: Buffer[] = []
    let size = 0
    req.on("data", (chunk: Buffer) => {
      size += chunk.length
      if (size > 400_000) {
        res.statusCode = 413
        res.end(JSON.stringify({ error: "Too large" }))
        req.destroy()
      } else {
        chunks.push(chunk)
      }
    })
    req.on("end", () => {
      void (async () => {
        if (res.writableEnded) return
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown
          const parsed = submissionFromBody(data)
          if ("error" in parsed) {
            res.statusCode = 400
            res.setHeader("content-type", "application/json")
            res.end(JSON.stringify({ error: parsed.error }))
            return
          }
          const messages = reviewMessages(parsed)
          const dir = path.resolve(process.cwd(), "data")
          fs.mkdirSync(dir, { recursive: true })
          fs.appendFileSync(
            path.join(dir, "leads.jsonl"),
            `${JSON.stringify({ at: new Date().toISOString(), name: parsed.name, email: parsed.email, phone: parsed.phone, businessName: parsed.businessName, overall: parsed.overall })}\n`,
          )
          const delivered = await sendMails(messages)
          res.statusCode = 200
          res.setHeader("content-type", "application/json")
          res.end(JSON.stringify({ ok: true, delivered }))
        } catch {
          if (res.writableEnded) return
          res.statusCode = 400
          res.setHeader("content-type", "application/json")
          res.end(JSON.stringify({ error: "We could not send that. The report is still on this page." }))
        }
      })()
    })
  }

  return {
    name: "leads-api",
    configureServer(server) {
      server.middlewares.use("/api/leads", handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/leads", handle)
    },
  }
}

export default defineConfig({
  plugins: [react(), leadsApi()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
