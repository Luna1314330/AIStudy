import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import VocabMatchGame from '@/components/garden/VocabMatchGame'
import VocabReadCheck from '@/components/garden/VocabReadCheck'
import { getBookVocab, hasBookVocab } from '@/data/gardenBookVocab'
import { getGardenBook, formatBookTitleCn, getBookSeriesLabel } from '@/data/englishReadingKingdom'
import {
  CHALLENGE_PASS_ACCURACY,
  canEnterShrine,
  isShrineCompleted,
  submitChallengeResult,
} from '@/utils/gardenStorage'
import './GardenShrine.css'

export default function GardenShrine() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const book = useMemo(() => getGardenBook(bookId), [bookId])
  const vocab = useMemo(() => getBookVocab(bookId), [bookId])
  const hasVocab = vocab.length > 0
  const [completed, setCompleted] = useState(() => isShrineCompleted(bookId))
  const [step, setStep] = useState(completed ? 'done' : 'read')
  const [checkedIds, setCheckedIds] = useState(() => new Set())
  const [matchAttempt, setMatchAttempt] = useState(0)
  const [failResult, setFailResult] = useState(null)

  const canAccess = useMemo(() => {
    if (!book) return false
    return canEnterShrine(book.id)
  }, [book])

  if (!book) {
    return (
      <div className="garden-shrine garden-shrine--empty">
        <p>未找到这座神庙。</p>
        <Link to="/english/garden">返回初始台地</Link>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="garden-shrine garden-shrine--empty">
        <p>这座神庙还未解锁。请先抽卡，或在「进行中」列表里选择已开启的绘本神庙。</p>
        <Link to="/english/garden">返回初始台地</Link>
      </div>
    )
  }

  const seriesLabel = getBookSeriesLabel(book.id)
  const passPercent = Math.round(CHALLENGE_PASS_ACCURACY * 100)

  function handleFinishReading() {
    if (!hasVocab) return
    setFailResult(null)
    setStep('vocab-read')
  }

  function handleToggleVocab(wordId) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(wordId)) next.delete(wordId)
      else next.add(wordId)
      return next
    })
  }

  function handleContinueToMatch() {
    setFailResult(null)
    setStep('vocab-match')
  }

  function handleMatchFinish({ totalWords, wrongAttempts }) {
    const result = submitChallengeResult(book.id, { totalWords, wrongAttempts })
    if (result.passed) {
      setCompleted(true)
      setFailResult(null)
      setStep('done')
      return
    }

    setFailResult(result)
    setStep('failed')
  }

  function handleRetryMatch() {
    setFailResult(null)
    setMatchAttempt((value) => value + 1)
    setStep('vocab-match')
  }

  return (
    <div className="garden-shrine">
      <header className="garden-shrine__header">
        <Link to="/english/garden" className="garden-shrine__back">
          ← 返回神庙地图
        </Link>
        <div className={`garden-shrine__badge${completed ? ' garden-shrine__badge--lit' : ''}`}>
          {completed ? '已点亮' : '未点亮'}
        </div>
      </header>

      <div className="garden-shrine__hero">
        <img src={book.coverImage} alt={book.title} className="garden-shrine__cover" />
        <div>
          <p className="garden-shrine__label">{seriesLabel || book.assetFolder}</p>
          <h2>{book.title}</h2>
          <p className="garden-shrine__subtitle">{formatBookTitleCn(book.titleCn)}</p>
        </div>
        <span className={`garden-shrine__icon${completed ? ' garden-shrine__icon--lit' : ''}`} />
      </div>

      <section className="garden-shrine__panel">
        <h3>绘本阅读</h3>
        <div className="garden-shrine__book">
          <img src={book.coverImage} alt={book.title} className="garden-shrine__book-cover" />
          <div className="garden-shrine__book-body">
            <p>
              请用<strong>纸质绘本</strong>完成阅读。这里只展示封面与核心词挑战，不上传内页、不做录音或播放。
            </p>
            <p className="garden-shrine__book-note">
              读完后进入挑战：先勾选自评「会读的词」，再把英文和中文配对。正确率需达到 {passPercent}% 才能点亮。
            </p>
            {step === 'read' && hasVocab && (
              <button type="button" className="garden-shrine__primary" onClick={handleFinishReading}>
                我读完这本绘本了
              </button>
            )}
            {step === 'read' && !hasVocab && (
              <p className="garden-shrine__vocab-empty">
                这本的核心词还在录入中，暂时无法挑战。你可以先读纸质书，稍后再来。
              </p>
            )}
          </div>
        </div>
      </section>

      {step !== 'read' && step !== 'done' && hasVocab && (
        <section className="garden-shrine__panel">
          <h3>
            {step === 'vocab-read'
              ? '核心词 · 会读打勾'
              : step === 'failed'
                ? '挑战未达标'
                : '核心词 · 中英配对'}
          </h3>
          {step === 'vocab-read' && (
            <VocabReadCheck
              words={vocab}
              checkedIds={checkedIds}
              onToggle={handleToggleVocab}
              onContinue={handleContinueToMatch}
            />
          )}
          {step === 'vocab-match' && (
            <VocabMatchGame key={matchAttempt} words={vocab} onFinish={handleMatchFinish} />
          )}
          {step === 'failed' && failResult && (
            <div className="garden-shrine__failed">
              <p>
                本次正确率 <strong>{failResult.accuracyPercent}%</strong>，未达到 {passPercent}%。
                这座神庙仍为<strong>进行中</strong>，可以立刻再挑战，也可以返回抽卡再次被抽中。
              </p>
              <div className="garden-shrine__failed-actions">
                <button type="button" className="garden-shrine__primary" onClick={handleRetryMatch}>
                  再挑战一次
                </button>
                <button
                  type="button"
                  className="garden-shrine__secondary"
                  onClick={() => navigate('/english/garden')}
                >
                  返回抽卡
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 'done' && (
        <section className="garden-shrine__panel">
          <h3>神庙挑战</h3>
          <div className="garden-shrine__done">
            <p>🎉 挑战完成，这座神庙已点亮！获得 ⭐ {book.starsReward}</p>
            <button
              type="button"
              className="garden-shrine__primary"
              onClick={() => navigate('/english/garden')}
            >
              返回抽卡继续冒险
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
