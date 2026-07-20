/** 简单数独 · 4×4 / 6×6 / 9×9 生成与校验 */

function getBoxSpec(size) {
  if (size === 4) return { w: 2, h: 2 }
  if (size === 6) return { w: 3, h: 2 }
  return { w: 3, h: 3 }
}

export function getSudokuSizeForGrade(grade) {
  const g = Number(grade) || 5
  if (g <= 4) return 4
  if (g === 5) return 6
  return 9
}

export function getSudokuSizeLabel(size) {
  return `${size}×${size}`
}

function rc(index, size) {
  return { r: Math.floor(index / size), c: index % size }
}

function isValidPlacement(grid, size, row, col, num) {
  if (num < 1 || num > size) return false
  const { w: boxW, h: boxH } = getBoxSpec(size)

  for (let c = 0; c < size; c += 1) {
    if (c !== col && grid[row * size + c] === num) return false
  }
  for (let r = 0; r < size; r += 1) {
    if (r !== row && grid[r * size + col] === num) return false
  }

  const boxRow = Math.floor(row / boxH) * boxH
  const boxCol = Math.floor(col / boxW) * boxW
  for (let r = boxRow; r < boxRow + boxH; r += 1) {
    for (let c = boxCol; c < boxCol + boxW; c += 1) {
      if (r === row && c === col) continue
      if (grid[r * size + c] === num) return false
    }
  }
  return true
}

function findEmpty(grid, size) {
  const idx = grid.findIndex((v) => v === 0)
  if (idx === -1) return null
  return rc(idx, size)
}

function solveGrid(grid, size) {
  const empty = findEmpty(grid, size)
  if (!empty) return true
  const { r, c } = empty
  const nums = shuffle([...Array(size)].map((_, i) => i + 1))
  for (const num of nums) {
    if (isValidPlacement(grid, size, r, c, num)) {
      grid[r * size + c] = num
      if (solveGrid(grid, size)) return true
      grid[r * size + c] = 0
    }
  }
  return false
}

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function fillDiagonalBoxes(grid, size) {
  const { w: boxW, h: boxH } = getBoxSpec(size)
  const boxesPerRow = size / boxW
  for (let b = 0; b < boxesPerRow; b += 1) {
    const nums = shuffle([...Array(size)].map((_, i) => i + 1))
    const startR = b * boxH
    const startC = b * boxW
    let n = 0
    for (let r = startR; r < startR + boxH; r += 1) {
      for (let c = startC; c < startC + boxW; c += 1) {
        grid[r * size + c] = nums[n]
        n += 1
      }
    }
  }
}

function generateSolution(size) {
  const grid = Array(size * size).fill(0)
  fillDiagonalBoxes(grid, size)
  solveGrid(grid, size)
  return grid
}

function countSolutions(grid, size, limit = 2) {
  const copy = [...grid]
  let count = 0

  function dfs() {
    if (count >= limit) return
    const empty = findEmpty(copy, size)
    if (!empty) {
      count += 1
      return
    }
    const { r, c } = empty
    for (let num = 1; num <= size; num += 1) {
      if (isValidPlacement(copy, size, r, c, num)) {
        copy[r * size + c] = num
        dfs()
        copy[r * size + c] = 0
        if (count >= limit) return
      }
    }
  }

  dfs()
  return count
}

function removeCells(solution, size, targetGivens) {
  const puzzle = [...solution]
  const indices = shuffle([...Array(size * size)].map((_, i) => i))
  let givens = size * size

  for (const idx of indices) {
    if (givens <= targetGivens) break
    const backup = puzzle[idx]
    puzzle[idx] = 0
    const test = [...puzzle]
    if (countSolutions(test, size, 2) === 1) {
      givens -= 1
    } else {
      puzzle[idx] = backup
    }
  }

  return puzzle
}

export function generateSudokuPuzzle(grade, { mode = 'practice' } = {}) {
  const size = getSudokuSizeForGrade(grade)
  const ratio = mode === 'practice' ? 0.55 : 0.42
  const targetGivens = Math.max(size + 2, Math.round(size * size * ratio))
  const solution = generateSolution(size)
  const puzzle = removeCells(solution, size, targetGivens)
  const fixedMask = puzzle.map((v) => v !== 0)

  return {
    id: `sd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    size,
    solution: [...solution],
    puzzle: [...puzzle],
    fixedMask,
  }
}

export function isPuzzleComplete(grid, solution) {
  return grid.every((v, i) => v === solution[i])
}

export function getConflictIndices(grid, size) {
  const conflicts = new Set()
  const { w: boxW, h: boxH } = getBoxSpec(size)

  for (let r = 0; r < size; r += 1) {
    const rowMap = new Map()
    for (let c = 0; c < size; c += 1) {
      const v = grid[r * size + c]
      if (!v) continue
      if (!rowMap.has(v)) rowMap.set(v, [])
      rowMap.get(v).push(r * size + c)
    }
    rowMap.forEach((idxs) => {
      if (idxs.length > 1) idxs.forEach((i) => conflicts.add(i))
    })
  }

  for (let c = 0; c < size; c += 1) {
    const colMap = new Map()
    for (let r = 0; r < size; r += 1) {
      const v = grid[r * size + c]
      if (!v) continue
      if (!colMap.has(v)) colMap.set(v, [])
      colMap.get(v).push(r * size + c)
    }
    colMap.forEach((idxs) => {
      if (idxs.length > 1) idxs.forEach((i) => conflicts.add(i))
    })
  }

  const boxesX = size / boxW
  const boxesY = size / boxH
  for (let br = 0; br < boxesY; br += 1) {
    for (let bc = 0; bc < boxesX; bc += 1) {
      const boxMap = new Map()
      for (let r = br * boxH; r < (br + 1) * boxH; r += 1) {
        for (let c = bc * boxW; c < (bc + 1) * boxW; c += 1) {
          const idx = r * size + c
          const v = grid[idx]
          if (!v) continue
          if (!boxMap.has(v)) boxMap.set(v, [])
          boxMap.get(v).push(idx)
        }
      }
      boxMap.forEach((idxs) => {
        if (idxs.length > 1) idxs.forEach((i) => conflicts.add(i))
      })
    }
  }

  return [...conflicts]
}

export function isCellCorrect(grid, solution, index) {
  const v = grid[index]
  return v !== 0 && v === solution[index]
}

export function isCellWrong(grid, solution, index) {
  const v = grid[index]
  return v !== 0 && v !== solution[index]
}

export function formatCellPrompt(size, row, col) {
  return `${getSudokuSizeLabel(size)} 数独 · 第 ${row + 1} 行第 ${col + 1} 列应填？`
}

export function buildDigitOptions(size, answer) {
  const nums = [...Array(size)].map((_, i) => String(i + 1))
  return shuffle(nums.filter((n) => n !== String(answer)).concat(String(answer))).slice(0, Math.min(4, size))
}

export function findHintCell(grid, solution, fixedMask) {
  const empties = grid
    .map((v, i) => ({ v, i }))
    .filter(({ v, i }) => v === 0 && !fixedMask[i])
  if (!empties.length) return null
  return empties[Math.floor(Math.random() * empties.length)].i
}
