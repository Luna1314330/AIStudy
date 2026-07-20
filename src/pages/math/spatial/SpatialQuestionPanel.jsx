import SpatialGrid from './SpatialGrid'
import SpatialCubeStack from './SpatialCubeStack'
import './SpatialQuestionPanel.css'

function HeightView({ heights }) {
  if (!heights?.length) return null

  return (
    <div className="spatial-height-view">
      {heights.map((row, rowIndex) => (
        <div key={rowIndex} className="spatial-height-view__row">
          {row.map((h, colIndex) => (
            <div key={colIndex} className="spatial-height-view__col">
              {Array.from({ length: h }).map((_, i) => (
                <span key={i} className="spatial-height-view__block" />
              ))}
              {h === 0 && <span className="spatial-height-view__empty">·</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function renderStem(question, previewGrid) {
  if (question.type === 'count') {
    return <SpatialCubeStack blocks={question.stem?.blocks} label="题目" />
  }

  if (question.type === 'top-view') {
    return (
      <div className="spatial-question__stem-duo">
        <HeightView heights={question.stem?.heights} />
        <p className="spatial-question__stem-note">↑ 正视图（高度）</p>
      </div>
    )
  }

  return (
    <SpatialGrid
      grid={previewGrid ?? question.stem?.grid}
      label={previewGrid ? '旋转预览' : '题目'}
      preview={Boolean(previewGrid)}
      highlight
    />
  )
}

export default function SpatialQuestionPanel({
  question,
  selected,
  onSelect,
  disabled = false,
  feedback = null,
  previewGrid = null,
}) {
  if (!question) return null

  const isCount = question.type === 'count'

  return (
    <div className="spatial-question">
      <p className="spatial-question__kind">空间题 · {isCount ? '数方块' : question.type === 'rotate' ? '旋转' : question.type === 'mirror' ? '镜像' : '俯视图'}</p>
      <h3 className="spatial-question__prompt">{question.prompt}</h3>

      <div className="spatial-question__stem">{renderStem(question, previewGrid)}</div>

      <div className={`spatial-question__options${isCount ? ' spatial-question__options--text' : ''}`}>
        {isCount
          ? question.options.map((option) => {
              const isSelected = selected === option
              const isCorrect = feedback && option === question.answer
              const isWrong = feedback && isSelected && option !== question.answer
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  className={[
                    'spatial-question__option spatial-question__option--text',
                    isSelected && 'spatial-question__option--selected',
                    isCorrect && 'spatial-question__option--correct',
                    isWrong && 'spatial-question__option--wrong',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelect(option)}
                >
                  {option} 个
                </button>
              )
            })
          : question.optionGrids?.map((option) => {
              const isSelected = selected === option.id
              const isCorrect = feedback && option.id === question.answer
              const isWrong = feedback && isSelected && option.id !== question.answer
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  className={[
                    'spatial-question__option',
                    isSelected && 'spatial-question__option--selected',
                    isCorrect && 'spatial-question__option--correct',
                    isWrong && 'spatial-question__option--wrong',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelect(option.id)}
                >
                  <SpatialGrid grid={option.grid} label={option.label} />
                </button>
              )
            })}
      </div>

      {feedback && (
        <p className={`spatial-question__feedback spatial-question__feedback--${feedback.type}`}>
          {feedback.message}
        </p>
      )}
    </div>
  )
}
