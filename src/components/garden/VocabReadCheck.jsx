import './VocabChallenge.css'

export default function VocabReadCheck({ words, checkedIds, onToggle, onContinue }) {
  const checkedCount = checkedIds.size

  return (
    <div className="vocab-challenge">
      <p className="vocab-challenge__intro">
        下面是这本绘本的核心词。请对照纸质绘本，<strong>会读的词打勾</strong>（不用打字，不用录音）。
      </p>
      <ul className="vocab-read-list">
        {words.map((word) => {
          const id = word.en
          const checked = checkedIds.has(id)
          return (
            <li key={id} className={`vocab-read-list__item${checked ? ' vocab-read-list__item--checked' : ''}`}>
              <button
                type="button"
                className="vocab-read-list__check"
                aria-pressed={checked}
                onClick={() => onToggle(id)}
              >
                <span className="vocab-read-list__box">{checked ? '✓' : ''}</span>
              </button>
              <div className="vocab-read-list__text">
                <span className="vocab-read-list__en">{word.en}</span>
                <span className="vocab-read-list__cn">{word.cn}</span>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="vocab-challenge__meta">
        已勾选 {checkedCount} / {words.length} 个词
      </p>
      <button type="button" className="garden-shrine__primary" onClick={onContinue}>
        进入中英配对
      </button>
    </div>
  )
}
