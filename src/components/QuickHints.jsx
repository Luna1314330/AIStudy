import './QuickHints.css'

export default function QuickHints({ label, hints, disabled = false, onSelect }) {
  if (!hints?.length) return null

  return (
    <div className="quick-hints">
      {label && <span className="quick-hints__label">{label}</span>}
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
