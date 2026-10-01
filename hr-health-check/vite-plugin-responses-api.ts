import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

type Submission = {
  id: string
  createdAt: string
  contact: Record<string, unknown>
  answers: Record<string, unknown>
  snapshot: Record<string, unknown>
  contentUpdatedAt?: string
}

function dataPath(root: string) {
  return path.join(root, 'data', 'responses.json')
}

function ensureStore(root: string) {
  const file = dataPath(root)
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ submissions: [] }, null, 2))
  }
  return file
}

function readStore(root: string): { submissions: Submission[] } {
  const file = ensureStore(root)
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as { submissions?: Submission[] }
    return { submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [] }
  } catch {
    return { submissions: [] }
  }
}

function writeStore(root: string, store: { submissions: Submission[] }) {
  const file = ensureStore(root)
  fs.writeFileSync(file, JSON.stringify(store, null, 2))
}

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function attachApi(middlewares: { use: Function }, root: string) {
  middlewares.use(async (req: import('http').IncomingMessage, res: import('http').ServerResponse, next: () => void) => {
    const url = req.url || ''
    if (!url.startsWith('/api/responses')) return next()

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')

    try {
      if (req.method === 'GET' && (url === '/api/responses' || url.startsWith('/api/responses?'))) {
        const store = readStore(root)
        res.statusCode = 200
        res.end(JSON.stringify(store))
        return
      }

      const oneMatch = url.match(/^\/api\/responses\/([^/?#]+)/)
      if (req.method === 'GET' && oneMatch) {
        const id = decodeURIComponent(oneMatch[1])
        const found = readStore(root).submissions.find((s) => s.id === id)
        if (!found) {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Not found' }))
          return
        }
        res.statusCode = 200
        res.end(JSON.stringify(found))
        return
      }

      if (req.method === 'POST' && (url === '/api/responses' || url.startsWith('/api/responses?'))) {
        const raw = await readBody(req)
        const body = JSON.parse(raw) as Submission
        if (!body?.id || !body?.contact || !body?.answers || !body?.snapshot) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Invalid submission' }))
          return
        }
        const store = readStore(root)
        store.submissions = [body, ...store.submissions.filter((s) => s.id !== body.id)]
        writeStore(root, store)
        res.statusCode = 201
        res.end(JSON.stringify({ ok: true, id: body.id }))
        return
      }

      if (req.method === 'DELETE' && oneMatch) {
        const id = decodeURIComponent(oneMatch[1])
        const store = readStore(root)
        store.submissions = store.submissions.filter((s) => s.id !== id)
        writeStore(root, store)
        res.statusCode = 200
        res.end(JSON.stringify({ ok: true }))
        return
      }

      res.statusCode = 405
      res.end(JSON.stringify({ error: 'Method not allowed' }))
    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Server error' }))
    }
  })
}

/** Local JSON file API so admin can see submissions across browsers while testing. */
export function responsesApiPlugin(): Plugin {
  return {
    name: 'dreamstone-responses-api',
    configureServer(server) {
      attachApi(server.middlewares, server.config.root)
    },
    configurePreviewServer(server) {
      attachApi(server.middlewares, server.config.root)
    },
  }
}
