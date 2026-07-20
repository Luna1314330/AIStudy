import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { TWENTYFOUR_DEALER } from '@/data/mathBrainMap'
import {
  checkFinalValue,
  combineCards,
  createCardStack,
  fmt,
  generateTwentyFourPuzzle,
  getHintByLevel,
  getMaxHintsPerRound,
  getVisionHint,
  OPS,
} from '@/utils/twentyFourEngine'
import {
  getMathGrade,
  hasCalcVision,
  markDailyBrainComplete,
  recordTwentyFourChallengeWin,
  recordTwentyFourStreakWin,
  recordTwentyFourWrong,
} from '@/utils/mathStorage'
import '../TwentyFour.css'

const MAX_MISTAKES = 3
const STREAK_TOTAL = 5

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function createRound(grade) {
  const puzzle = generateTwentyFourPuzzle(grade)
  return {
    puzzle,
    stack: createCardStack(puzzle.cards),
    history: [],
  }
}

export default function TwentyFourPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') || 'practice'
  const isDaily = params.get('daily') === '1'
  const isPractice = mode === 'practice'
  const isStreak = mode === 'streak'
  const isChallenge = mode === 'challenge' || isStreak
  const grade = getMathGrade()
  const hasVision = hasCalcVision()

  const [round, setRound] = useState(() => createRound(grade))
  const [selectedId, setSelectedId] = useState(null)
  const [pendingOp, setPendingOp] = useState(null)
  const [mistakes, setMistakes] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintText, setHintText] = useState(null)
  const [hostLine, setHostLine] = useState(TWENTYFOUR_DEALER.intro)
  const [phase, setPhase] = useState('playing')
  const [streakRound, setStreakRound] = useState(1)
  const [won, setWon] = useState(false)
  const [alert, setAlert] = useState(null)
  const failTimerRef = useRef(null)

  const maxHints = useMemo(
    () => getMaxHintsPerRound({ isPractice, hasVision }),
    [isPractice, hasVision],
  )
  const hintsLeft = maxHints === Infinity ? Infinity : Math.max(0, maxHints - hintsUsed)

  const title = useMemo(() => {
    if (isPractice) return '自由练习'
    if (isStreak) return `连闯 ${streakRound}/${STREAK_TOTAL}`
    return '挑战一题'
  }, [isPractice, isStreak, streakRound])

  useEffect(() => () => {
    if (failTimerRef.current) clearTimeout(failTimerRef.current)
  }, [])

  const resetRound = useCallback(
    (nextStreak = streakRound) => {
      setRound(createRound(grade))
      setSelectedId(null)
      setPendingOp(null)
      setMistakes(0)
      setHintsUsed(0)
      setHintText(null)
      setAlert(null)
      setPhase('playing')
      setStreakRound(nextStreak)
      setHostLine(isStreak ? TWENTYFOUR_DEALER.streakIntro : TWENTYFOUR_DEALER.intro)
      if (failTimerRef.current) {
        clearTimeout(failTimerRef.current)
        failTimerRef.current = null
      }
    },
    [grade, isStreak, streakRound],
  )

  function showAlert(payload) {
    setAlert(payload)
    window.setTimeout(() => setAlert(null), 1000)
  }

  function failGame(message) {
    setPhase('done')
    setWon(false)
    setHostLine(message || (isStreak ? TWENTYFOUR_DEALER.streakLose : TWENTYFOUR_DEALER.lose))
  }

  function handleWin() {
    if (isPractice) {
      setPhase('done')
      setWon(true)
      setHostLine(TWENTYFOUR_DEALER.win)
      return
    }

    if (isStreak) {
      if (streakRound >= STREAK_TOTAL) {
        recordTwentyFourStreakWin()
        if (isDaily) markDailyBrainComplete(todayKey())
        setPhase('done')
        setWon(true)
        setHostLine(TWENTYFOUR_DEALER.streakWin)
        return
      }
      setHostLine(`第 ${streakRound} 题完成！下一题～`)
      window.setTimeout(() => resetRound(streakRound + 1), 700)
      return
    }

    recordTwentyFourChallengeWin()
    if (isDaily) markDailyBrainComplete(todayKey())
    setPhase('done')
    setWon(true)
    setHostLine(TWENTYFOUR_DEALER.win)
  }

  function registerWrong(reason) {
    if (!isChallenge) return
    const next = mistakes + 1
    setMistakes(next)
    setHostLine(TWENTYFOUR_DEALER.wrong)
    recordTwentyFourWrong({
      cards: round.puzzle.cards,
      answer: round.puzzle.steps[round.puzzle.steps.length - 1] ?? '24',
    })
    showAlert({
      type: next >= MAX_MISTAKES ? 'critical' : 'wrong',
      title: next >= MAX_MISTAKES ? '❌ 失误已满 3 次' : `❌ 还没算出 24 · 失误 ${next}/${MAX_MISTAKES}`,
      message: reason,
      sub: next >= MAX_MISTAKES ? '本局即将结束…' : '换种顺序再试试',
    })
    if (next >= MAX_MISTAKES) {
      failTimerRef.current = window.setTimeout(() => {
        setAlert(null)
        failGame('失误满 3 次，本局结束')
      }, 1000)
    }
  }

  function handleCardClick(card) {
    if (phase !== 'playing') return

    if (!pendingOp) {
      setSelectedId(card.id)
      return
    }

    if (!selectedId || selectedId === card.id) return

    const a = round.stack.find((item) => item.id === selectedId)
    const b = card
    if (!a) return

    const merged = combineCards(a, b, pendingOp)
    if (!merged) return

    const nextStack = round.stack.filter((item) => item.id !== a.id && item.id !== b.id).concat(merged)
    const nextHistory = [...round.history, { stack: round.stack, selectedId, pendingOp }]

    setRound({ ...round, stack: nextStack, history: nextHistory })
    setSelectedId(null)
    setPendingOp(null)

    if (nextStack.length === 1) {
      if (checkFinalValue(nextStack[0].value)) {
        handleWin()
      } else if (isChallenge) {
        registerWrong(`最后结果是 ${fmt(nextStack[0].value)}，不是 24`)
      } else {
        setHostLine(`结果是 ${fmt(nextStack[0].value)}，还不是 24，点撤销或换一题`)
      }
    }
  }

  function handleOpClick(sym) {
    if (phase !== 'playing' || !selectedId) return
    setPendingOp(sym)
  }

  function handleUndo() {
    if (!round.history.length) return
    const prev = round.history[round.history.length - 1]
    setRound({
      ...round,
      stack: prev.stack,
      history: round.history.slice(0, -1),
    })
    setSelectedId(prev.selectedId)
    setPendingOp(prev.pendingOp)
  }

  function handleHint() {
    if (hintsLeft <= 0) return

    const nextLevel = hintsUsed
    const text = getHintByLevel(round.puzzle, nextLevel)
    setHintsUsed((n) => n + 1)
    setHintText(text)
    setHostLine(isPractice ? '看看提示，再自己试试～' : `提示 ${hintsUsed + 1}/${maxHints} · 不会直接给最终答案`)
  }

  function handleShowAnswer() {
    if (!isPractice) return
    setHostLine(`参考解法：${round.puzzle.steps.join(' → ')}`)
  }

  function handleNewPuzzle() {
    resetRound(isStreak ? streakRound : 1)
  }

  return (
    <div className="tf-play">
      <header className="tf-hub__header">
        <MathBackButton to={`/math/twentyfour${isDaily ? '?daily=1' : ''}`} className="tf-hub__back">
          ← 24 点实验室
        </MathBackButton>
        <div>
          <h2>{title}</h2>
          <p>{grade} 年级 · 四张牌算出 24</p>
        </div>
      </header>

      <section className="tf-hub__host tf-hub__host--compact">
        <span className="tf-hub__host-avatar">{TWENTYFOUR_DEALER.avatar}</span>
        <p>{hostLine}</p>
      </section>

      {phase === 'playing' && (
        <>
          {isChallenge && (
            <div className={`tf-play__hud${mistakes > 0 ? ' tf-play__hud--warn' : ''}`}>
              <span>失误 {mistakes}/{MAX_MISTAKES}</span>
              <span>
                提示 {hintsUsed}/{maxHints}
                {hasVision && maxHints > 1 ? ' · 运算透视' : ''}
              </span>
            </div>
          )}

          {hintText && (
            <div className="tf-play__hint" role="status">
              <span className="tf-play__hint-label">💡 提示</span>
              <p>{hintText}</p>
            </div>
          )}

          <div className="tf-play__board-wrap">
            {alert && (
              <div className="tf-play__overlay" role="alert">
                <div className={`tf-play__toast tf-play__toast--${alert.type}`}>
                  <strong>{alert.title}</strong>
                  <span>{alert.message}</span>
                  {alert.sub && <em>{alert.sub}</em>}
                </div>
              </div>
            )}

            <div className="tf-cards">
              {round.stack.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={[
                    'tf-cards__item',
                    selectedId === card.id && 'tf-cards__item--selected',
                    pendingOp && selectedId === card.id && 'tf-cards__item--ready',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleCardClick(card)}
                >
                  <span className="tf-cards__value">{card.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tf-ops">
            {OPS.map((op) => (
              <button
                key={op.sym}
                type="button"
                className={['tf-ops__btn', pendingOp === op.sym && 'tf-ops__btn--active']
                  .filter(Boolean)
                  .join(' ')}
                disabled={!selectedId}
                onClick={() => handleOpClick(op.sym)}
              >
                {op.sym}
              </button>
            ))}
          </div>

          <p className="tf-play__guide">
            {pendingOp
              ? '再点一张牌合并'
              : selectedId
                ? '选一个运算符'
                : '先点一张牌'}
          </p>

          <div className="tf-play__tools">
            <button type="button" className="tf-card__btn tf-card__btn--soft" onClick={handleUndo} disabled={!round.history.length}>
              撤销
            </button>
            <button
              type="button"
              className="tf-card__btn tf-card__btn--soft"
              onClick={handleHint}
              disabled={hintsLeft <= 0}
            >
              {isPractice
                ? '提示'
                : hintsLeft > 0
                  ? `提示（剩 ${hintsLeft} 次）`
                  : '提示已用完'}
            </button>
            {isPractice && (
              <>
                <button type="button" className="tf-card__btn tf-card__btn--soft" onClick={handleShowAnswer}>
                  看解法
                </button>
                <button type="button" className="tf-card__btn" onClick={handleNewPuzzle}>
                  换一题
                </button>
              </>
            )}
          </div>
        </>
      )}

      {phase === 'done' && (
        <div className="tf-play__result">
          <h3>{won ? '完成！' : '本局结束'}</h3>
          <p>{hostLine}</p>
          {won && isChallenge && !isStreak && <p className="tf-play__reward">挑战成功 · +1 星</p>}
          {won && isStreak && <p className="tf-play__reward">连闯成功 · 运算透视 · +2 星 · 点亮实验室</p>}
          <div className="tf-play__result-actions">
            <button type="button" className="tf-card__btn tf-card__btn--soft" onClick={() => resetRound(1)}>
              再来一局
            </button>
            <button
              type="button"
              className="tf-card__btn"
              onClick={() => navigate(`/math/twentyfour${isDaily ? '?daily=1' : ''}`)}
            >
              返回
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
