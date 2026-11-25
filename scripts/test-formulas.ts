import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import katex from 'katex'
import 'katex/contrib/mhchem'

const ROOT = process.cwd()

const CONTROL_CHAR_RE = /[\x07-\x09\x0b-\x1f]/
const MISSING_SLASH_RE = /(?<![\\a-zA-Z])(cdot|sqrt|frac|approx|circ|Rightarrow|Omega|mathrm|piint|pileft|tanwidehat)(?![a-zA-Z])|(?<![\\a-zA-Z])text\{|(?<![\\a-zA-Z0-9])pi(?![a-zA-Z0-9])/
const FORMULA_RE = /\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g

interface FormulaError {
  file: string
  reason: string
  formula: string
}

function listFiles(dir: string, exts: string[]): string[] {
  const fullDir = path.join(ROOT, dir)
  if (!fs.existsSync(fullDir)) return []
  return fs
    .readdirSync(fullDir, { withFileTypes: true })
    .filter((d) => d.isFile() && exts.some((ext) => d.name.endsWith(ext)))
    .map((d) => path.join(fullDir, d.name))
    .sort()
}

function walkStrings(value: unknown, onString: (s: string) => void, seen = new Set<object>()): void {
  if (typeof value === 'string') {
    onString(value)
    return
  }
  if (!value || typeof value !== 'object') return
  if (seen.has(value)) return
  seen.add(value)
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, onString, seen)
    return
  }
  for (const v of Object.values(value)) {
    walkStrings(v, onString, seen)
  }
}

function checkString(relFile: string, text: string, errors: FormulaError[]): void {
  FORMULA_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FORMULA_RE.exec(text)) !== null) {
    const isDisplay = match[1] !== undefined
    const formula = match[1] ?? match[2] ?? ''
    const raw = match[0]

    const ctrl = CONTROL_CHAR_RE.exec(formula)
    if (ctrl) {
      const code = ctrl[0].charCodeAt(0).toString(16).padStart(4, '0')
      errors.push({ file: relFile, reason: `ký tự điều khiển \\u${code}`, formula: raw })
      continue
    }

    const missing = MISSING_SLASH_RE.exec(formula)
    if (missing) {
      errors.push({ file: relFile, reason: `lệnh mất dấu \\ (${missing[0]})`, formula: raw })
      continue
    }

    try {
      katex.renderToString(formula, { throwOnError: true, strict: false, displayMode: isDisplay })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push({ file: relFile, reason: `KaTeX lỗi: ${msg}`, formula: raw })
    }
  }
}

async function loadFileData(absPath: string): Promise<unknown> {
  if (absPath.endsWith('.json')) {
    let raw = fs.readFileSync(absPath, 'utf8')
    if (path.basename(absPath) === 'khung_G.json') {
      raw += ']}'
    }
    return JSON.parse(raw)
  }
  return await import(pathToFileURL(absPath).href)
}

async function main(): Promise<void> {
  const files = [
    ...listFiles('src/data', ['.ts', '.json']),
    ...listFiles('scripts/bank/new', ['.json']),
    ...listFiles('scripts/khung/ban-goc', ['.json']),
  ]

  const errors: FormulaError[] = []

  for (const absPath of files) {
    const relFile = path.relative(ROOT, absPath).replace(/\\/g, '/')
    const data = await loadFileData(absPath)
    walkStrings(data, (text) => checkString(relFile, text, errors))
  }

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`[${err.file}] ${err.reason} | ${JSON.stringify(err.formula)}`)
    }
    console.error(`\nTổng số công thức lỗi: ${errors.length}`)
    process.exit(1)
  }

  console.log(`Đã kiểm tra ${files.length} file: 0 lỗi công thức.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
