import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import VocabMatchGame from '@/components/garden/VocabMatchGame'
import { sampleVocabForBooks } from '@/data/gardenBookVocab'
import { getGardenBook, getGardenRegion, formatBookTitleCn } from '@/data/englishReadingKingdom'
import {
  CHALLENGE_PASS_ACCURACY,
  PERIODIC_TEST_BOOK_INTERVAL,
  getPeriodicTestBookIds,
  isPeriodicTestDue,
  skipPeriodicTestNoVocab,
  submitPeriodicTestResult,
} from '@/utils/gardenStorage'
import './GardenPeriodicTest.css'

export default function GardenPeriodicTest() {
  const navigate = useNavigate()
  const gardenRegion = getGardenRegion()
  const testDue = useMemo(() => isPeriodicTestDue(), [])
  const bookIds = useMemo(() => getPeriodicTestBookIds(), [])
  const books = useMemo(
    () => bookIds.map((id) => getGardenBook(id)).filter(Boolean),
    [bookIds],
  )
  const words = useMemo(() => sampleVocabForBooks(bookIds, { limit: 10 }), [bookIds])
  const [result, setResult] = useState(null)
  const [skippedNoVocab, setSkippedNoVocab] = useState(false)
  const passPercent = Math.round(CHALLENGE_PASS_ACCURACY * 100)

  useEffect(() => {
    if (!testDue || words.length || skippedNoVocab) return
    skipPeriodicTestNoVocab()
    setSkippedNoVocab(true)
  }, [testDue, words.length, skippedNoVocab])

  if (!testDue) {
    return (
      <div className="garden-periodic-test garden-periodic-test--empty">
        <p>当前不需要复习测验，可以直接去抽卡。</p>
        <Link to="/english/garden">返回初始台地</Link>
      </div>
    )
  }

  if (!words.length) {
    return (
      <div className="garden-periodic-test garden-periodic-test--empty">
        <p>最近 {PERIODIC_TEST_BOOK_INTERVAL} 本绘本的核心词还在录入中，本次测验已跳过。</p>
        <button type="button" className="garden-periodic-test__primary" onClick={() => navigate('/english/garden')}>
          返回抽卡
        </button>
      </div>
    )
  }

  function handleFinish({ totalWords, wrongAttempts }) {
    setResult(submitPeriodicTestResult({ totalWords, wrongAttempts }))
  }

  return (
    <div className="garden-periodic-test" style={{ backgroundColor: gardenRegion?.bgColor }}>
      <header className="garden-periodic-test__header">
        <Link to="/english/garden" className="garden-periodic-test__back">
          ← 返回初始台地
        </Link>
        <div>
          <h2 className="garden-periodic-test__title">📚 复习测验</h2>
          <p className="garden-periodic-test__desc">
            每完成 {PERIODIC_TEST_BOOK_INTERVAL} 本「抽卡且挑战通过」的绘本，抽卡前需做一次中英配对复习。正确率{' '}
            {passPercent}% 以上加 ⭐ 1 颗，未达标减 ⭐ 1 颗。
          </p>
        </div>
      </header>

      <section className="garden-periodic-test__books">
        <p className="garden-periodic-test__books-label">
          本次复习范围（最近 {books.length} 本已点亮绘本）
        </p>
        <ul className="garden-periodic-test__book-list">
          {books.map((book) => (
            <li key={book.id}>
              <img src={book.coverImage} alt={book.title} />
              <span>{formatBookTitleCn(book.titleCn) || book.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="garden-periodic-test__panel">
        {!result ? (
          <>
            <h3>中英配对 · {words.length} 个词</h3>
            <VocabMatchGame
              words={words}
              onFinish={handleFinish}
              intro={
                <>
                  从最近完成挑战的绘本中抽出的核心词。先点<strong>英文</strong>，再点对应的
                  <strong>中文</strong>。全部配对完成后，正确率需达到<strong> {passPercent}%</strong> 才算合格。
                </>
              }
            />
          </>
        ) : (
          <div className={`garden-periodic-test__result${result.passed ? ' garden-periodic-test__result--pass' : ' garden-periodic-test__result--fail'}`}>
            <h3>{result.passed ? '测验合格 🎉' : '测验未达标'}</h3>
            <p>
              本次正确率 <strong>{result.accuracyPercent}%</strong>
              {result.passed ? '，达到合格线！' : `，未达到 ${passPercent}%。`}
            </p>
            <p className="garden-periodic-test__star-delta">
              {result.starDelta > 0 ? `获得 ⭐ ${result.starDelta} 颗` : `失去 ⭐ ${Math.abs(result.starDelta)} 颗`}
            </p>
            <button
              type="button"
              className="garden-periodic-test__primary"
              onClick={() => navigate('/english/garden')}
            >
              返回抽卡
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
