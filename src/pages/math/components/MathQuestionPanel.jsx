import './MathQuestionPanel.css'

export default function MathQuestionPanel({
  question,
  selected,
  onSelect,
  onUnsure,
  showUnsure = true,
  disabled = false,
  feedback = null,
}) {
  if (!question) return null

  return (
    <div className="math-question">
      <p className="math-question__kind">
        {question.kind === 'estimation' ? '估算题' : question.kind === 'mixed-op' ? '混合运算题' : '速算题'}
      </p>
      <h3 className="math-question__prompt">{question.prompt}</h3>

      <div className="math-question__options">
        {question.options.map((option) => {
          const isSelected = selected === option
          const isCorrect = feedback && option === question.answer
          const isWrong = feedback && isSelected && option !== question.answer
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              className={[
                'math-question__option',
                isSelected && 'math-question__option--selected',
                isCorrect && 'math-question__option--correct',
                isWrong && 'math-question__option--wrong',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          )
        })}
      </div>

      {showUnsure && onUnsure && (
        <button type="button" className="math-question__unsure" disabled={disabled} onClick={onUnsure}>
          我不确定
        </button>
      )}

      {feedback && (
        <p className={`math-question__feedback math-question__feedback--${feedback.type}`}>
          {feedback.message}
        </p>
      )}
    </div>
  )
}
