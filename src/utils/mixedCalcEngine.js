function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildOptions(correct, distractors) {
  const set = new Set([correct, ...distractors])
  while (set.size < 4) {
    set.add(correct + randInt(-12, 12))
  }
  return shuffle([...set].slice(0, 4).map(String))
}

function makeQuestion({ prompt, answer, hint, distractors }) {
  return {
    kind: 'mixed-op',
    prompt: `${prompt} = ?`,
    answer: String(answer),
    hint,
    options: buildOptions(answer, distractors),
  }
}

function genGrade4() {
  const kind = pick(['mul-add', 'add-mul', 'paren-mul', 'mul-sub', 'add-chain', 'sub-add'])
  if (kind === 'mul-add') {
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    const c = randInt(2, 20)
    const ans = a * b + c
    return makeQuestion({
      prompt: `${a} × ${b} + ${c}`,
      answer: ans,
      hint: `先算 ${a} × ${b}`,
      distractors: [ans + c, ans - c, a * b + c + 1],
    })
  }
  if (kind === 'add-mul') {
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    const c = randInt(2, 9)
    const ans = a + b * c
    return makeQuestion({
      prompt: `${a} + ${b} × ${c}`,
      answer: ans,
      hint: `先算 ${b} × ${c}`,
      distractors: [ans + a, (a + b) * c, ans - b],
    })
  }
  if (kind === 'paren-mul') {
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    const c = randInt(2, 9)
    const ans = (a + b) * c
    return makeQuestion({
      prompt: `(${a} + ${b}) × ${c}`,
      answer: ans,
      hint: `先算括号 ${a} + ${b}`,
      distractors: [ans + c, ans - c, a + b * c],
    })
  }
  if (kind === 'mul-sub') {
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    const c = randInt(2, Math.min(15, a * b - 1))
    const ans = a * b - c
    return makeQuestion({
      prompt: `${a} × ${b} − ${c}`,
      answer: ans,
      hint: `先算 ${a} × ${b}`,
      distractors: [ans + c, ans - 2, a * b + c],
    })
  }
  if (kind === 'add-chain') {
    const a = randInt(10, 80)
    const b = randInt(10, 80)
    const c = randInt(10, 80)
    const ans = a + b + c
    return makeQuestion({
      prompt: `${a} + ${b} + ${c}`,
      answer: ans,
      hint: `从左到右依次相加`,
      distractors: [ans + 10, ans - 10, a + b + c + 1],
    })
  }
  const a = randInt(40, 120)
  const b = randInt(10, 30)
  const c = randInt(10, 40)
  const ans = a - b + c
  return makeQuestion({
    prompt: `${a} − ${b} + ${c}`,
    answer: ans,
    hint: `先算 ${a} − ${b}`,
    distractors: [ans + 5, ans - 5, a - (b + c)],
  })
}

function genGrade5() {
  const kind = pick(['mul-add', 'div-add', 'paren-mul', 'double-mul', 'dec-mul-add'])
  if (kind === 'mul-add') {
    const a = randInt(12, 49)
    const b = randInt(2, 9)
    const c = randInt(12, 99)
    const ans = a * b + c
    return makeQuestion({
      prompt: `${a} × ${b} + ${c}`,
      answer: ans,
      hint: `先算 ${a} × ${b}`,
      distractors: [ans + b, (a + c) * b, ans - c],
    })
  }
  if (kind === 'div-add') {
    const b = randInt(2, 9)
    const q = randInt(3, 15)
    const a = b * q
    const c = randInt(5, 40)
    const ans = q + c
    return makeQuestion({
      prompt: `${a} ÷ ${b} + ${c}`,
      answer: ans,
      hint: `先算 ${a} ÷ ${b}`,
      distractors: [ans + 1, ans - 1, q * b + c],
    })
  }
  if (kind === 'paren-mul') {
    const a = randInt(5, 19)
    const b = randInt(5, 19)
    const c = randInt(2, 9)
    const ans = (a + b) * c
    return makeQuestion({
      prompt: `(${a} + ${b}) × ${c}`,
      answer: ans,
      hint: `先算括号 ${a} + ${b}`,
      distractors: [ans + c, a + b * c, ans - c],
    })
  }
  if (kind === 'double-mul') {
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    const c = randInt(2, 9)
    const d = randInt(2, 9)
    const ans = a * b + c * d
    return makeQuestion({
      prompt: `${a} × ${b} + ${c} × ${d}`,
      answer: ans,
      hint: `先算 ${a} × ${b} 和 ${c} × ${d}`,
      distractors: [ans + d, (a + c) * (b + d), ans - b],
    })
  }
  const a = randInt(20, 90) / 10
  const b = randInt(2, 9)
  const c = randInt(10, 80) / 10
  const ans = Math.round((a * b + c) * 10) / 10
  return makeQuestion({
    prompt: `${a} × ${b} + ${c}`,
    answer: ans,
    hint: `先算 ${a} × ${b}`,
    distractors: [ans + 1, ans - 0.1, Math.round((a + c) * b * 10) / 10],
  })
}

function genGrade6() {
  const kind = pick(['triple', 'paren-sub', 'frac-add', 'ratio-mix', 'dec-chain'])
  if (kind === 'triple') {
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    const c = randInt(2, 9)
    const d = randInt(2, 15)
    const ans = a * b + c - d
    return makeQuestion({
      prompt: `${a} × ${b} + ${c} − ${d}`,
      answer: ans,
      hint: `先算 ${a} × ${b}`,
      distractors: [ans + d, a * (b + c) - d, ans - 1],
    })
  }
  if (kind === 'paren-sub') {
    const a = randInt(3, 12)
    const b = randInt(3, 12)
    const c = randInt(2, 9)
    const d = randInt(2, Math.min(20, (a + b) * c - 1))
    const ans = (a + b) * c - d
    return makeQuestion({
      prompt: `(${a} + ${b}) × ${c} − ${d}`,
      answer: ans,
      hint: `先算括号 ${a} + ${b}`,
      distractors: [ans + d, a + b * c - d, ans - c],
    })
  }
  if (kind === 'frac-add') {
    const den = pick([4, 6, 8, 12])
    const n1 = randInt(1, den - 1)
    const n2 = randInt(1, den - 1)
    const sum = n1 + n2
    const g = gcd(sum, den)
    const ans = `${sum / g}/${den / g}`
    return makeQuestion({
      prompt: `${n1}/${den} + ${n2}/${den}（最简分数）`,
      answer: ans,
      hint: `分母相同，分子相加`,
      distractors: shuffle([ans, `${sum}/${den}`, `${n1 + n2}/${den * 2}`, `${Math.max(1, sum - 1)}/${den}`]),
    })
  }
  if (kind === 'ratio-mix') {
    const a = randInt(2, 8)
    const b = randInt(2, 8)
    const c = randInt(2, 8)
    const ans = a * b + c
    return makeQuestion({
      prompt: `${a} × ${b} + ${c}`,
      answer: ans,
      hint: `先算 ${a} × ${b}`,
      distractors: [ans + c, (a + b) * c, ans - b],
    })
  }
  const a = randInt(20, 90) / 10
  const b = randInt(2, 9)
  const c = randInt(10, 50) / 10
  const d = randInt(10, 40) / 10
  const ans = Math.round((a * b - c + d) * 10) / 10
  return makeQuestion({
    prompt: `${a} × ${b} − ${c} + ${d}`,
    answer: ans,
    hint: `先算 ${a} × ${b}`,
    distractors: [ans + 1, Math.round((a * b - (c + d)) * 10) / 10, ans - 0.2],
  })
}

function gcd(a, b) {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    ;[x, y] = [y, x % y]
  }
  return x || 1
}

export function generateMixedQuestion(grade) {
  const g = Number(grade) || 5
  if (g <= 4) return genGrade4()
  if (g === 5) return genGrade5()
  return genGrade6()
}

export function checkMixedAnswer(question, selected) {
  return String(selected).trim() === String(question.answer).trim()
}
