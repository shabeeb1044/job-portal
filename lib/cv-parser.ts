/**
 * cv-parser.ts
 * Robust text extraction from PDF / DOC / DOCX buffers.
 *
 * Strategy per format:
 *  PDF   → pdf-parse  →  fallback: scan raw buffer for readable ASCII text
 *  DOCX  → mammoth    →  fallback: unzip + read word/document.xml as plain text
 *  DOC   → mammoth    →  fallback: scan raw buffer for readable ASCII text
 *
 * No hard dependency on any package – every path has a pure-Node fallback.
 */
/// <reference path="../types/adm-zip.d.ts" />

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

/** Scan a raw buffer and pull out readable ASCII / Latin strings (≥4 chars). */
function extractReadableStrings(buffer: Buffer, minLen = 4): string {
  const chunks: string[] = []
  let current = ''

  for (let i = 0; i < buffer.length; i++) {
    const c = buffer[i]
    // Printable ASCII + common Latin extended
    if ((c >= 0x20 && c <= 0x7e) || c === 0x09 || c === 0x0a || c === 0x0d) {
      current += String.fromCharCode(c)
    } else {
      if (current.length >= minLen) chunks.push(current.trim())
      current = ''
    }
  }
  if (current.length >= minLen) chunks.push(current.trim())

  return chunks.filter(Boolean).join(' ')
}

/** Extract plain text from a DOCX buffer without mammoth (pure unzip → XML). */
async function extractDocxFallback(buffer: Buffer): Promise<string> {
  try {
    // DOCX is a ZIP – find word/document.xml using adm-zip (pure JS, bundles in Next.js)
    const mod = await import('adm-zip')
    const AdmZip = (mod as { default?: unknown }).default ?? mod
    const zip = new (AdmZip as new (buf: Buffer) => { getEntries(): { entryName: string; getData(): Buffer }[] })(buffer)
    const entries = zip.getEntries()
    for (const entry of entries) {
      const name = entry.entryName
      if (name === 'word/document.xml' || name === 'word/document2.xml') {
        const xml = entry.getData().toString('utf8')
        const text = xml
          .replace(/<w:p[ >]/g, '\n<w:p ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x[0-9a-fA-F]+;/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
        return text
      }
    }
    return extractReadableStrings(buffer)
  } catch {
    return extractReadableStrings(buffer)
  }
}

/**
 * Extract plain text from a PDF / DOC / DOCX buffer.
 * Never throws – always returns a string (may be empty).
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const type = (mimeType ?? '').toLowerCase()

  // ── PDF ──────────────────────────────────────────────────────────────────
  if (type.includes('pdf')) {
    try {
      const mod = await import('pdf-parse')
      const pdfParse = (mod as any).default ?? mod
      if (typeof pdfParse === 'function') {
        const data = await pdfParse(buffer)
        const text = (data?.text ?? '').trim()
        if (text.length > 50) return text
      }
    } catch { /* pdf-parse unavailable or failed */ }

    // Fallback: pull readable strings from raw bytes
    return extractReadableStrings(buffer)
  }

  // ── DOCX ─────────────────────────────────────────────────────────────────
  if (type.includes('wordprocessingml') || type.includes('openxmlformats')) {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const text = (result?.value ?? '').trim()
      if (text.length > 20) return text
    } catch { /* mammoth unavailable */ }

    return extractDocxFallback(buffer)
  }

  // ── Legacy DOC ───────────────────────────────────────────────────────────
  if (type.includes('msword')) {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const text = (result?.value ?? '').trim()
      if (text.length > 20) return text
    } catch { /* mammoth unavailable */ }

    return extractReadableStrings(buffer)
  }

  // Unknown type – best-effort scan
  return extractReadableStrings(buffer)
}

// ---------------------------------------------------------------------------
// CV field parsing
// ---------------------------------------------------------------------------

export interface ParsedCV {
  name: string
  email: string
  phone: string
  skills: string[]
  experience: string
  education: string
  summary: string
}

// Regexes
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// Broad international phone: 10–15 digits optionally separated by spaces/dashes/parens/dots
const PHONE_RE =
  /(?:\+?(\d{1,3})[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{4}/g

// Section header patterns (case-insensitive)
const SECTION = (names: string[]) =>
  new RegExp(
    `(?:^|\\n)\\s*(?:${names.join('|')})\\s*[:\\-]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:${KNOWN_SECTIONS})|$)`,
    'im'
  )

const KNOWN_SECTIONS =
  'summary|profile|objective|experience|work|employment|education|skills?|competenc|expertise|certification|language|reference|project|award|volunteer|publication|interest|hobbies'

const SKILL_KEYWORDS = [
  // common tech / general skill indicators
  'javascript','typescript','python','java','c\\+\\+','c#','php','ruby','swift','kotlin',
  'react','angular','vue','node','express','django','flask','spring','laravel',
  'sql','mysql','postgresql','mongodb','redis','elasticsearch','firebase',
  'aws','azure','gcp','docker','kubernetes','terraform','git','linux',
  'html','css','sass','tailwind','figma','photoshop','illustrator',
  'excel','powerpoint','word','tableau','power bi','looker',
  'project management','agile','scrum','kanban','jira','confluence',
  'communication','leadership','teamwork','problem.solving','analytical',
]

/**
 * Pull a named section from CV text.
 * Returns the raw text block or empty string.
 */
function getSection(text: string, headings: string[]): string {
  const pattern = new RegExp(
    `(?:^|\\n)[ \\t]*(?:${headings.join('|')})[ \\t]*[:\\-]?[ \\t]*\\n([\\s\\S]*?)` +
      `(?=\\n[ \\t]*(?:${KNOWN_SECTIONS})[ \\t]*[:\\-]?[ \\t]*\\n|$)`,
    'im'
  )
  const m = text.match(pattern)
  return m ? m[1].trim() : ''
}

/**
 * Attempt to identify the candidate's name.
 * Heuristic order:
 *  1. Explicit "Name: ..." label
 *  2. First non-empty line that looks like a human name
 *  3. Filename stem
 */
function parseName(text: string, fallbackFileName?: string): string {
  // 1. Labelled name
  const labelled = text.match(/^[ \t]*(?:full\s+)?name\s*[:\-][ \t]*(.+)/im)
  if (labelled) return labelled[1].trim().slice(0, 100)

  // 2. First plausible name line (2-4 words, all title-cased or upper-cased)
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 80)

  for (const line of lines.slice(0, 10)) {
    if (line.includes('@')) continue
    if (/^\d/.test(line)) continue
    if (/(?:resume|curriculum|vitae|cv|profile|summary|objective)/i.test(line)) continue
    // 2-4 "words" each starting with capital (or all-caps)
    const words = line.split(/\s+/)
    if (
      words.length >= 2 &&
      words.length <= 5 &&
      words.every((w) => /^[A-Z][a-zA-Z\-']+$|^[A-Z]+$/.test(w))
    ) {
      return line.slice(0, 100)
    }
  }

  // 3. Filename
  if (fallbackFileName) {
    const base = fallbackFileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .trim()
    if (base.length > 1) return base.slice(0, 80)
  }

  return 'Unknown Candidate'
}

/**
 * Parse skills from the dedicated section, or scan the whole document
 * for known tech/soft-skill keywords as a fallback.
 */
function parseSkills(text: string): string[] {
  const section = getSection(text, ['skills?', 'competencies', 'expertise', 'technical skills?'])

  const raw = section || text
  const found = new Set<string>()

  // Match known keywords
  for (const kw of SKILL_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`, 'i')
    if (re.test(raw)) found.add(kw.replace(/\\/g, ''))
  }

  // Also tokenise the skill section into short tokens
  if (section) {
    section
      .split(/[,;|\n\r•▪·\-–—]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 50)
      .slice(0, 40)
      .forEach((s) => found.add(s))
  }

  return [...found].slice(0, 50)
}

/**
 * Parse the experience / work history section.
 */
function parseExperience(text: string): string {
  const section = getSection(text, [
    'experience',
    'work experience',
    'work history',
    'employment',
    'professional experience',
    'career history',
  ])
  return section.replace(/\s+/g, ' ').slice(0, 800)
}

/**
 * Parse education section.
 */
function parseEducation(text: string): string {
  const section = getSection(text, ['education', 'academic', 'qualifications?', 'degrees?'])
  return section.replace(/\s+/g, ' ').slice(0, 400)
}

/**
 * Parse professional summary / objective.
 */
function parseSummary(text: string): string {
  const section = getSection(text, [
    'summary',
    'profile',
    'professional summary',
    'career objective',
    'objective',
    'about me',
    'personal statement',
  ])
  return section.replace(/\s+/g, ' ').slice(0, 500)
}

/**
 * Main entry point: parse all CV fields from extracted text.
 */
export function parseCandidateFromText(
  text: string,
  fallbackFileName?: string
): ParsedCV {
  // Normalise line endings, cap length
  const t = (typeof text === 'string' ? text : '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .slice(0, 20000)

  // Email
  const emails = t.match(EMAIL_RE) ?? []
  const email = (emails[0] ?? '').toLowerCase().trim()

  // Phone – find all matches, prefer the longest / most formatted one
  const phoneMatches = [...(t.matchAll(new RegExp(PHONE_RE.source, 'g')))].map(
    (m) => m[0].replace(/\s+/g, ' ').trim()
  )
  const phone =
    phoneMatches.sort((a, b) => b.length - a.length)[0]?.slice(0, 30) ?? ''

  return {
    name: parseName(t, fallbackFileName),
    email,
    phone,
    skills: parseSkills(t),
    experience: parseExperience(t),
    education: parseEducation(t),
    summary: parseSummary(t),
  }
}