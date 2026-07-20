import {
  MATH_PASS_ACCURACY,
  MATH_PROJECTS,
  MATH_SUPER_POWERS,
} from '@/data/mathBrainMap'

const STORAGE_KEY = 'math-brain-progress'
const REVIEW_DAYS_FIRST = 3
const REVIEW_DAYS_AGAIN = 7
const REVIEW_REMOVE_STREAK = 2

function createDefaultProjects() {
  return {
    speed: { lit: false, blitzBestStreak: 0, defendWins: 0 },
    twentyfour: { lit: false, challengeWins: 0, streakWins: 0 },
    mixed: { lit: false, challengeWins: 0, streakWins: 0, bestAccuracy: 0 },
    sudoku: { lit: false, challengeWins: 0, streakWins: 0 },
    spatial: { lit: false, challengeWins: 0, streakWins: 0, bestAccuracy: 0 },
    'boss-1': { lit: false },
    'boss-2': { lit: false },
  }
}

function createDefaultProgress() {
  return {
    version: 1,
    grade: 5,
    totalStars: 0,
    superpowers: [],
    projects: createDefaultProjects(),
    wrongQuestions: [],
    dailyBrain: { date: null, completed: false },
  }
}

function getRaw() {
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
  return {
    ...base,
    ...raw,
    grade: raw.grade ?? 5,
    totalStars: raw.totalStars ?? 0,
    superpowers: Array.isArray(raw.superpowers) ? raw.superpowers : [],
    projects: { ...base.projects, ...raw.projects },
    wrongQuestions: Array.isArray(raw.wrongQuestions) ? raw.wrongQuestions : [],
    dailyBrain: { ...base.dailyBrain, ...raw.dailyBrain },
  }
}

export function loadMathProgress() {
  return mergeProgress(getRaw())
}

export function saveMathProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getMathGrade() {
  return loadMathProgress().grade ?? 5
}

export function setMathGrade(grade) {
  const progress = loadMathProgress()
  progress.grade = Number(grade) || 5
  saveMathProgress(progress)
  return progress.grade
}

export function getMathStars() {
  return loadMathProgress().totalStars ?? 0
}

export function hasSuperpower(id) {
  return loadMathProgress().superpowers.includes(String(id))
}

export function getSuperpowerBonusSeconds() {
  return hasSuperpower('speed-sense') ? 5 : 0
}

export function isProjectLit(projectId) {
  return Boolean(loadMathProgress().projects[String(projectId)]?.lit)
}


function unlockSuperpower(id, progress) {
  if (!progress.superpowers.includes(id)) {
    progress.superpowers.push(id)
  }
}

export function isMathProjectUnlocked(projectId) {
  return Boolean(MATH_PROJECTS.find((item) => item.id === projectId))
}

function questionKey(question) {
  return `${question.kind}:${question.prompt}:${question.answer}`
}

export function recordWrongQuestion(question, { grade, project = 'speed', fromUnsure = false }) {
  if (fromUnsure) return

  const progress = loadMathProgress()
  const key = questionKey(question)
  const now = Date.now()
  const existing = progress.wrongQuestions.find((item) => item.key === key)

  if (existing) {
    existing.wrongCount = (existing.wrongCount ?? 1) + 1
    existing.correctStreak = 0
    existing.reviewAt = now + REVIEW_DAYS_AGAIN * 24 * 60 * 60 * 1000
    existing.lastWrongAt = now
  } else {
    progress.wrongQuestions.push({
      id: `wq-${now}-${Math.random().toString(36).slice(2, 7)}`,
      key,
      project,
      grade,
      kind: question.kind,
      prompt: question.prompt,
      answer: question.answer,
      options: question.options,
      meta: question.meta ?? null,
      wrongCount: 1,
      correctStreak: 0,
      addedAt: now,
      lastWrongAt: now,
      reviewAt: now + REVIEW_DAYS_FIRST * 24 * 60 * 60 * 1000,
    })
  }

  saveMathProgress(progress)
}

export function recordWrongReviewResult(questionKeyId, correct) {
  const progress = loadMathProgress()
  const item = progress.wrongQuestions.find((q) => q.id === questionKeyId)
  if (!item) return

  if (correct) {
    item.correctStreak = (item.correctStreak ?? 0) + 1
    if (item.correctStreak >= REVIEW_REMOVE_STREAK) {
      progress.wrongQuestions = progress.wrongQuestions.filter((q) => q.id !== questionKeyId)
    }
  } else {
    item.correctStreak = 0
    item.wrongCount = (item.wrongCount ?? 1) + 1
    item.reviewAt = Date.now() + REVIEW_DAYS_AGAIN * 24 * 60 * 60 * 1000
  }

  saveMathProgress(progress)
}

export function getWrongQuestions() {
  return loadMathProgress().wrongQuestions
}

export function getDueWrongQuestions() {
  const now = Date.now()
  return getWrongQuestions().filter((item) => !item.reviewAt || item.reviewAt <= now)
}

export function clearWrongQuestions() {
  const progress = loadMathProgress()
  progress.wrongQuestions = []
  saveMathProgress(progress)
}

export function removeWrongQuestion(id) {
  const progress = loadMathProgress()
  progress.wrongQuestions = progress.wrongQuestions.filter((item) => item.id !== id)
  saveMathProgress(progress)
}

export function calcAccuracy(correct, wrong) {
  const total = correct + wrong
  if (!total) return 0
  return correct / total
}

export function isChallengePassed(correct, wrong) {
  if (correct + wrong < 5) return false
  return calcAccuracy(correct, wrong) >= MATH_PASS_ACCURACY
}

export function recordBlitzResult({ correct, wrong, streak }) {
  const progress = loadMathProgress()
  const passed = isChallengePassed(correct, wrong)
  const prevBest = progress.projects.speed?.blitzBestStreak ?? 0
  progress.projects.speed = {
    ...progress.projects.speed,
    blitzBestStreak: Math.max(prevBest, streak),
    lastBlitz: { correct, wrong, passed, at: Date.now() },
  }
  if (passed) progress.totalStars = (progress.totalStars ?? 0) + 1
  saveMathProgress(progress)
  return passed
}

export function recordDefendWin() {
  const progress = loadMathProgress()
  progress.projects.speed = {
    ...progress.projects.speed,
    defendWins: (progress.projects.speed?.defendWins ?? 0) + 1,
    lit: true,
  }
  unlockSuperpower('speed-sense', progress)
  progress.totalStars = (progress.totalStars ?? 0) + 2
  saveMathProgress(progress)
}

export function hasCalcVision() {
  return hasSuperpower('calc-vision')
}

export function recordTwentyFourChallengeWin() {
  const progress = loadMathProgress()
  progress.projects.twentyfour = {
    ...progress.projects.twentyfour,
    challengeWins: (progress.projects.twentyfour?.challengeWins ?? 0) + 1,
  }
  progress.totalStars = (progress.totalStars ?? 0) + 1
  saveMathProgress(progress)
}

export function recordTwentyFourStreakWin() {
  const progress = loadMathProgress()
  progress.projects.twentyfour = {
    ...progress.projects.twentyfour,
    streakWins: (progress.projects.twentyfour?.streakWins ?? 0) + 1,
    lit: true,
  }
  unlockSuperpower('calc-vision', progress)
  progress.totalStars = (progress.totalStars ?? 0) + 2
  saveMathProgress(progress)
}

export function recordTwentyFourWrong({ cards, answer }) {
  const prompt = `24 点：${cards.join('、')} → 24`
  recordWrongQuestion(
    {
      kind: 'twentyfour',
      prompt,
      answer,
      options: buildTwentyFourReviewOptions(cards, answer),
    },
    { grade: getMathGrade(), project: 'twentyfour' },
  )
}

function buildTwentyFourReviewOptions(cards, answer) {
  const set = new Set([answer])
  const distractors = [
    `${cards.join('+')}`,
    `${cards[0]}×${cards[1]}+${cards[2]}`,
    `(${cards[0]}+${cards[1]})×(${cards[2]}+${cards[3]})`,
    `${cards[0]}×${cards[1]}×${cards[2]}/${cards[3] || 1}`,
  ]
  for (const item of distractors) {
    if (set.size >= 4) break
    set.add(item)
  }
  return [...set].slice(0, 4)
}

export function hasLogicShield() {
  return hasSuperpower('logic-shield')
}

export function recordMixedChallengeWin({ correct, wrong }) {
  const progress = loadMathProgress()
  const passed = isChallengePassed(correct, wrong)
  const accuracy = calcAccuracy(correct, wrong)
  const prevBest = progress.projects.mixed?.bestAccuracy ?? 0
  progress.projects.mixed = {
    ...progress.projects.mixed,
    challengeWins: (progress.projects.mixed?.challengeWins ?? 0) + (passed ? 1 : 0),
    bestAccuracy: Math.max(prevBest, accuracy),
    lastChallenge: { correct, wrong, passed, at: Date.now() },
  }
  if (passed) progress.totalStars = (progress.totalStars ?? 0) + 1
  saveMathProgress(progress)
  return passed
}

export function recordMixedStreakWin() {
  const progress = loadMathProgress()
  progress.projects.mixed = {
    ...progress.projects.mixed,
    streakWins: (progress.projects.mixed?.streakWins ?? 0) + 1,
    lit: true,
  }
  unlockSuperpower('calc-vision', progress)
  progress.totalStars = (progress.totalStars ?? 0) + 2
  saveMathProgress(progress)
}

export function hasSpaceIntuition() {
  return hasSuperpower('space-intuition')
}

export function recordSpatialChallengeWin({ correct, wrong }) {
  const progress = loadMathProgress()
  const passed = isChallengePassed(correct, wrong)
  const accuracy = calcAccuracy(correct, wrong)
  const prevBest = progress.projects.spatial?.bestAccuracy ?? 0
  progress.projects.spatial = {
    ...progress.projects.spatial,
    challengeWins: (progress.projects.spatial?.challengeWins ?? 0) + (passed ? 1 : 0),
    bestAccuracy: Math.max(prevBest, accuracy),
    lastChallenge: { correct, wrong, passed, at: Date.now() },
  }
  if (passed) progress.totalStars = (progress.totalStars ?? 0) + 1
  saveMathProgress(progress)
  return passed
}

export function recordSpatialStreakWin() {
  const progress = loadMathProgress()
  progress.projects.spatial = {
    ...progress.projects.spatial,
    streakWins: (progress.projects.spatial?.streakWins ?? 0) + 1,
    lit: true,
  }
  unlockSuperpower('space-intuition', progress)
  progress.totalStars = (progress.totalStars ?? 0) + 2
  saveMathProgress(progress)
}

export function recordSudokuChallengeWin() {
  const progress = loadMathProgress()
  progress.projects.sudoku = {
    ...progress.projects.sudoku,
    challengeWins: (progress.projects.sudoku?.challengeWins ?? 0) + 1,
  }
  progress.totalStars = (progress.totalStars ?? 0) + 1
  saveMathProgress(progress)
}

export function recordSudokuStreakWin() {
  const progress = loadMathProgress()
  progress.projects.sudoku = {
    ...progress.projects.sudoku,
    streakWins: (progress.projects.sudoku?.streakWins ?? 0) + 1,
    lit: true,
  }
  unlockSuperpower('logic-shield', progress)
  progress.totalStars = (progress.totalStars ?? 0) + 2
  saveMathProgress(progress)
}

export function recordSudokuWrongCell({ size, row, col, answer }) {
  const prompt = `${size}×${size} 数独 · 第 ${row + 1} 行第 ${col + 1} 列应填？`
  const nums = [...Array(size)].map((_, i) => String(i + 1))
  const options =
    nums.length <= 4
      ? nums
      : shuffleOptions(String(answer), nums)
  recordWrongQuestion(
    {
      kind: 'sudoku',
      prompt,
      answer: String(answer),
      options,
    },
    { grade: getMathGrade(), project: 'sudoku' },
  )
}

function shuffleOptions(answer, nums) {
  const distractors = nums.filter((n) => n !== answer).slice(0, 3)
  const set = new Set([answer, ...distractors])
  return [...set]
}

export function markDailyBrainComplete(dateKey) {
  const progress = loadMathProgress()
  progress.dailyBrain = { date: dateKey, completed: true }
  saveMathProgress(progress)
}

export function isDailyBrainDone(dateKey) {
  return loadMathProgress().dailyBrain?.date === dateKey && loadMathProgress().dailyBrain?.completed
}

export { MATH_PASS_ACCURACY, MATH_SUPER_POWERS }
