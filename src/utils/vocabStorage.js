import { getBuiltinTextbookBooks } from '@/data/sampleWordBooks'

const STORAGE_KEY = 'vocab-dictation-data'

const DEFAULT_SETTINGS = {
  repeats: 2,
  intervalSec: 10,
  readExample: true,
}

function normalizeWord(entry) {
  if (typeof entry === 'string') {
    return { word: entry.trim(), pinyin: '', example: '' }
  }
  return {
    word: entry.word?.trim() || '',
    pinyin: entry.pinyin?.trim() || '',
    example: entry.example?.trim() || '',
  }
}

export function normalizeWords(words) {
  return words.map(normalizeWord).filter((item) => item.word)
}

function getRawStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** 内置课本词库为基础；仅 customized 的本地修改会覆盖内置数据 */
function mergeStoredWordBooks(storedBooks) {
  const customBooks = (storedBooks || []).filter((book) => book.type === 'custom')
  const textbookOverrides = new Map(
    (storedBooks || [])
      .filter((book) => book.type === 'textbook' && book.customized)
      .map((book) => [book.id, book])
  )

  const builtinBooks = getBuiltinTextbookBooks().map((book) => {
    const override = textbookOverrides.get(book.id)
    if (override) {
      return {
        ...book,
        words: normalizeWords(override.words),
        customized: true,
      }
    }
    return {
      ...book,
      words: normalizeWords(book.words),
    }
  })

  return [...builtinBooks, ...customBooks]
}

function createDefaultData() {
  return {
    version: 1,
    wordBooks: [],
    wrongWords: [],
    dictationHistory: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

function toMergedVocabData(raw) {
  return {
    version: raw.version || 1,
    wordBooks: mergeStoredWordBooks(raw.wordBooks),
    wrongWords: Array.isArray(raw.wrongWords) ? raw.wrongWords : [],
    dictationHistory: Array.isArray(raw.dictationHistory) ? raw.dictationHistory : [],
    settings: { ...DEFAULT_SETTINGS, ...raw.settings },
  }
}

export function loadVocabData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const data = createDefaultData()
      saveVocabData(data)
      return toMergedVocabData(data)
    }

    return toMergedVocabData(JSON.parse(raw))
  } catch {
    const data = createDefaultData()
    saveVocabData(data)
    return toMergedVocabData(data)
  }
}

export function saveVocabData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function patchRawVocabData(patch) {
  const raw = getRawStoredData() || createDefaultData()
  saveVocabData({ ...raw, ...patch })
}

export function getWordBooks() {
  return loadVocabData().wordBooks
}

export function getWrongWords() {
  return loadVocabData().wrongWords
}

export function getDictationSettings() {
  return loadVocabData().settings
}

export function saveDictationSettings(settings) {
  const raw = getRawStoredData() || createDefaultData()
  const nextSettings = { ...DEFAULT_SETTINGS, ...raw.settings, ...settings }
  patchRawVocabData({ settings: nextSettings })
  return nextSettings
}

export function getWordBookById(id) {
  return getWordBooks().find((book) => book.id === id) || null
}

export function getBuiltinTextbookById(id) {
  const book = getBuiltinTextbookBooks().find((item) => item.id === id)
  if (!book) return null
  return {
    ...book,
    words: normalizeWords(book.words),
  }
}

function buildRawWordBooks(storedBooks, updatedBook) {
  const books = Array.isArray(storedBooks) ? [...storedBooks] : []
  const index = books.findIndex((item) => item.id === updatedBook.id)

  if (index >= 0) {
    books[index] = updatedBook
  } else {
    books.push(updatedBook)
  }

  return books
}

export function saveWordBook(book) {
  const raw = getRawStoredData() || createDefaultData()
  const merged = loadVocabData()

  const normalized = {
    ...book,
    words: normalizeWords(book.words || []),
  }

  if (normalized.type === 'textbook') {
    normalized.customized = true
  }

  const nextRawBooks = buildRawWordBooks(raw.wordBooks, normalized)

  saveVocabData({
    version: raw.version || 1,
    wordBooks: nextRawBooks,
    wrongWords: merged.wrongWords,
    dictationHistory: merged.dictationHistory,
    settings: merged.settings,
  })

  return getWordBookById(normalized.id) || normalized
}

export function resetTextbookBook(id) {
  const raw = getRawStoredData()
  if (!raw) return getBuiltinTextbookById(id)

  const merged = loadVocabData()
  const nextRawBooks = (raw.wordBooks || []).filter(
    (book) => !(book.type === 'textbook' && book.id === id)
  )

  saveVocabData({
    version: raw.version || 1,
    wordBooks: nextRawBooks,
    wrongWords: merged.wrongWords,
    dictationHistory: merged.dictationHistory,
    settings: merged.settings,
  })

  return getWordBookById(id)
}

export function deleteWordBook(id) {
  const raw = getRawStoredData()
  if (!raw) return

  const merged = loadVocabData()
  const nextRawBooks = (raw.wordBooks || []).filter((book) => book.id !== id)

  saveVocabData({
    version: raw.version || 1,
    wordBooks: nextRawBooks,
    wrongWords: merged.wrongWords,
    dictationHistory: merged.dictationHistory,
    settings: merged.settings,
  })
}

export function addWrongWords(words) {
  const raw = getRawStoredData() || createDefaultData()
  const wrongWords = Array.isArray(raw.wrongWords) ? [...raw.wrongWords] : []
  const today = new Date().toISOString().slice(0, 10)

  for (const entry of normalizeWords(words)) {
    const existing = wrongWords.find((item) => item.word === entry.word)
    if (existing) {
      existing.wrongCount += 1
      existing.lastWrongTime = today
      existing.pinyin = entry.pinyin || existing.pinyin
      existing.example = entry.example || existing.example
    } else {
      wrongWords.push({
        word: entry.word,
        pinyin: entry.pinyin,
        example: entry.example,
        wrongCount: 1,
        lastWrongTime: today,
      })
    }
  }

  wrongWords.sort(
    (a, b) => b.wrongCount - a.wrongCount || b.lastWrongTime.localeCompare(a.lastWrongTime)
  )

  patchRawVocabData({ wrongWords })
  return wrongWords
}

export function removeWrongWord(word) {
  const raw = getRawStoredData() || createDefaultData()
  const wrongWords = (raw.wrongWords || []).filter((item) => item.word !== word)
  patchRawVocabData({ wrongWords })
}

export function clearWrongWords() {
  patchRawVocabData({ wrongWords: [] })
}

export function saveDictationHistory(record) {
  const raw = getRawStoredData() || createDefaultData()
  const dictationHistory = Array.isArray(raw.dictationHistory) ? [...raw.dictationHistory] : []
  dictationHistory.unshift({
    id: `hist-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    ...record,
  })
  patchRawVocabData({ dictationHistory: dictationHistory.slice(0, 50) })
}

export function wordsFromWrongBook(wrongWords) {
  return normalizeWords(
    wrongWords.map((item) => ({
      word: item.word,
      pinyin: item.pinyin,
      example: item.example,
    }))
  )
}

export function createCustomBookId() {
  return `book-custom-${Date.now()}`
}
