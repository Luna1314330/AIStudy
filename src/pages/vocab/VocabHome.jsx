import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVocabStore } from '@/store/vocabStore'
import {
  getDictationSettings,
  getWordBooks,
  getWrongWords,
  saveDictationSettings,
  wordsFromWrongBook,
} from '@/utils/vocabStorage'
import { isSpeechSupported } from '@/utils/speech'
import { bookPickerLabel, groupWordBooks } from '@/utils/wordBookGroups'
import './VocabHome.css'

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function VocabHome() {
  const navigate = useNavigate()
  const startSession = useVocabStore((s) => s.startSession)

  const [books, setBooks] = useState([])
  const [wrongWords, setWrongWords] = useState([])
  const [selectedBookId, setSelectedBookId] = useState('')
  const [mode, setMode] = useState('standard')
  const [settings, setSettings] = useState({
    repeats: 2,
    intervalSec: 10,
    readExample: true,
  })

  useEffect(() => {
    const loadedBooks = getWordBooks()
    const loadedWrong = getWrongWords()
    const loadedSettings = getDictationSettings()

    setBooks(loadedBooks)
    setWrongWords(loadedWrong)
    setSettings(loadedSettings)
    setSelectedBookId(loadedBooks[0]?.id || '')
  }, [])

  function updateSettings(patch) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveDictationSettings(next)
  }

  function handleStart() {
    let words = []
    let bookName = ''

    if (mode === 'review') {
      if (!wrongWords.length) return
      words = shuffle(wordsFromWrongBook(wrongWords))
      bookName = '错词听写'
    } else {
      const book = books.find((item) => item.id === selectedBookId)
      if (!book?.words?.length) return
      words = shuffle([...book.words])
      bookName = book.name
    }

    startSession({
      words,
      bookName,
      mode,
      settings: { ...settings },
      startedAt: Date.now(),
    })

    navigate('/chinese/vocab/dictation')
  }

  const speechOk = isSpeechSupported()
  const bookGroups = groupWordBooks(books)
  const selectedBook = books.find((book) => book.id === selectedBookId) || null
  const canStart =
    speechOk &&
    ((mode === 'review' && wrongWords.length > 0) ||
      (mode === 'standard' && books.some((b) => b.id === selectedBookId && b.words.length)))

  return (
    <div className="vocab-home">
      <header className="vocab-home__hero">
        <span className="vocab-home__emoji">✏️</span>
        <h2>生词听写</h2>
        <p>听词写词，自己对照批改，错词自动收录</p>
      </header>

      {!speechOk && (
        <div className="vocab-home__warn">
          当前浏览器不支持语音朗读，请换用 Chrome / Edge / Safari。
        </div>
      )}

      <section className="vocab-panel vocab-panel--compact">
        <div className="vocab-mode-row">
          <h3>听写模式</h3>
          <div className="vocab-mode-segment">
            <button
              type="button"
              className={`vocab-mode-option${mode === 'standard' ? ' vocab-mode-option--active' : ''}`}
              onClick={() => setMode('standard')}
            >
              <span className="vocab-mode-option__icon" aria-hidden="true">📚</span>
              标准听写
            </button>
            <button
              type="button"
              className={`vocab-mode-option${mode === 'review' ? ' vocab-mode-option--active' : ''}`}
              onClick={() => setMode('review')}
              disabled={!wrongWords.length}
            >
              <span className="vocab-mode-option__icon" aria-hidden="true">🔁</span>
              错词听写
              {wrongWords.length > 0 && (
                <span className="vocab-mode-option__count">{wrongWords.length}</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {mode === 'standard' && (
        <section className="vocab-panel vocab-panel--compact vocab-book-picker">
          <label className="vocab-book-picker__label" htmlFor="vocab-book-select">
            选择词库
          </label>
          <div className="vocab-book-picker__row">
            <select
              id="vocab-book-select"
              className="vocab-book-select"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
            >
              {bookGroups.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {bookPickerLabel(book)}（{book.words.length} 词）
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {selectedBook && (
            <p className="vocab-book-picker__summary">
              <strong>{selectedBook.name}</strong>
              <span>
                {selectedBook.words.length} 个词
                {selectedBook.type === 'custom' ? ' · 自定义' : ''}
                {selectedBook.customized ? ' · 已修改' : ''}
              </span>
            </p>
          )}
        </section>
      )}

      <section className="vocab-panel">
        <h3>朗读设置</h3>
        <div className="vocab-settings">
          <div className="vocab-setting-row">
            <span>每个词读几遍</span>
            <div className="vocab-setting-options">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`vocab-chip${settings.repeats === n ? ' vocab-chip--active' : ''}`}
                  onClick={() => updateSettings({ repeats: n })}
                >
                  {n} 遍
                </button>
              ))}
            </div>
          </div>

          <label className="vocab-toggle">
            <input
              type="checkbox"
              checked={settings.readExample}
              onChange={(e) => updateSettings({ readExample: e.target.checked })}
            />
            <span>读例句（如：奥秘——大自然有很多奥秘）</span>
          </label>
        </div>
      </section>

      <button
        type="button"
        className="vocab-start-btn"
        disabled={!canStart}
        onClick={handleStart}
      >
        开始听写
      </button>
    </div>
  )
}
