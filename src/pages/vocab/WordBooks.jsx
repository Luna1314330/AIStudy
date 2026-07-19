import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteWordBook, getWordBooks } from '@/utils/vocabStorage'
import './WordBooks.css'

export default function WordBooks() {
  const [books, setBooks] = useState([])

  function reload() {
    setBooks(getWordBooks())
  }

  useEffect(() => {
    reload()
  }, [])

  function handleDelete(id, name) {
    if (!window.confirm(`确定删除词库「${name}」吗？`)) return
    deleteWordBook(id)
    reload()
  }

  const customBooks = books.filter((b) => b.type === 'custom')
  const textbookBooks = books.filter((b) => b.type !== 'custom')

  return (
    <div className="word-books">
      <header className="word-books__header">
        <div>
          <h2>词库管理</h2>
          <p>课本词库已内置，可编辑词语；也可自己新建词库</p>
        </div>
        <Link to="/chinese/vocab/books/new" className="word-books__add-btn">
          + 新建词库
        </Link>
      </header>

      <section className="word-books__section">
        <h3>课本词库</h3>
        <ul className="word-books__list">
          {textbookBooks.map((book) => (
            <li key={book.id} className="word-books__item">
              <div>
                <strong>{book.name}</strong>
                <span>
                  {book.words.length} 个词
                  {book.customized ? ' · 已修改' : ''}
                </span>
              </div>
              <div className="word-books__item-actions">
                <Link to={`/chinese/vocab/books/${book.id}`}>编辑</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="word-books__section">
        <h3>自定义词库</h3>
        {customBooks.length === 0 ? (
          <p className="word-books__empty">还没有自定义词库，点右上角新建</p>
        ) : (
          <ul className="word-books__list">
            {customBooks.map((book) => (
              <li key={book.id} className="word-books__item">
                <div>
                  <strong>{book.name}</strong>
                  <span>{book.words.length} 个词</span>
                </div>
                <div className="word-books__item-actions">
                  <Link to={`/chinese/vocab/books/${book.id}`}>编辑</Link>
                  <button type="button" onClick={() => handleDelete(book.id, book.name)}>
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
