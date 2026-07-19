import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVocabStore } from '@/store/vocabStore'
import {
  clearWrongWords,
  getWrongWords,
  removeWrongWord,
  wordsFromWrongBook,
} from '@/utils/vocabStorage'
import './WrongWords.css'

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function WrongWords() {
  const navigate = useNavigate()
  const startSession = useVocabStore((s) => s.startSession)
  const [words, setWords] = useState([])

  function reload() {
    setWords(getWrongWords())
  }

  useEffect(() => {
    reload()
  }, [])

  function handleRemove(word) {
    if (!window.confirm(`确定从错词本移除「${word}」吗？`)) return
    removeWrongWord(word)
    reload()
  }

  function handleClear() {
    if (!window.confirm('确定清空整个错词本吗？')) return
    clearWrongWords()
    reload()
  }

  function startReview() {
    const list = wordsFromWrongBook(words)
    if (!list.length) return

    startSession({
      words: shuffle(list),
      bookName: '错词听写',
      mode: 'review',
      settings: {
        repeats: 2,
        intervalSec: 10,
        readExample: true,
      },
      startedAt: Date.now(),
    })

    navigate('/chinese/vocab/dictation')
  }

  return (
    <div className="wrong-words">
      <header className="wrong-words__header">
        <h2>错词本</h2>
        <p>历次听写错的词会自动收录，优先复习</p>
      </header>

      {words.length === 0 ? (
        <div className="wrong-words__empty">
          <span>🎉</span>
          <p>还没有错词，继续保持！</p>
        </div>
      ) : (
        <>
          <div className="wrong-words__actions">
            <button type="button" className="wrong-words__review-btn" onClick={startReview}>
              开始错词听写（{words.length} 词）
            </button>
            <button type="button" className="wrong-words__clear-btn" onClick={handleClear}>
              清空错词本
            </button>
          </div>

          <ul className="wrong-words__list">
            {words.map((item) => (
              <li key={item.word} className="wrong-words__item">
                <div className="wrong-words__main">
                  <strong>{item.word}</strong>
                  {item.pinyin && <span className="wrong-words__pinyin">{item.pinyin}</span>}
                  <em className="wrong-words__meta">
                    错 {item.wrongCount} 次 · {item.lastWrongTime}
                  </em>
                </div>
                <button
                  type="button"
                  className="wrong-words__remove"
                  onClick={() => handleRemove(item.word)}
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
