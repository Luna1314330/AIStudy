import './SpatialGrid.css'

export default function SpatialGrid({ grid, label, highlight = false, preview = false }) {
  if (!grid?.length) return null

  const cols = grid[0].length

  return (
    <div className={`spatial-grid-wrap${highlight ? ' spatial-grid-wrap--highlight' : ''}${preview ? ' spatial-grid-wrap--preview' : ''}`}>
      {label && <span className="spatial-grid-wrap__label">{label}</span>}
      <div
        className="spatial-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        aria-hidden="true"
      >
        {grid.flat().map((cell, index) => (
          <div
            key={index}
            className={`spatial-grid__cell${cell ? ' spatial-grid__cell--on' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
