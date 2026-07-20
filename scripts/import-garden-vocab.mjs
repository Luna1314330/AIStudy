#!/usr/bin/env node
/**
 * 初始花园 · 核心词 CSV 工具
 *
 * 导出 72 本书 Excel 模板（宽表，一行一本书，最多 6 组词）：
 *   npm run vocab:books
 *
 * 从 CSV 导入核心词：
 *   npm run vocab:import -- data/templates/gardenBookVocab.fill.csv
 *
 * 支持两种 CSV 格式：
 *   1. 宽表：bookId + 词1英文/词1中文 … 词6英文/词6中文
 *   2. 长表：bookId + wordEn + wordCn（同一本书多行）
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const KINGDOM_PATH = path.join(ROOT, 'src/data/englishReadingKingdom.json')
const VOCAB_PATH = path.join(ROOT, 'src/data/gardenBookVocab.json')
const TEMPLATES_DIR = path.join(ROOT, 'data/templates')
const BOOK_LIST_PATH = path.join(TEMPLATES_DIR, 'gardenBookList.reference.csv')
const TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'gardenBookVocab.template.csv')
const WORD_SLOTS = 13

function getWideWordSlotCount(header) {
  let max = 0
  for (const key of Object.keys(header)) {
    const match = key.match(/^词(\d+)英文$/)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return max || WORD_SLOTS
}

const CSV_BOM = '\uFEFF'

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function escapeCsv(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toCsvRow(cells) {
  return cells.map(escapeCsv).join(',')
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i += 1
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && next === '\n') i += 1
      row.push(cell)
      cell = ''
      if (row.some((item) => item.trim() !== '')) rows.push(row)
      row = []
      continue
    }

    cell += ch
  }

  if (cell.length || row.length) {
    row.push(cell)
    if (row.some((item) => item.trim() !== '')) rows.push(row)
  }

  return rows
}

function getGardenBooks() {
  const kingdom = readJson(KINGDOM_PATH)
  const garden = kingdom.regions?.find((region) => region.id === 'garden')
  if (!garden?.series) return []

  const books = []
  for (const series of garden.series) {
    for (const batch of series.batches ?? []) {
      for (const book of batch.books ?? []) {
        books.push({
          ...book,
          seriesName: series.seriesName,
          seriesLevel: series.seriesLevel,
          batchFolder: batch.folder,
        })
      }
    }
  }
  return books
}

function getSeriesLabel(book) {
  const level = book.seriesLevel?.match(/第(\d+)级/)?.[1] ?? ''
  const batchNo = String(book.batchFolder ?? '').match(/_(\d+)$/)?.[1] ?? ''
  if (batchNo) return `${book.seriesName}${level}—${batchNo}`
  return `${book.seriesName}${level}`
}

function ensureTemplatesDir() {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true })
}

function wideHeader() {
  const header = ['bookId', '英文书名', '中文书名', '系列']
  for (let i = 1; i <= WORD_SLOTS; i += 1) {
    header.push(`词${i}英文`, `词${i}中文`)
  }
  return header
}

function exportBookList() {
  ensureTemplatesDir()
  const books = getGardenBooks()
  const header = wideHeader()
  const lines = [toCsvRow(header)]

  for (const book of books) {
    const row = [book.id, book.title, book.titleCn, getSeriesLabel(book)]
    for (let i = 0; i < WORD_SLOTS; i += 1) {
      row.push('', '')
    }
    lines.push(toCsvRow(row))
  }

  fs.writeFileSync(BOOK_LIST_PATH, CSV_BOM + lines.join('\n') + '\n', 'utf8')
  console.log(`已生成 Excel 模板：${BOOK_LIST_PATH}`)
  console.log(`共 ${books.length} 本书，每行填词1英文/词1中文 … 最多词${WORD_SLOTS}。`)
}

function writeLongTemplateFile() {
  ensureTemplatesDir()
  const header = ['bookId', '英文书名', '中文书名', 'wordEn', 'wordCn']
  const examples = [
    ['youyou-3-33', "Who's Stronger", '谁更强壮？', 'strong', '强壮的'],
    ['youyou-3-33', "Who's Stronger", '谁更强壮？', 'bear', '熊'],
    ['youyou-3-33', "Who's Stronger", '谁更强壮？', 'elephant', '大象'],
    ['youyou-3-51', 'Whose tooth', '谁的牙齿？', 'tooth', '牙齿'],
    ['youyou-3-51', 'Whose tooth', '谁的牙齿？', 'shark', '鲨鱼'],
    ['ls-phonics-2-01', 'Doctor Duck', '鸭子医生', 'duck', '鸭子'],
    ['ls-phonics-2-01', 'Doctor Duck', '鸭子医生', 'doctor', '医生'],
  ]

  const lines = [toCsvRow(header), ...examples.map((row) => toCsvRow(row))]
  fs.writeFileSync(TEMPLATE_PATH, CSV_BOM + lines.join('\n') + '\n', 'utf8')
}

function normalizeHeader(row) {
  const map = {}
  row.forEach((cell, index) => {
    const key = String(cell).trim().toLowerCase()
    map[key] = index
  })
  return map
}

function pick(row, header, names) {
  for (const name of names) {
    const index = header[name.toLowerCase()]
    if (index != null) return String(row[index] ?? '').trim()
  }
  return ''
}

function isWideFormat(header) {
  return header['词1英文'.toLowerCase()] != null || header['词1英文'.toLowerCase()] != null
}

function parseWideRow(row, header) {
  const bookId = pick(row, header, ['bookId', 'bookid'])
  const words = []
  const slotCount = getWideWordSlotCount(header)

  for (let i = 1; i <= slotCount; i += 1) {
    const en = pick(row, header, [
      `词${i}英文`,
      `词${i}en`,
      `word${i}en`,
      `w${i}_en`,
      `w${i}en`,
    ])
    const cn = pick(row, header, [
      `词${i}中文`,
      `词${i}cn`,
      `word${i}cn`,
      `w${i}_cn`,
      `w${i}cn`,
    ])
    if (en && cn) words.push({ en, cn })
  }

  return { bookId, words }
}

function parseLongRow(row, header) {
  const bookId = pick(row, header, ['bookId', 'bookid'])
  const en = pick(row, header, ['wordEn', 'worden', '英文单词'])
  const cn = pick(row, header, ['wordCn', 'wordcn', '中文意思', '中文'])
  if (!en || !cn) return { bookId, words: [] }
  return { bookId, words: [{ en, cn }] }
}

function importCsv(csvPath, { replace = false } = {}) {
  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '')
  const rows = parseCsv(raw)
  if (!rows.length) throw new Error('CSV 为空')

  const header = normalizeHeader(rows[0])
  const wide = header['词1英文'.toLowerCase()] != null

  if (!wide) {
    const required = ['bookid', 'worden', 'wordcn']
    for (const key of required) {
      if (header[key] == null) {
        throw new Error('长表 CSV 需要列：bookId, wordEn, wordCn')
      }
    }
  } else if (header.bookid == null) {
    throw new Error('宽表 CSV 需要列：bookId, 词1英文, 词1中文 …')
  }

  const books = getGardenBooks()
  const validIds = new Set(books.map((book) => book.id))
  const grouped = {}
  const warnings = []

  for (const row of rows.slice(1)) {
    const parsed = wide ? parseWideRow(row, header) : parseLongRow(row, header)
    const { bookId, words } = parsed

    if (!bookId && !words.length) continue
    if (bookId.startsWith('#')) continue

    if (!bookId) {
      warnings.push('跳过一行：缺少 bookId')
      continue
    }
    if (!validIds.has(bookId)) {
      warnings.push(`跳过未知 bookId：${bookId}`)
      continue
    }
    if (!words.length) continue

    if (!grouped[bookId]) grouped[bookId] = []
    grouped[bookId].push(...words)
  }

  const existing = replace ? {} : readJson(VOCAB_PATH)
  const merged = { ...existing }
  delete merged._comment

  for (const [bookId, words] of Object.entries(grouped)) {
    const deduped = []
    const seen = new Set()
    for (const word of words) {
      const key = word.en.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(word)
    }
    merged[bookId] = deduped
  }

  const output = {
    _comment: '由 CSV 导入。请编辑 data/templates/gardenBookList.reference.csv 后运行 npm run vocab:import',
    ...merged,
  }

  writeJson(VOCAB_PATH, output)

  const bookCount = Object.keys(grouped).length
  const wordCount = Object.values(grouped).reduce((sum, list) => sum + list.length, 0)
  console.log(`导入完成：${bookCount} 本书，${wordCount} 个词 → ${VOCAB_PATH}`)
  if (warnings.length) {
    console.log('提示：')
    warnings.slice(0, 10).forEach((msg) => console.log(`  - ${msg}`))
    if (warnings.length > 10) console.log(`  … 还有 ${warnings.length - 10} 条`)
  }
}

function main() {
  writeLongTemplateFile()

  const args = process.argv.slice(2)
  if (args.includes('--books') || args.includes('-b') || !args.find((arg) => !arg.startsWith('-'))) {
    exportBookList()
    if (!args.find((arg) => !arg.startsWith('-'))) {
      console.log('')
      console.log('填好后导入：')
      console.log('  npm run vocab:import -- data/templates/gardenBookList.reference.csv')
      console.log('')
      console.log(`长表示例（可选）：${TEMPLATE_PATH}`)
    }
    return
  }

  const csvArg = args.find((arg) => !arg.startsWith('-'))
  const replace = args.includes('--replace')
  const csvPath = path.resolve(process.cwd(), csvArg)

  if (!fs.existsSync(csvPath)) {
    throw new Error(`找不到 CSV：${csvPath}`)
  }

  importCsv(csvPath, { replace })
}

main()
