import { GARDEN_BOOK_COUNT, getBookDrawWeight, getGardenBooks } from '@/data/englishReadingKingdom'

const STORAGE_KEY = 'english-garden-progress'
export const CHALLENGE_PASS_ACCURACY = 0.8
export const PERIODIC_TEST_BOOK_INTERVAL = 5
export const PERIODIC_TEST_STAR_REWARD = 1

function pickWeightedBook(books) {
  if (!books.length) return null
  if (books.length === 1) return books[0]

  let totalWeight = 0
  const weights = books.map((book) => {
    const weight = getBookDrawWeight(book.id)
    totalWeight += weight
    return weight
  })

  let roll = Math.random() * totalWeight
  for (let i = 0; i < books.length; i += 1) {
    roll -= weights[i]
    if (roll <= 0) return books[i]
  }

  return books[books.length - 1]
}

function normalizeShrineRecord(record) {
  return {
    completed: Boolean(record?.completed),
    completedAt: record?.completedAt ?? null,
    inProgress: Boolean(record?.inProgress),
    lastAccuracy: typeof record?.lastAccuracy === 'number' ? record.lastAccuracy : null,
    lastAttemptAt: record?.lastAttemptAt ?? null,
  }
}

function createDefaultProgress() {
  const shrines = {}
  getGardenBooks().forEach((book) => {
    shrines[book.id] = normalizeShrineRecord({ completed: false })
  })
  return {
    version: 3,
    shrines,
    lastDrawId: null,
    drawHistory: [],
    totalStars: 0,
    lastPeriodicTestAtCount: 0,
  }
}

function getRawStoredProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function mergeProgress(raw) {
  const base = createDefaultProgress()
  if (!raw) return base

  const shrines = { ...base.shrines }
  for (const [id, record] of Object.entries(raw.shrines ?? {})) {
    shrines[id] = normalizeShrineRecord({ ...shrines[id], ...record })
  }

  return {
    version: 3,
    shrines,
    lastDrawId: raw.lastDrawId ?? null,
    drawHistory: Array.isArray(raw.drawHistory) ? raw.drawHistory : [],
    totalStars: raw.totalStars ?? 0,
    lastPeriodicTestAtCount: raw.lastPeriodicTestAtCount ?? 0,
  }
}

export function loadGardenProgress() {
  return mergeProgress(getRawStoredProgress())
}

export function saveGardenProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getShrineRecord(id) {
  const progress = loadGardenProgress()
  return normalizeShrineRecord(progress.shrines[String(id)])
}

export function getCompletedCount() {
  const progress = loadGardenProgress()
  return Object.values(progress.shrines).filter((item) => item.completed).length
}

export function getCompletedBookIds() {
  const progress = loadGardenProgress()
  return getGardenBooks()
    .filter((book) => progress.shrines[book.id]?.completed)
    .sort((a, b) => {
      const aAt = progress.shrines[a.id]?.completedAt ?? ''
      const bAt = progress.shrines[b.id]?.completedAt ?? ''
      return aAt.localeCompare(bAt)
    })
    .map((book) => book.id)
}

export function getPeriodicTestMilestone() {
  const completedCount = getCompletedCount()
  if (completedCount === 0) return 0
  if (completedCount % PERIODIC_TEST_BOOK_INTERVAL !== 0) return 0
  return completedCount
}

export function isPeriodicTestDue() {
  const milestone = getPeriodicTestMilestone()
  if (!milestone) return false
  const progress = loadGardenProgress()
  return (progress.lastPeriodicTestAtCount ?? 0) < milestone
}

export function getPeriodicTestBookIds() {
  const milestone = getPeriodicTestMilestone()
  if (!milestone) return []
  const completedIds = getCompletedBookIds()
  const start = milestone - PERIODIC_TEST_BOOK_INTERVAL
  return completedIds.slice(start, milestone)
}

export function submitPeriodicTestResult({ totalWords, wrongAttempts }) {
  const progress = loadGardenProgress()
  const milestone = getPeriodicTestMilestone()
  if (!milestone || !isPeriodicTestDue()) {
    return { passed: false, accuracy: 0, accuracyPercent: 0, starDelta: 0, milestone: 0 }
  }

  const accuracy = calcChallengeAccuracy(totalWords, wrongAttempts)
  const accuracyPercent = Math.round(accuracy * 100)
  const passed = accuracy >= CHALLENGE_PASS_ACCURACY
  const starDelta = passed ? PERIODIC_TEST_STAR_REWARD : -PERIODIC_TEST_STAR_REWARD

  progress.totalStars = Math.max(0, (progress.totalStars ?? 0) + starDelta)
  progress.lastPeriodicTestAtCount = milestone
  saveGardenProgress(progress)

  return { passed, accuracy, accuracyPercent, starDelta, milestone }
}

export function skipPeriodicTestNoVocab() {
  const progress = loadGardenProgress()
  const milestone = getPeriodicTestMilestone()
  if (!milestone || !isPeriodicTestDue()) return false

  progress.lastPeriodicTestAtCount = milestone
  saveGardenProgress(progress)
  return true
}

export function getTotalStars() {
  return loadGardenProgress().totalStars ?? 0
}

export function getPendingBooks() {
  const progress = loadGardenProgress()
  return getGardenBooks().filter((book) => !progress.shrines[book.id]?.completed)
}

export function isShrineInProgress(id) {
  const key = String(id)
  const progress = loadGardenProgress()
  if (progress.shrines[key]?.completed) return false
  if (progress.lastDrawId === key) return true
  return Boolean(progress.shrines[key]?.inProgress)
}

export function canEnterShrine(id) {
  const key = String(id)
  if (isShrineCompleted(key)) return true
  return isShrineInProgress(key)
}

export function calcChallengeAccuracy(totalWords, wrongAttempts) {
  if (!totalWords) return 0
  const attempts = totalWords + Math.max(0, wrongAttempts)
  return totalWords / attempts
}

export function drawRandomShrine() {
  const pending = getPendingBooks()
  if (pending.length === 0) return null

  const picked = pickWeightedBook(pending)
  const progress = loadGardenProgress()
  progress.lastDrawId = picked.id
  progress.shrines[picked.id] = {
    ...normalizeShrineRecord(progress.shrines[picked.id]),
    inProgress: true,
  }
  progress.drawHistory = [
    { id: picked.id, drawnAt: new Date().toISOString() },
    ...progress.drawHistory,
  ].slice(0, 30)
  saveGardenProgress(progress)
  return picked
}

export function completeShrine(id) {
  const progress = loadGardenProgress()
  const key = String(id)
  const book = getGardenBooks().find((item) => item.id === key)
  if (!progress.shrines[key] || progress.shrines[key].completed) return progress

  progress.shrines[key] = {
    completed: true,
    completedAt: new Date().toISOString(),
    inProgress: false,
    lastAccuracy: 100,
    lastAttemptAt: new Date().toISOString(),
  }
  progress.totalStars = (progress.totalStars ?? 0) + (book?.starsReward ?? 1)
  saveGardenProgress(progress)
  return progress
}

export function submitChallengeResult(id, { totalWords, wrongAttempts }) {
  const progress = loadGardenProgress()
  const key = String(id)
  const accuracy = calcChallengeAccuracy(totalWords, wrongAttempts)
  const accuracyPercent = Math.round(accuracy * 100)
  const passed = accuracy >= CHALLENGE_PASS_ACCURACY

  if (passed) {
    completeShrine(key)
    return { passed: true, accuracy, accuracyPercent }
  }

  progress.shrines[key] = {
    ...normalizeShrineRecord(progress.shrines[key]),
    completed: false,
    inProgress: true,
    lastAccuracy: accuracyPercent,
    lastAttemptAt: new Date().toISOString(),
  }
  saveGardenProgress(progress)

  return { passed: false, accuracy, accuracyPercent }
}

export function getInProgressBooks() {
  const progress = loadGardenProgress()
  return getGardenBooks().filter((book) => {
    if (progress.shrines[book.id]?.completed) return false
    return isShrineInProgress(book.id)
  })
}

export function isShrineCompleted(id) {
  return getShrineRecord(id).completed
}

/** 清空所有已完成神庙记录，星星与已开启数量归零；进行中的挑战保留 */
export function resetCompletedShrines() {
  const progress = loadGardenProgress()

  for (const [id, record] of Object.entries(progress.shrines)) {
    if (!record.completed) continue
    progress.shrines[id] = {
      ...normalizeShrineRecord(record),
      completed: false,
      completedAt: null,
      lastAccuracy: null,
      lastAttemptAt: null,
    }
  }

  progress.totalStars = 0
  progress.lastPeriodicTestAtCount = 0
  saveGardenProgress(progress)
  return progress
}

export { GARDEN_BOOK_COUNT }
