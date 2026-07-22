import vocabData from './gardenBookVocab.json'

const VOCAB_MAP = Object.fromEntries(
  Object.entries(vocabData).filter(([key]) => !key.startsWith('_'))
)

export function getBookVocab(bookId) {
  const list = VOCAB_MAP[String(bookId)]
  if (!Array.isArray(list) || !list.length) return []
  return list.filter((item) => item?.en?.trim() && item?.cn?.trim())
}

export function hasBookVocab(bookId) {
  return getBookVocab(bookId).length > 0
}

export function getVocabEntryCount() {
  return Object.keys(VOCAB_MAP).length
}

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function getVocabForBooks(bookIds) {
  const seen = new Map()
  for (const bookId of bookIds) {
    for (const item of getBookVocab(bookId)) {
      const key = item.en.trim().toLowerCase()
      if (!seen.has(key)) seen.set(key, item)
    }
  }
  return [...seen.values()]
}

export function sampleVocabForBooks(bookIds, { limit = 10 } = {}) {
  const pool = getVocabForBooks(bookIds)
  if (!pool.length) return []
  return shuffle(pool).slice(0, Math.min(limit, pool.length))
}
