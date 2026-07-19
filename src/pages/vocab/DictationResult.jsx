import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVocabStore } from '@/store/vocabStore'
import {
  addWrongWords,
  saveDictationHistory,
} from '@/utils/vocabStorage'
import './DictationResult.css'

export default function DictationResult() {
  const navigate = useNavigate()
  const session = useVocabStore((s) => s.session)
  const clearSession = useVocabStore((s) => s.clearSession)

  const words = session?.words || []
  const [revealed, setRevealed] = useState(false)
  const [grades, setGrades] = useState(() => words.map(() => null))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!session?.words?.length) {
      navigate('/chinese/vocab', { replace: true })
    }
  }, [session, navigate])

  const stats = useMemo(() => {
    const marked = grades.filter((g) => g !== null)
    const correct = grades.filter((g) => g === true).length
    const wrong = grades.filter((g) => g === false).length
    const total = words.length
    const rate = marked.length ? Math.round((correct / marked.length) * 100) : 0
    return { correct, wrong, total, marked: marked.length, rate }
  }, [grades, words.length])

  function setGrade(wordIndex, value) {
    if (saved || !revealed) return
    setGrades((prev) => prev.map((item, i) => (i === wordIndex ? value : item)))
  }

  function markAllCorrect() {
    if (saved || !revealed) return
    setGrades(words.map(() => true))
  }

  function handleSubmit() {
    if (!revealed) return
    if (stats.marked < words.length) {
      window.alert('请先把每个词标记为对或错')
      return
    }

    const wrongList = words.filter((_, i) => grades[i] === false)
    if (wrongList.length) addWrongWords(wrongList)

    saveDictationHistory({
      wordBook: session.bookName,
      mode: session.mode,
      total: words.length,
      correct: stats.correct,
      wrong: stats.wrong,
      accuracy: stats.rate,
    })

    setSaved(true)
  }

  function handleBackHome() {
    clearSession()
    navigate('/chinese/vocab')
  }

  if (!session) return null

  return (
    <div className="dictation-result">
      <header className="dictation-result__header">
        <h2>听写完成</h2>
        <p>
          {revealed
            ? '对照纸上的内容，每个词点 ✓ 或 ✗'
            : '先检查纸上的听写，准备好了再查看词语'}
        </p>
      </header>

      {saved && (
        <div className="dictation-result__summary">
          <strong>正确率 {stats.rate}%</strong>
          <span>
            共 {stats.total} 词 · 对 {stats.correct} · 错 {stats.wrong}
          </span>
          {stats.wrong > 0 && <em>错的词已加入错词本</em>}
        </div>
      )}

      <div className={`dictation-result__body${revealed ? ' dictation-result__body--revealed' : ' dictation-result__body--pending'}`}>
        {!revealed ? (
          <div className="dictation-result__pending-card">
            <span className="dictation-result__mask-icon">📝</span>
            <p>本次共听写 {words.length} 个词</p>
            <p className="dictation-result__mask-tip">请先对照纸面内容，再查看答案</p>
            <button
              type="button"
              className="dictation-result__reveal-btn"
              onClick={() => setRevealed(true)}
            >
              查看听写词语
            </button>
          </div>
        ) : (
          <>
            <div className="dictation-result__toolbar">
              <button
                type="button"
                className="dictation-result__tool-btn"
                onClick={markAllCorrect}
                disabled={saved}
              >
                全部打 ✓
              </button>
              <span className="dictation-result__stat">
                已标记 {stats.marked}/{stats.total}
              </span>
            </div>

            <div className="dictation-result__list-scroll">
              <ul className="dictation-result__list">
                {words.map((entry, index) => (
                  <li key={`${entry.word}-${index}`} className="dictation-result__item">
                    <div className="dictation-result__answer">
                      <strong>{entry.word}</strong>
                      {entry.pinyin && (
                        <span className="dictation-result__pinyin">{entry.pinyin}</span>
                      )}
                      {entry.example && (
                        <p className="dictation-result__example">{entry.example}</p>
                      )}
                    </div>
                    <div className="dictation-result__grade">
                      <button
                        type="button"
                        className={`dictation-result__mark dictation-result__mark--ok${
                          grades[index] === true ? ' dictation-result__mark--selected' : ''
                        }`}
                        disabled={saved}
                        onClick={() => setGrade(index, true)}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className={`dictation-result__mark dictation-result__mark--bad${
                          grades[index] === false ? ' dictation-result__mark--selected' : ''
                        }`}
                        disabled={saved}
                        onClick={() => setGrade(index, false)}
                      >
                        ✗
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {revealed && (
        <div className="dictation-result__footer">
          {!saved ? (
            <button type="button" className="dictation-result__submit" onClick={handleSubmit}>
              保存结果
            </button>
          ) : (
            <button type="button" className="dictation-result__submit" onClick={handleBackHome}>
              返回首页
            </button>
          )}
        </div>
      )}
    </div>
  )
}
