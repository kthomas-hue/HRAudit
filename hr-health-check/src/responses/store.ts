import type { ClientSubmission } from './types'
import { RESPONSES_STORAGE_KEY } from './types'

function readLocal(): ClientSubmission[] {
  try {
    const raw = localStorage.getItem(RESPONSES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClientSubmission[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(list: ClientSubmission[]) {
  localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(list))
}

function mergeById(primary: ClientSubmission[], secondary: ClientSubmission[]): ClientSubmission[] {
  const map = new Map<string, ClientSubmission>()
  for (const s of [...secondary, ...primary]) map.set(s.id, s)
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function apiList(): Promise<ClientSubmission[] | null> {
  try {
    const res = await fetch('/api/responses')
    if (!res.ok) return null
    const data = (await res.json()) as { submissions?: ClientSubmission[] }
    return Array.isArray(data.submissions) ? data.submissions : []
  } catch {
    return null
  }
}

async function apiCreate(submission: ClientSubmission): Promise<boolean> {
  try {
    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    })
    return res.ok
  } catch {
    return false
  }
}

async function apiDelete(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/responses/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export async function listSubmissions(): Promise<ClientSubmission[]> {
  const local = readLocal()
  const remote = await apiList()
  if (remote === null) return local
  const merged = mergeById(remote, local)
  writeLocal(merged)
  return merged
}

export async function saveSubmission(submission: ClientSubmission): Promise<ClientSubmission> {
  const local = readLocal().filter((s) => s.id !== submission.id)
  local.unshift(submission)
  writeLocal(local)
  await apiCreate(submission)
  return submission
}

export async function deleteSubmission(id: string): Promise<void> {
  writeLocal(readLocal().filter((s) => s.id !== id))
  await apiDelete(id)
}

export function exportSubmissionsCsv(submissions: ClientSubmission[]): string {
  const header = [
    'id',
    'createdAt',
    'firstName',
    'lastName',
    'email',
    'phone',
    'company',
    'overall',
    'band',
    'topPriority',
  ]
  const rows = submissions.map((s) =>
    [
      s.id,
      s.createdAt,
      s.contact.firstName,
      s.contact.lastName,
      s.contact.email,
      s.contact.phone,
      s.contact.company,
      s.snapshot.overall,
      s.snapshot.bandLabel,
      s.snapshot.priorities[0]?.name ?? '',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  )
  return [header.join(','), ...rows].join('\n')
}

export function downloadBlob(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
