import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createCustomBookId,
  getWordBookById,
  normalizeWords,
  resetTextbookBook,
  saveWordBook,
} from '@/utils/vocabStorage'
import {
  buildWordEntries,
  wordsToCommaText,
} from '@/utils/wordEnrich'
import './WordBookEdit.css'

export default function WordBookEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [bookMeta, setBookMeta] = useState(null)
  const [name, setName] = useState('')
  const [rawInput, setRawInput] = useState('')
  const [entries, setEntries] = useState([])

  const isTextbook = bookMeta?.type === 'textbook'

  useEffect(() => {
    if (isNew) return

    const book = getWordBookById(id)
    if (!book) {
      navigate('/chinese/vocab/books', { replace: true })
      return
    }

    setBookMeta(book)
    setName(book.name)
    setEntries(book.words)
    setRawInput(wordsToCommaText(book.words))
  }, [id, isNew, navigate])

  function handleGenerate() {
    const trimmed = rawInput.trim()
    if (!trimmed) {
      window.alert('请先输入词语，多个词用中文逗号隔开')
      return
    }
    setEntries((previous) => buildWordEntries(trimmed, previous, { refreshExamples: true }))
  }

  function updateEntry(index, field, value) {
    setEntries((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  function removeEntry(index) {
    setEntries((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
  }

  function handleReset() {
    if (!isTextbook) return
    if (!window.confirm('确定恢复为内置词库吗？你的修改将被清除。')) return

    const book = resetTextbookBook(id)
    if (!book) {
      navigate('/chinese/vocab/books', { replace: true })
      return
    }

    setBookMeta(book)
    setName(book.name)
    setEntries(book.words)
    setRawInput(wordsToCommaText(book.words))
  }

  function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      window.alert('请填写词库名称')
      return
    }

    let words = normalizeWords(entries)
    if (!words.length && rawInput.trim()) {
      words = normalizeWords(buildWordEntries(rawInput.trim()))
    }

    if (!words.length) {
      window.alert('请至少录入一个词语')
      return
    }

    saveWordBook({
      ...(bookMeta || {}),
      id: isNew ? createCustomBookId() : id,
      name: isTextbook ? bookMeta.name : trimmedName,
      type: isTextbook ? 'textbook' : 'custom',
      words,
    })

    navigate('/chinese/vocab/books')
  }

  return (
    <div className="word-book-edit">
      <header className="word-book-edit__header">
        <Link to="/chinese/vocab/books">← 返回</Link>
        <h2>
          {isNew ? '新建词库' : isTextbook ? '编辑课本词库' : '编辑词库'}
        </h2>
        {isTextbook && (
          <p className="word-book-edit__hint">课本词库名称固定，可修改词语、拼音和例句</p>
        )}
      </header>

      <label className="word-book-edit__field">
        <span>词库名称</span>
        <input
          type="text"
          value={name}
          placeholder="例如：本周复习词语"
          readOnly={isTextbook}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="word-book-edit__field">
        <span>输入词语（用逗号隔开）</span>
        <textarea
          rows={4}
          value={rawInput}
          placeholder="奥秘，谦虚，姿势，精致"
          onChange={(e) => setRawInput(e.target.value)}
        />
        <em>多个词语用中文逗号「，」隔开，也可使用英文逗号</em>
      </label>

      <button type="button" className="word-book-edit__generate" onClick={handleGenerate}>
        生成词语表
      </button>

      {entries.length > 0 && (
        <section className="word-book-edit__table-wrap">
          <h3>词语明细（可修改拼音和例句）</h3>
          <div className="word-book-edit__table">
            <div className="word-book-edit__table-head">
              <span>词语</span>
              <span>拼音</span>
              <span>例句</span>
              <span aria-hidden="true" />
            </div>
            {entries.map((entry, index) => (
              <div className="word-book-edit__table-row" key={`${entry.word}-${index}`}>
                <input
                  type="text"
                  value={entry.word}
                  onChange={(e) => updateEntry(index, 'word', e.target.value)}
                />
                <input
                  type="text"
                  value={entry.pinyin}
                  placeholder="自动生成"
                  onChange={(e) => updateEntry(index, 'pinyin', e.target.value)}
                />
                <input
                  type="text"
                  value={entry.example}
                  placeholder="自动生成"
                  onChange={(e) => updateEntry(index, 'example', e.target.value)}
                />
                <button
                  type="button"
                  className="word-book-edit__remove"
                  title="删除"
                  onClick={() => removeEntry(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="word-book-edit__actions">
        {isTextbook && (
          <button type="button" className="word-book-edit__reset" onClick={handleReset}>
            恢复默认
          </button>
        )}
        <button type="button" className="word-book-edit__save" onClick={handleSave}>
          保存词库
        </button>
      </div>
    </div>
  )
}
