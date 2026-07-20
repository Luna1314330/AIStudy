import { useMemo, useState } from 'react'
import './VocabChallenge.css'

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function VocabMatchGame({ words, onFinish }) {
  const cnOptions = useMemo(() => shuffle([...words]), [words])
  const [selectedEn, setSelectedEn] = useState(null)
  const [matchedEn, setMatchedEn] = useState(() => new Set())
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [wrongPair, setWrongPair] = useState(null)

  const allMatched = matchedEn.size === words.length
  const attempts = matchedEn.size + wrongAttempts
  const liveAccuracy = attempts ? Math.round((matchedEn.size / attempts) * 100) : 100

  function handlePickEn(en) {
    if (matchedEn.has(en)) return
    setWrongPair(null)
    setSelectedEn((prev) => (prev === en ? null : en))
  }

  function handlePickCn(targetWord) {
    if (!selectedEn || allMatched) return

    if (targetWord.en === selectedEn) {
      const next = new Set(matchedEn)
      next.add(selectedEn)
      setMatchedEn(next)
      setSelectedEn(null)
      setWrongPair(null)
      if (next.size === words.length) {
        onFinish?.({
          totalWords: words.length,
          wrongAttempts,
        })
      }
      return
    }

    setWrongAttempts((count) => count + 1)
    setWrongPair({ en: selectedEn, cnKey: targetWord.en })
    window.setTimeout(() => {
      setWrongPair(null)
      setSelectedEn(null)
    }, 600)
  }

  return (
    <div className="vocab-challenge">
      <p className="vocab-challenge__intro">
        先点一个<strong>英文</strong>，再点对应的<strong>中文</strong>。全部配对完成后，正确率需达到
        <strong> 80%</strong> 才能点亮神庙。
      </p>
      <div className="vocab-match">
        <div className="vocab-match__col">
          <p className="vocab-match__label">英文</p>
          {words.map((word) => {
            const matched = matchedEn.has(word.en)
            const selected = selectedEn === word.en
            const wrong = wrongPair?.en === word.en
            return (
              <button
                key={word.en}
                type="button"
                disabled={matched}
                className={[
                  'vocab-match__chip',
                  'vocab-match__chip--en',
                  matched && 'vocab-match__chip--matched',
                  selected && 'vocab-match__chip--selected',
                  wrong && 'vocab-match__chip--wrong',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handlePickEn(word.en)}
              >
                {word.en}
              </button>
            )
          })}
        </div>
        <div className="vocab-match__col">
          <p className="vocab-match__label">中文</p>
          {cnOptions.map((word) => {
            const matched = matchedEn.has(word.en)
            const wrong = wrongPair?.cnKey === word.en
            return (
              <button
                key={word.en}
                type="button"
                disabled={matched}
                className={[
                  'vocab-match__chip',
                  'vocab-match__chip--cn',
                  matched && 'vocab-match__chip--matched',
                  wrong && 'vocab-match__chip--wrong',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handlePickCn(word)}
              >
                {word.cn}
              </button>
            )
          })}
        </div>
      </div>
      <p className="vocab-challenge__meta">
        已完成 {matchedEn.size} / {words.length} 组配对 · 当前正确率 {liveAccuracy}%
      </p>
    </div>
  )
}
