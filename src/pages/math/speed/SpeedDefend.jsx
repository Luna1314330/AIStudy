import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { SPEED_CHAMPION } from '@/data/mathBrainMap'
import MathQuestionPanel from '@/pages/math/components/MathQuestionPanel'
import { checkSpeedAnswer, generateSpeedQuestion } from '@/utils/speedCalcEngine'
import {
  getMathGrade,
  markDailyBrainComplete,
  recordDefendWin,
  recordWrongQuestion,
} from '@/utils/mathStorage'
import '../SpeedArena.css'

const TOTAL_ROUNDS = 5

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export default function SpeedDefend() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'challenge' ? 'challenge' : 'practice'
  const isDaily = params.get('daily') === '1'
  const isChallenge = mode === 'challenge'
  const grade = getMathGrade()

  const [phase, setPhase] = useState('ready')
  const [round, setRound] = useState(0)
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [hostLine, setHostLine] = useState(SPEED_CHAMPION.intro)
  const [won, setWon] = useState(false)

  function startRound(index = 1) {
    setRound(index)
    setQuestion(generateSpeedQuestion(grade))
    setSelected(null)
    setFeedback(null)
    setHostLine(index === 1 ? '第一题，放马过来！' : `第 ${index} 题，继续！`)
    setPhase('playing')
  }

  function handleAnswer(option, { fromUnsure = false } = {}) {
    if (phase !== 'playing' || feedback || !question) return
    setSelected(option)

    if (fromUnsure) {
      setFeedback({ type: 'info', message: SPEED_CHAMPION.unsure })
      setHostLine('不确定也算被守住了～')
      setTimeout(() => {
        setWon(false)
        setHostLine(SPEED_CHAMPION.lose)
        setPhase('done')
      }, 800)
      return
    }

    const ok = checkSpeedAnswer(question, option)
    if (ok) {
      setFeedback({ type: 'correct', message: '命中！' })
      if (round >= TOTAL_ROUNDS) {
        setTimeout(() => {
          if (isChallenge) recordDefendWin()
          if (isDaily && isChallenge) markDailyBrainComplete(todayKey())
          setWon(true)
          setHostLine(SPEED_CHAMPION.win)
          setPhase('done')
        }, 700)
        return
      }
      setTimeout(() => startRound(round + 1), 650)
      return
    }

    setFeedback({
      type: 'wrong',
      message: `${SPEED_CHAMPION.wrong} 答案：${question.answer}`,
    })
    setHostLine('这题被守住了！')
    if (isChallenge) {
      recordWrongQuestion(question, { grade, project: 'speed' })
    }
    setTimeout(() => {
      setWon(false)
      setHostLine(SPEED_CHAMPION.lose)
      setPhase('done')
    }, 900)
  }

  return (
    <div className="speed-session">
      <header className="speed-session__header">
        <MathBackButton to={`/math/speed${isDaily ? '?daily=1' : ''}`} className="speed-arena__back">
          ← 速算擂台
        </MathBackButton>
        <div>
          <h2>{isChallenge ? '攻擂' : '守擂练习'}</h2>
          <p>闪电小算 · 连闯 {TOTAL_ROUNDS} 题</p>
        </div>
      </header>

      <section className="speed-arena__host speed-arena__host--inline">
        <span className="speed-arena__host-avatar">{SPEED_CHAMPION.avatar}</span>
        <div>
          <strong>{SPEED_CHAMPION.name}</strong>
          <p>{hostLine}</p>
        </div>
      </section>

      {phase === 'ready' && (
        <div className="speed-session__ready">
          <p>{isChallenge ? '五题全对才算攻擂成功，点亮擂台并获得「速算感应」。' : '练习模式不计星，放心试手。'}</p>
          <button type="button" className="speed-card__btn speed-card__btn--gold" onClick={() => startRound(1)}>
            {isChallenge ? '开始攻擂' : '开始练习'}
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div className="speed-session__hud">
            <span>第 {round} / {TOTAL_ROUNDS} 题</span>
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
          <h3>{won ? '攻擂成功！' : '守擂失败'}</h3>
          <p>{hostLine}</p>
          {won && isChallenge && (
            <p className="speed-session__pass">擂台已点亮 · 获得「速算感应」· +2 星</p>
          )}
          <div className="speed-session__result-actions">
            <button type="button" className="speed-card__btn speed-card__btn--soft" onClick={() => setPhase('ready')}>
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
