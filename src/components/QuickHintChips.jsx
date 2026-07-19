import './QuickHintChips.css'

export default function QuickHintChips({ hints, disabled, onSelect }) {
  if (!hints?.length) return null

  return (
    <div className="quick-hints">
      <span className="quick-hints__label">快捷提示</span>
      <div className="quick-hints__list">
        {hints.map((hint) => (
          <button
            key={hint}
            type="button"
            className="quick-hints__chip"
            disabled={disabled}
            onClick={() => onSelect(hint)}
          >
            {hint}
          </button>
        ))}
      </div>
    </div>
  )
}
