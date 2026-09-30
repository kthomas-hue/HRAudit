/// <reference types="vitest/config" />
import fs from "node:fs"
import path from "node:path"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

function leadsApi(): Plugin {
  return {
    name: "leads-api",
    configureServer(server) {
      server.middlewares.use("/api/leads", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405
          res.setHeader("content-type", "application/json")
          res.end(JSON.stringify({ error: "Method not allowed" }))
          return
        }
        const chunks: Buffer[] = []
        let size = 0
        req.on("data", (chunk: Buffer) => {
          size += chunk.length
          if (size > 100_000) {
            res.statusCode = 413
            res.end(JSON.stringify({ error: "Too large" }))
            req.destroy()
            return
          }
          chunks.push(chunk)
        })
        req.on("end", () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>
            const email = String(data.email ?? "")
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              res.statusCode = 400
              res.setHeader("content-type", "application/json")
              res.end(JSON.stringify({ error: "Enter a valid email address." }))
              return
            }
            const record = {
              at: new Date().toISOString(),
              name: String(data.name ?? "").slice(0, 200),
              email: email.slice(0, 200),
              phone: String(data.phone ?? "").slice(0, 50),
              businessName: String(data.businessName ?? "").slice(0, 200),
              state: data.state ?? null,
              headcount: data.headcount ?? null,
              award: data.award ?? null,
              overall: data.overall ?? null,
              sections: data.sections ?? [],
              priorities: data.priorities ?? [],
            }
            const dir = path.resolve(process.cwd(), "data")
            fs.mkdirSync(dir, { recursive: true })
            fs.appendFileSync(path.join(dir, "leads.jsonl"), `${JSON.stringify(record)}\n`)
            res.statusCode = 200
            res.setHeader("content-type", "application/json")
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 400
            res.setHeader("content-type", "application/json")
            res.end(JSON.stringify({ error: "We could not save that." }))
          }
        })
      })
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
