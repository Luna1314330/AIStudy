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

const OPTION_IDS = ['A', 'B', 'C', 'D']

export function rotateGrid90CW(grid) {
  const rows = grid.length
  const cols = grid[0].length
  const result = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      result[c][rows - 1 - r] = grid[r][c]
    }
  }
  return result
}

export function mirrorGridH(grid) {
  return grid.map((row) => [...row].reverse())
}

function cloneGrid(grid) {
  return grid.map((row) => [...row])
}

function gridsEqual(a, b) {
  if (a.length !== b.length || a[0].length !== b[0].length) return false
  for (let r = 0; r < a.length; r += 1) {
    for (let c = 0; c < a[0].length; c += 1) {
      if (a[r][c] !== b[r][c]) return false
    }
  }
  return true
}

function randomShape(size = 3) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0))
  const cells = randInt(3, size * size - 1)
  let placed = 0
  while (placed < cells) {
    const r = randInt(0, size - 1)
    const c = randInt(0, size - 1)
    if (!grid[r][c]) {
      grid[r][c] = 1
      placed += 1
    }
  }
  return grid
}

function makeOptions(correctGrid, distractors, labels) {
  const candidates = [cloneGrid(correctGrid), ...distractors.map(cloneGrid)]
  const unique = []
  for (const grid of candidates) {
    if (!unique.some((item) => gridsEqual(item.grid, grid))) {
      unique.push({ id: OPTION_IDS[unique.length], grid })
    }
  }

  while (unique.length < 4) {
    const extra = randomShape(correctGrid.length)
    if (!unique.some((item) => gridsEqual(item.grid, extra))) {
      unique.push({ id: OPTION_IDS[unique.length], grid: extra })
    }
  }

  const shuffled = shuffle(unique.slice(0, 4))
  const options = shuffled.map((item, index) => ({
    id: OPTION_IDS[index],
    label: OPTION_IDS[index],
    grid: item.grid,
  }))
  const answer = options.find((item) => gridsEqual(item.grid, correctGrid))?.id ?? 'A'
  return { options, answer }
}

function buildGridQuestion({ prompt, stem, correctGrid, distractors, hint, type }) {
  const { options, answer } = makeOptions(correctGrid, distractors)
  const meta = { type, stem, options, optionGrids: options }
  return {
    kind: 'spatial',
    type,
    prompt,
    answer,
    stem,
    hint,
    options: options.map((item) => item.id),
    optionGrids: options,
    meta,
  }
}

function genRotate(grade) {
  const size = grade <= 4 ? 3 : 4
  const stem = randomShape(size)
  const correct = rotateGrid90CW(stem)
  const distractors = [
    stem,
    mirrorGridH(stem),
    rotateGrid90CW(rotateGrid90CW(stem)),
    randomShape(size),
  ]
  return buildGridQuestion({
    type: 'rotate',
    prompt: '图形顺时针旋转 90° 后是哪个？',
    stem: { grid: stem },
    correctGrid: correct,
    distractors,
    hint: '想象图形向右转一下，竖变横、横变竖',
  })
}

function genMirror(grade) {
  const size = grade <= 5 ? 3 : 4
  const stem = randomShape(size)
  const correct = mirrorGridH(stem)
  const distractors = [stem, rotateGrid90CW(stem), rotateGrid90CW(rotateGrid90CW(stem)), randomShape(size)]
  return buildGridQuestion({
    type: 'mirror',
    prompt: '图形沿竖直中线左右翻转后是哪个？',
    stem: { grid: stem },
    correctGrid: correct,
    distractors,
    hint: '左右互换，像照镜子一样',
  })
}

function genCount(grade) {
  const maxBlocks = grade <= 4 ? 5 : grade === 5 ? 7 : 9
  const count = randInt(3, maxBlocks)
  const blocks = []
  while (blocks.length < count) {
    const x = randInt(0, 2)
    const y = randInt(0, 2)
    const z = randInt(0, grade <= 4 ? 1 : 2)
    const key = `${x},${y},${z}`
    if (!blocks.some((b) => `${b.x},${b.y},${b.z}` === key)) {
      blocks.push({ x, y, z })
    }
  }

  const answer = String(count)
  const pool = new Set([answer])
  while (pool.size < 4) {
    const candidate = String(Math.max(1, count + randInt(-2, 3)))
    pool.add(candidate)
  }
  const options = shuffle([...pool])

  const meta = { type: 'count', blocks, options }

  return {
    kind: 'spatial',
    type: 'count',
    prompt: '立体堆叠中共有几个小方块？（相同位置只算 1 个）',
    answer,
    stem: { blocks },
    hint: '从上往下数每一层，注意不要重复数',
    options,
    meta,
  }
}

function genTopView(grade) {
  const size = 3
  const heights = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => randInt(0, grade <= 5 ? 2 : 3)),
  )
  // Ensure at least some filled
  heights[1][1] = Math.max(1, heights[1][1])

  const top = heights.map((row) => row.map((h) => (h > 0 ? 1 : 0)))
  const stem = {
    heights,
    view: 'front',
  }

  const distractors = [
    top,
    rotateGrid90CW(top),
    mirrorGridH(top),
    randomShape(size),
  ]

  return buildGridQuestion({
    type: 'top-view',
    prompt: '根据正视图的高度，从上往下看（俯视图）是哪一个？',
    stem,
    correctGrid: top,
    distractors,
    hint: '有方块的位置俯视就是 1，空的位置就是 0',
  })
}

export function generateSpatialQuestion(grade) {
  const g = Number(grade) || 5
  const types =
    g <= 4
      ? ['rotate', 'count']
      : g === 5
        ? ['rotate', 'mirror', 'count']
        : ['rotate', 'mirror', 'count', 'top-view']

  const type = pick(types)
  if (type === 'rotate') return genRotate(g)
  if (type === 'mirror') return genMirror(g)
  if (type === 'top-view') return genTopView(g)
  return genCount(g)
}

export function checkSpatialAnswer(question, selected) {
  return String(selected).trim() === String(question.answer).trim()
}

export function getSpatialPreviewGrid(question) {
  if (!question?.stem?.grid) return null
  if (question.type === 'rotate') return rotateGrid90CW(question.stem.grid)
  if (question.type === 'mirror') return mirrorGridH(question.stem.grid)
  return null
}
