import { jsPDF } from 'jspdf'

export type PdfAssets = {
  logoFull: string
  logoMark: string
  fontsReady: boolean
}

let cache: PdfAssets | null = null
let loading: Promise<PdfAssets> | null = null

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url}`)
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Load logo + brand fonts once, then reuse for every PDF download. */
export async function loadPdfAssets(): Promise<PdfAssets> {
  if (cache) return cache
  if (loading) return loading

  loading = (async () => {
    const [logoFull, logoMark, jakartaReg, jakartaBold, outfitSemi, outfitBold] = await Promise.all([
      fetchAsDataUrl('/logo-full.png'),
      fetchAsDataUrl('/logo-mark.png'),
      fetchAsBase64('/fonts/PlusJakartaSans-Regular.ttf'),
      fetchAsBase64('/fonts/PlusJakartaSans-Bold.ttf'),
      fetchAsBase64('/fonts/Outfit-SemiBold.ttf'),
      fetchAsBase64('/fonts/Outfit-Bold.ttf'),
    ])

    cache = {
      logoFull,
      logoMark,
      fontsReady: Boolean(jakartaReg && jakartaBold && outfitSemi && outfitBold),
    }

    // Register on a throwaway doc so subsequent docs can addFont from VFS by name.
    // Each jsPDF instance needs addFont called; we stash base64 on the cache object.
    ;(cache as PdfAssets & { _fonts?: Record<string, string> })._fonts = {
      'PlusJakartaSans-Regular.ttf': jakartaReg,
      'PlusJakartaSans-Bold.ttf': jakartaBold,
      'Outfit-SemiBold.ttf': outfitSemi,
      'Outfit-Bold.ttf': outfitBold,
    }

    return cache
  })()

  try {
    return await loading
  } finally {
    loading = null
  }
}

export function registerPdfFonts(doc: jsPDF, assets: PdfAssets) {
  const fonts = (assets as PdfAssets & { _fonts?: Record<string, string> })._fonts
  if (!fonts) return false

  doc.addFileToVFS('PlusJakartaSans-Regular.ttf', fonts['PlusJakartaSans-Regular.ttf'])
  doc.addFont('PlusJakartaSans-Regular.ttf', 'Jakarta', 'normal')
  doc.addFileToVFS('PlusJakartaSans-Bold.ttf', fonts['PlusJakartaSans-Bold.ttf'])
  doc.addFont('PlusJakartaSans-Bold.ttf', 'Jakarta', 'bold')

  doc.addFileToVFS('Outfit-SemiBold.ttf', fonts['Outfit-SemiBold.ttf'])
  doc.addFont('Outfit-SemiBold.ttf', 'Outfit', 'normal')
  doc.addFileToVFS('Outfit-Bold.ttf', fonts['Outfit-Bold.ttf'])
  doc.addFont('Outfit-Bold.ttf', 'Outfit', 'bold')

  return true
}

/** Replace characters often missing from latin font subsets. */
export function pdfSafe(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, ' - ')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
}
