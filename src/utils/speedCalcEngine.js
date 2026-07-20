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
    set.add(correct + randInt(-9, 9))
  }
  return shuffle([...set].slice(0, 4).map(String))
}

function makeCalcQuestion(grade) {
  if (grade === 4) {
    const kind = pick(['add', 'sub', 'mul', 'div'])
    if (kind === 'add') {
      const a = randInt(12, 499)
      const b = randInt(12, 499)
      return {
        kind: 'calc',
        prompt: `${a} + ${b} = ?`,
        answer: String(a + b),
        options: buildOptions(a + b, [a + b + 10, a + b - 10, a + b + 1]),
      }
    }
    if (kind === 'sub') {
      const a = randInt(120, 999)
      const b = randInt(12, a - 1)
      return {
        kind: 'calc',
        prompt: `${a} − ${b} = ?`,
        answer: String(a - b),
        options: buildOptions(a - b, [a - b + 10, a - b - 10, a - b + 2]),
      }
    }
    if (kind === 'mul') {
      const a = randInt(2, 99)
      const b = randInt(2, 9)
      return {
        kind: 'calc',
        prompt: `${a} × ${b} = ?`,
        answer: String(a * b),
        options: buildOptions(a * b, [a * b + b, a * b - b, a * b + 10]),
      }
    }
    const b = randInt(2, 9)
    const ans = randInt(2, 12)
    const a = b * ans
    return {
      kind: 'calc',
      prompt: `${a} ÷ ${b} = ?`,
      answer: String(ans),
      options: buildOptions(ans, [ans + 1, ans - 1, ans + 2]),
    }
  }

  if (grade === 5) {
    const kind = pick(['mul', 'div', 'add-dec', 'sub-dec'])
    if (kind === 'mul') {
      const a = randInt(12, 99)
      const b = randInt(12, 99)
      return {
        kind: 'calc',
        prompt: `${a} × ${b} = ?`,
        answer: String(a * b),
        options: buildOptions(a * b, [a * b + 10, a * b - 10, a * b + a]),
      }
    }
    if (kind === 'div') {
      const b = randInt(12, 49)
      const ans = randInt(2, 18)
      const a = b * ans
      return {
        kind: 'calc',
        prompt: `${a} ÷ ${b} = ?`,
        answer: String(ans),
        options: buildOptions(ans, [ans + 1, ans - 1, ans + 3]),
      }
    }
    if (kind === 'add-dec') {
      const a = randInt(10, 990) / 10
      const b = randInt(10, 990) / 10
      const sum = Math.round((a + b) * 10) / 10
      return {
        kind: 'calc',
        prompt: `${a} + ${b} = ?`,
        answer: String(sum),
        options: buildOptions(sum, [sum + 1, sum - 0.1, sum + 0.2]),
      }
    }
    const a = randInt(100, 990) / 10
    const b = randInt(10, Math.floor(a * 10 - 1)) / 10
    const diff = Math.round((a - b) * 10) / 10
    return {
      kind: 'calc',
      prompt: `${a} − ${b} = ?`,
      answer: String(diff),
      options: buildOptions(diff, [diff + 1, diff - 0.1, diff + 0.2]),
    }
  }

  const kind = pick(['mixed', 'fraction', 'percent', 'ratio'])
  if (kind === 'mixed') {
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    const c = randInt(2, 9)
    const ans = a * b + c
    return {
      kind: 'calc',
      prompt: `${a} × ${b} + ${c} = ?`,
      answer: String(ans),
      options: buildOptions(ans, [ans + c, ans - c, ans + b]),
    }
  }
  if (kind === 'fraction') {
    const n1 = randInt(1, 5)
    const n2 = randInt(1, 5)
    return {
      kind: 'calc',
      prompt: `${n1}/6 + ${n2}/6 = ?（最简分数）`,
      answer: `${n1 + n2}/6`,
      options: shuffle([`${n1 + n2}/6`, `${n1 + n2}/12`, `${n1 + n2 + 1}/6`, `${Math.max(1, n1 + n2 - 1)}/6`]),
    }
  }
  if (kind === 'percent') {
    const base = pick([80, 120, 200, 250])
    const ans = base / 2
    return {
      kind: 'calc',
      prompt: `${base} 的 50% = ?`,
      answer: String(ans),
      options: buildOptions(ans, [ans + 10, ans - 10, ans + 5]),
    }
  }
  const a = randInt(2, 6)
  const b = randInt(2, 6)
  return {
    kind: 'calc',
    prompt: `${a} : ${b} = ? : ${b * 2}（求前项）`,
    answer: String(a * 2),
    options: buildOptions(a * 2, [a * 2 + 1, a * 2 - 1, a + b]),
  }
}

function makeEstimationQuestion(grade) {
  const a = grade === 4 ? randInt(21, 89) : randInt(31, 998)
  const b = grade === 4 ? randInt(2, 9) : randInt(11, 99)
  const exact = a * b
  const options = shuffle([
    String(exact),
    String(exact + randInt(10, 40)),
    String(Math.max(0, exact - randInt(10, 40))),
    String(exact + randInt(50, 90)),
  ])
  return {
    kind: 'estimation',
    prompt: `${a} × ${b} 的结果最接近？`,
    answer: String(exact),
    options,
  }
}

export function generateSpeedQuestion(grade, { estimationChance = 0.2 } = {}) {
  const g = Number(grade) || 5
  if (Math.random() < estimationChance) {
    return makeEstimationQuestion(g)
  }
  return makeCalcQuestion(g)
}

export function checkSpeedAnswer(question, selected) {
  return String(selected).trim() === String(question.answer).trim()
}
