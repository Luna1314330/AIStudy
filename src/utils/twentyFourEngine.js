/** 24 点 · 出题、求解、校验 */

const EPS = 1e-6

const OPS = [
  { sym: '+', fn: (a, b) => a + b },
  { sym: '-', fn: (a, b) => a - b },
  { sym: '×', fn: (a, b) => a * b },
  { sym: '÷', fn: (a, b) => a / b },
]

function nearly24(n) {
  return Math.abs(n - 24) < EPS
}

function fmt(n) {
  if (Math.abs(n - Math.round(n)) < EPS) return String(Math.round(n))
  return Number(n.toFixed(2)).toString()
}

function solveNumbers(numbers, steps = []) {
  if (numbers.length === 1) {
    if (nearly24(numbers[0].value)) {
      return [{ value: numbers[0].value, steps: [...steps, numbers[0].label] }]
    }
    return []
  }

  const results = []
  for (let i = 0; i < numbers.length; i += 1) {
    for (let j = 0; j < numbers.length; j += 1) {
      if (i === j) continue
      const a = numbers[i]
      const b = numbers[j]
      const rest = numbers.filter((_, idx) => idx !== i && idx !== j)

      for (const op of OPS) {
        if (op.sym === '÷' && Math.abs(b.value) < EPS) continue
        const val = op.fn(a.value, b.value)
        if (!Number.isFinite(val)) continue
        const label = `(${a.label}${op.sym}${b.label})`
        results.push(
          ...solveNumbers([...rest, { value: val, label }], [...steps, `${a.label}${op.sym}${b.label}=${fmt(val)}`]),
        )
      }
    }
  }
  return results
}

export function findTwentyFourSolutions(cards) {
  const nums = cards.map((n, idx) => ({ value: n, label: String(n) }))
  return solveNumbers(nums)
}

export function getCardRangeForGrade(grade) {
  const g = Number(grade) || 5
  if (g <= 4) return { min: 1, max: 10 }
  if (g === 5) return { min: 1, max: 12 }
  return { min: 1, max: 13 }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const FALLBACK_PUZZLES = [
  { cards: [3, 3, 8, 8], hint: '试试先算 8 ÷ 8，再和其他牌组合' },
  { cards: [4, 4, 6, 6], hint: '试试 (6 + 6) × (4 - 4 + 1) 的思路，先找两个 6' },
  { cards: [1, 5, 5, 5], hint: '试试 5 × 5 - 1' },
  { cards: [2, 3, 4, 6], hint: '试试 6 × 4，再处理 2 和 3' },
]

export function generateTwentyFourPuzzle(grade) {
  const { min, max } = getCardRangeForGrade(grade)

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const cards = [randInt(min, max), randInt(min, max), randInt(min, max), randInt(min, max)]
    const solutions = findTwentyFourSolutions(cards)
    if (solutions.length > 0) {
      const steps = solutions[0].steps
      return {
        id: `tf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        cards,
        steps,
        hint: buildHintFromSteps(steps),
        sampleAnswer: steps[steps.length - 1] ?? '24',
      }
    }
  }

  const fallback = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)]
  const solutions = findTwentyFourSolutions(fallback.cards)
  return {
    id: `tf-fb-${Date.now()}`,
    cards: fallback.cards,
    steps: solutions[0]?.steps ?? [],
    hint: fallback.hint,
    sampleAnswer: solutions[0]?.steps?.[solutions[0].steps.length - 1] ?? '24',
  }
}

function buildHintFromSteps(steps) {
  if (!steps.length) return '试试先找两个数相乘或相加'
  if (steps.length === 1) return `可以先算 ${steps[0]}`
  return `可以先算 ${steps[0]}，再继续组合`
}

export function getVisionHint(puzzle) {
  return puzzle?.hint ?? '观察哪两张牌相乘接近 24'
}

/** level 0 = 第一步思路，1 = 第二步（运算透视额外提示） */
export function getHintByLevel(puzzle, level = 0) {
  const steps = puzzle?.steps ?? []
  if (level === 0) {
    if (steps[0]) return `可以先算：${steps[0]}`
    return getVisionHint(puzzle)
  }
  if (level === 1 && steps[1]) return `接下来试试：${steps[1]}`
  if (steps.length > 1) return `继续按顺序组合，目标凑出 24`
  return getVisionHint(puzzle)
}

export function getMaxHintsPerRound({ isPractice, hasVision }) {
  if (isPractice) return Infinity
  return hasVision ? 2 : 1
}

export function cardsPrompt(cards) {
  return `24 点：${cards.join('、')} → 24`
}

export function buildReviewOptions(cards, answer) {
  const set = new Set([answer])
  const distractors = [
    `${cards[0]} + ${cards[1]} + ${cards[2]} + ${cards[3]}`,
    `${cards[0]} × ${cards[1]} - ${cards[2]}`,
    `(${cards[0]} + ${cards[1]}) × (${cards[2]} - ${cards[3]})`,
    `${cards[0]} × ${cards[1]} × ${cards[2]} ÷ ${cards[3] || 1}`,
  ]
  for (const item of distractors) {
    if (set.size >= 4) break
    if (item !== answer) set.add(item)
  }
  return shuffle([...set]).slice(0, 4)
}

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function createCardStack(cards) {
  return cards.map((value, index) => ({
    id: `c-${index}-${value}-${Math.random().toString(36).slice(2, 5)}`,
    value,
    label: String(value),
  }))
}

export function combineCards(a, b, opSym) {
  const op = OPS.find((item) => item.sym === opSym)
  if (!op) return null
  if (op.sym === '÷' && Math.abs(b.value) < EPS) return null
  const value = op.fn(a.value, b.value)
  if (!Number.isFinite(value)) return null
  return {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    value,
    label: `(${a.label}${op.sym}${b.label})`,
  }
}

export function checkFinalValue(value) {
  return nearly24(value)
}

export { fmt, OPS }
