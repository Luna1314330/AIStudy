import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { MATH_PASS_ACCURACY, SPEED_CHAMPION } from '@/data/mathBrainMap'
import MathQuestionPanel from '@/pages/math/components/MathQuestionPanel'
import { checkSpeedAnswer, generateSpeedQuestion } from '@/utils/speedCalcEngine'
import {
  getMathGrade,
  getSuperpowerBonusSeconds,
  markDailyBrainComplete,
  recordBlitzResult,
  recordWrongQuestion,
} from '@/utils/mathStorage'
import '../SpeedArena.css'

const BASE_SECONDS = 60

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export default function SpeedBlitz60() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'challenge' ? 'challenge' : 'practice'
  const isDaily = params.get('daily') === '1'
  const isChallenge = mode === 'challenge'

  const grade = getMathGrade()
  const totalSeconds = BASE_SECONDS + getSuperpowerBonusSeconds()

  const [phase, setPhase] = useState('ready')
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [passed, setPassed] = useState(false)

  const timerRef = useRef(null)
  const lockedRef = useRef(false)
  const statsRef = useRef({ correct: 0, wrong: 0, bestStreak: 0 })

  useEffect(() => {
    statsRef.current = { correct, wrong, bestStreak }
  }, [correct, wrong, bestStreak])

  const accuracy = useMemo(() => {
    const total = correct + wrong
    if (!total) return 0
    return correct / total
  }, [correct, wrong])

  const nextQuestion = useCallback(() => {
    setQuestion(generateSpeedQuestion(grade))
    setSelected(null)
    setFeedback(null)
    lockedRef.current = false
  }, [grade])

  const finish = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const { correct: c, wrong: w, bestStreak: b } = statsRef.current
    const finalPassed = isChallenge ? recordBlitzResult({ correct: c, wrong: w, streak: b }) : false
    if (isDaily && isChallenge && finalPassed) {
      markDailyBrainComplete(todayKey())
    }
    setPassed(finalPassed)
    setPhase('done')
  }, [isChallenge, isDaily])

  useEffect(() => {
    if (phase !== 'playing') return undefined

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          finish()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, finish])

  function startGame() {
    setPhase('playing')
    setSecondsLeft(totalSeconds)
    setCorrect(0)
    setWrong(0)
    setStreak(0)
    setBestStreak(0)
    nextQuestion()
  }

  function handleAnswer(option, { fromUnsure = false } = {}) {
    if (phase !== 'playing' || lockedRef.current || !question) return
    lockedRef.current = true
    setSelected(option)

    if (fromUnsure) {
      setFeedback({ type: 'info', message: SPEED_CHAMPION.unsure })
      setTimeout(nextQuestion, 700)
      return
    }

    const ok = checkSpeedAnswer(question, option)
    if (ok) {
      setCorrect((c) => c + 1)
      setStreak((s) => {
        const next = s + 1
        setBestStreak((b) => Math.max(b, next))
        return next
      })
      setFeedback({ type: 'correct', message: '正确！' })
    } else {
      setWrong((w) => w + 1)
      setStreak(0)
      if (isChallenge) {
        recordWrongQuestion(question, { grade, project: 'speed' })
      }
      setFeedback({
        type: 'wrong',
        message: `${SPEED_CHAMPION.wrong} 答案：${question.answer}`,
      })
    }

    setTimeout(nextQuestion, ok ? 450 : 900)
  }

  return (
    <div className="speed-session">
      <header className="speed-session__header">
        <MathBackButton to={`/math/speed${isDaily ? '?daily=1' : ''}`} className="speed-arena__back">
          ← 速算擂台
        </MathBackButton>
        <div>
          <h2>60 秒{isChallenge ? '挑战' : '练习'}</h2>
          <p>{grade} 年级 · {totalSeconds} 秒{getSuperpowerBonusSeconds() ? '（含超能力）' : ''}</p>
        </div>
      </header>

      {phase === 'ready' && (
        <div className="speed-session__ready">
          <p>一屏一题，计时结束看正确率与连对 streak。</p>
          {isChallenge && <p>挑战达标：正确率 ≥ {Math.round(MATH_PASS_ACCURACY * 100)}% 得 1 星</p>}
          <button type="button" className="speed-card__btn" onClick={startGame}>
            开始
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div className="speed-session__hud">
            <span className="speed-session__timer">{secondsLeft}s</span>
            <span>连对 {streak}</span>
            <span>对 {correct} / 错 {wrong}</span>
          </div>
          <MathQuestionPanel
            question={question}
            selected={selected}
            disabled={Boolean(feedback)}
            feedback={feedback}
            onSelect={(option) => handleAnswer(option)}
            onUnsure={() => handleAnswer(null, { fromUnsure: true })}
          />
        </>
      )}

      {phase === 'done' && (
        <div className="speed-session__result">
          <h3>时间到！</h3>
          <p>
            答对 {correct} 题 · 答错 {wrong} 题 · 最高连对 {bestStreak}
          </p>
          <p>
            正确率 {(accuracy * 100).toFixed(0)}%
            {isChallenge && (
              <span className={passed ? 'speed-session__pass' : 'speed-session__fail'}>
                {passed ? ' · 挑战成功 +1 星' : ' · 未达标'}
              </span>
            )}
          </p>
          <div className="speed-session__result-actions">
            <button type="button" className="speed-card__btn speed-card__btn--soft" onClick={startGame}>
              再来一次
            </button>
            <button
              type="button"
              className="speed-card__btn"
              onClick={() => navigate(`/math/speed${isDaily ? '?daily=1' : ''}`)}
            >
              返回擂台
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
