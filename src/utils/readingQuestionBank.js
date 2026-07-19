import questionBank from '@/data/readingQuestionBank.json'
import { READING_THEME_OPTIONS } from '@/utils/readingHints'

const USED_ITEMS_KEY = 'reading-question-bank-used'

/** 欢迎页主题 → 匹配 tags / genre / title 的关键词 */
const THEME_MATCH = {
  1: ['小动物', '蚂蚁', '蜜蜂', '蜗牛', '猫', '松鼠', '啄木鸟', '昆虫', '动物'],
  2: ['成长故事', '成长感悟', '亲情', '生活场景', '叙事文', '叙事散文', '叙事'],
  3: ['写景', '景物', '植物', '自然感悟', '状物', '散文'],
  4: ['童话', '寓言', '想象童话', '寓意理解', '科普童话', '哲理故事'],
}

function getThemeLabel(themeNumber) {
  return READING_THEME_OPTIONS.find((item) => item.number === themeNumber)?.label || '阅读'
}

function getPassageText(passage) {
  if (Array.isArray(passage.paragraphs) && passage.paragraphs.length) {
    return passage.paragraphs.map((p) => p.trim()).filter(Boolean).join('\n\n')
  }
  return (passage.passage || '').trim()
}

export { getPassageText }

function normalizePassages() {
  return (questionBank.passages || []).filter(
    (passage) => passage?.title?.trim() && getPassageText(passage)
  )
}

function passageMatchesTheme(passage, themeNumber) {
  if (themeNumber === 5) return true

  const keywords = THEME_MATCH[themeNumber] || []
  const haystack = [passage.title, passage.genre, ...(passage.tags || [])].join(' ')

  return keywords.some((keyword) => haystack.includes(keyword))
}

function filterByTheme(passages, themeNumber) {
  return passages.filter((passage) => passageMatchesTheme(passage, themeNumber))
}

function getUsedIds() {
  try {
    const raw = sessionStorage.getItem(USED_ITEMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function markUsed(id) {
  const key = String(id)
  const used = getUsedIds()
  if (!used.includes(key)) {
    sessionStorage.setItem(USED_ITEMS_KEY, JSON.stringify([...used, key]))
  }
}

function pickRandomPassage(passages) {
  if (!passages.length) return null

  const used = new Set(getUsedIds())
  const fresh = passages.filter((passage) => !used.has(String(passage.id)))
  const pool = fresh.length ? fresh : passages

  const picked = pool[Math.floor(Math.random() * pool.length)]
  if (picked?.id != null) markUsed(picked.id)
  return picked
}

export function getReadingLevels() {
  return questionBank.levels || {}
}

export function getReadingBankStats() {
  const passages = normalizePassages()
  const byTheme = Object.fromEntries(
    READING_THEME_OPTIONS.map(({ number }) => [number, filterByTheme(passages, number).length])
  )
  return {
    total: questionBank.total ?? passages.length,
    loaded: passages.length,
    byTheme,
  }
}

export function pickReadingQuestion(themeNumber) {
  const theme = Number(themeNumber)
  const passages = filterByTheme(normalizePassages(), theme)

  if (!passages.length) {
    const label = getThemeLabel(theme)
    return {
      ok: false,
      error:
        theme === 5
          ? '题库暂无文章，请检查 readingQuestionBank.json 后刷新页面'
          : `题库暂无「${label}」主题文章，请检查 readingQuestionBank.json 后刷新页面`,
    }
  }

  const item = pickRandomPassage(passages)
  return {
    ok: true,
    item,
    themeLabel: getThemeLabel(theme),
  }
}

function formatQuestionsForAgent(questions = []) {
  return questions
    .map((q) => {
      if (typeof q === 'string') return q
      const lines = [
        `${q.qid}. 【${q.type || '阅读题'}】${q.question}`,
        q.hint ? `   提示：${q.hint}` : '',
        q.method ? `   方法：${q.method}` : '',
      ].filter(Boolean)
      return lines.join('\n')
    })
    .join('\n\n')
}

function formatAnswersForAgent(questions = []) {
  return questions
    .map((q) => {
      if (typeof q === 'string') return q
      return `${q.qid}. ${q.answer || '（开放题，无标准答案）'}`
    })
    .join('\n')
}

export function buildReadingAgentQuery(item, themeLabel) {
  const passageText = getPassageText(item)
  const questions = item.questions || []
  const meta = [
    item.levelName && `难度：${item.levelName}`,
    item.genre && `文体：${item.genre}`,
    item.wordCount && `字数：约${item.wordCount}字`,
    item.tags?.length && `标签：${item.tags.join('、')}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return [
    `请根据以下题库内容，引导学生完成阅读理解（主题：${themeLabel}）。`,
    '先带学生读懂文章，再逐题引导作答。不要直接给出标准答案，可参考提示和方法循序渐进引导。',
    '',
    `【文章标题】${item.title}`,
    meta ? `【文章信息】${meta}` : '',
    '',
    '【阅读材料】',
    passageText,
    '',
    '【题目】',
    formatQuestionsForAgent(questions) || '（暂无题目，请根据文章自行设计引导问题）',
    '',
    '【参考答案（仅供老师参考，勿直接告诉学生）】',
    formatAnswersForAgent(questions),
  ]
    .filter((line) => line !== '')
    .join('\n')
}

export function buildThemeSelectionMessage(themeNumber) {
  const result = pickReadingQuestion(themeNumber)
  if (!result.ok) return result

  const { item, themeLabel } = result
  const themeOption = READING_THEME_OPTIONS.find((t) => t.number === Number(themeNumber))
  const levelSuffix = item.levelName ? ` · ${item.levelName}` : ''

  return {
    ok: true,
    displayContent: `${themeOption?.number}. ${themeLabel} · ${item.title}${levelSuffix}`,
    apiQuery: buildReadingAgentQuery(item, themeLabel),
    item,
  }
}

export function resetReadingQuestionUsage() {
  sessionStorage.removeItem(USED_ITEMS_KEY)
}
