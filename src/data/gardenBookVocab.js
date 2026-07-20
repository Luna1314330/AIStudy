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
