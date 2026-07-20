import { getConflictIndices } from '@/utils/sudokuEngine'
import './SudokuGrid.css'

export default function SudokuGrid({
  size,
  grid,
  fixedMask,
  selectedIndex,
  onSelect,
  wrongIndices = [],
  flashIndex = null,
  hintIndices = [],
  showConflicts = false,
}) {
  const conflicts = showConflicts ? getConflictIndices(grid, size) : []
  const boxSpec = size === 4 ? { w: 2, h: 2 } : size === 6 ? { w: 3, h: 2 } : { w: 3, h: 3 }

  return (
    <div
      className={`sudoku-grid sudoku-grid--${size}`}
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
      }}
    >
      {grid.map((value, index) => {
        const { r, c } = { r: Math.floor(index / size), c: index % size }
        const isFixed = fixedMask[index]
        const isSelected = selectedIndex === index
        const isWrong = wrongIndices.includes(index)
        const isConflict = conflicts.includes(index)
        const isHint = hintIndices.includes(index)
        const isFlash = flashIndex === index
        const thickRight = (c + 1) % boxSpec.w === 0 && c !== size - 1
        const thickBottom = (r + 1) % boxSpec.h === 0 && r !== size - 1

        return (
          <button
            key={index}
            type="button"
            className={[
              'sudoku-grid__cell',
              isFixed && 'sudoku-grid__cell--fixed',
              isSelected && 'sudoku-grid__cell--selected',
              isWrong && 'sudoku-grid__cell--wrong',
              isFlash && 'sudoku-grid__cell--flash',
              isConflict && 'sudoku-grid__cell--conflict',
              isHint && 'sudoku-grid__cell--hint',
              thickRight && 'sudoku-grid__cell--thick-right',
              thickBottom && 'sudoku-grid__cell--thick-bottom',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={isFixed}
            onClick={() => onSelect(index)}
            aria-label={`第 ${r + 1} 行第 ${c + 1} 列${value ? ` 数字 ${value}` : ' 空格'}`}
          >
            {value || ''}
          </button>
        )
      })}
    </div>
  )
}
