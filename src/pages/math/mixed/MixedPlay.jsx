import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { MIXED_MENTOR } from '@/data/mathBrainMap'
import MathQuestionPanel from '@/pages/math/components/MathQuestionPanel'
import { checkMixedAnswer, generateMixedQuestion } from '@/utils/mixedCalcEngine'
import {
  getMathGrade,
  hasCalcVision,
  markDailyBrainComplete,
  recordMixedChallengeWin,
  recordMixedStreakWin,
  recordWrongQuestion,
} from '@/utils/mathStorage'
import '../Mixed.css'

const CHALLENGE_TOTAL = 10
const STREAK_TOTAL = 5

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export default function MixedPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') || 'practice'
  const isDaily = params.get('daily') === '1'
  const isPractice = mode === 'practice'
  const isStreak = mode === 'streak'
  const isChallenge = mode === 'challenge' || isStreak
  const grade = getMathGrade()
  const hasVision = hasCalcVision()

  const totalQuestions = isStreak ? STREAK_TOTAL : CHALLENGE_TOTAL

  const [phase, setPhase] = useState('ready')
  const [round, setRound] = useState(0)
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [hostLine, setHostLine] = useState(MIXED_MENTOR.intro)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [visionUsed, setVisionUsed] = useState(false)
  const [visionHint, setVisionHint] = useState(null)
  const [won, setPassed] = useState(false)

  const title = useMemo(() => {
    if (isPractice) return '自由练习'
    if (isStreak) return `连闯 ${round}/${STREAK_TOTAL}`
    return '挑战一组'
  }, [isPractice, isStreak, round])

  const startRound = useCallback(
    (index = 1) => {
      setRound(index)
      setQuestion(generateMixedQuestion(grade))
      setSelected(null)
      setFeedback(null)
      setVisionHint(null)
      setHostLine(index === 1 ? MIXED_MENTOR.intro : `第 ${index} 题，继续！`)
      setPhase('playing')
    },
    [grade],
  )

  function finishChallenge(finalCorrect, finalWrong, success) {
    if (isStreak) {
      if (success) {
        recordMixedStreakWin()
        if (isDaily) markDailyBrainComplete(todayKey())
      }
      setPassed(success)
      setHostLine(success ? MIXED_MENTOR.streakWin : MIXED_MENTOR.streakLose)
      setPhase('done')
      return
    }

    if (isChallenge && !isPractice) {
      const passed = recordMixedChallengeWin({ correct: finalCorrect, wrong: finalWrong })
      if (isDaily && passed) markDailyBrainComplete(todayKey())
      setPassed(passed)
      setHostLine(passed ? MIXED_MENTOR.win : MIXED_MENTOR.lose)
      setPhase('done')
      return
    }

    setPassed(success)
    setHostLine(success ? '练习完成，继续保持！' : '练习结束，下次加油！')
    setPhase('done')
  }

  function handleAnswer(option) {
    if (phase !== 'playing' || feedback || !question) return
    setSelected(option)

    const ok = checkMixedAnswer(question, option)
    if (ok) {
      const nextCorrect = correct + 1
      setCorrect(nextCorrect)
      setFeedback({ type: 'correct', message: '正确！' })

      if (round >= totalQuestions) {
        window.setTimeout(() => finishChallenge(nextCorrect, wrong, true), 650)
        return
      }

      window.setTimeout(() => startRound(round + 1), 650)
      return
    }

    const nextWrong = wrong + 1
    setWrong(nextWrong)
    setFeedback({
      type: 'wrong',
      message: `${MIXED_MENTOR.wrong} 答案：${question.answer}`,
    })
    setHostLine('这题要留意运算顺序！')

    if (isChallenge && !isPractice) {
      recordWrongQuestion(question, { grade, project: 'mixed' })
    }

    if (isStreak) {
      window.setTimeout(() => finishChallenge(correct, nextWrong, false), 900)
      return
    }

    if (round >= totalQuestions) {
      window.setTimeout(() => finishChallenge(correct, nextWrong, false), 900)
      return
    }

    window.setTimeout(() => startRound(round + 1), 900)
  }

  function handleHint() {
    if (!hasVision || visionUsed || !question?.hint || phase !== 'playing') return
    setVisionUsed(true)
    setVisionHint(question.hint)
    setHostLine(`运算透视：${question.hint}`)
  }

  const accuracy = useMemo(() => {
    const total = correct + wrong
    if (!total) return 0
    return correct / total
  }, [correct, wrong])

  return (
    <div className="mixed-play">
      <header className="mixed-play__header">
        <MathBackButton to={`/math/mixed${isDaily ? '?daily=1' : ''}`} className="mixed-hub__back">
          ← 四则混合
        </MathBackButton>
        <div>
          <h2>{title}</h2>
          <p>{MIXED_MENTOR.name} · {isStreak ? '一错即停' : `${totalQuestions} 题一组`}</p>
        </div>
      </header>

      <section className="mixed-hub__host mixed-hub__host--compact">
        <span className="mixed-hub__host-avatar">{MIXED_MENTOR.avatar}</span>
        <div>
          <strong>{MIXED_MENTOR.name}</strong>
          <p>{hostLine}</p>
        </div>
      </section>

      {phase === 'ready' && (
        <div className="mixed-play__ready">
          <p>
            {isPractice && '练习模式不计星，错题不进错题本。'}
            {mode === 'challenge' && '10 题一组，正确率 ≥80% 得 1 星。'}
            {isStreak && '连闯 5 题全对，点亮四则混合并获得「运算透视」。'}
          </p>
          <button type="button" className="mixed-card__btn mixed-card__btn--gold" onClick={() => startRound(1)}>
            开始
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div className="mixed-play__hud">
            <span>
              第 {round} / {totalQuestions} 题
            </span>
            {!isPractice && (
              <span>
                已对 {correct} · 已错 {wrong}
              </span>
            )}
            {hasVision && isChallenge && (
              <button
                type="button"
                className="mixed-play__vision"
                onClick={handleHint}
                disabled={visionUsed || Boolean(feedback)}
              >
                {visionUsed ? '透视已用' : '运算透视'}
              </button>
            )}
          </div>

          {visionHint && <p className="mixed-play__vision-tip">提示：{visionHint}</p>}

          <MathQuestionPanel
            question={question}
            selected={selected}
            disabled={Boolean(feedback)}
            feedback={feedback}
            showUnsure={false}
            onSelect={handleAnswer}
          />
        </>
      )}

      {phase === 'done' && (
        <div className="mixed-play__result">
          <h3>{won ? '挑战成功！' : isPractice ? '练习结束' : '挑战失败'}</h3>
          <p>{hostLine}</p>
          {!isPractice && (
            <p className="mixed-play__summary">
              正确 {correct} 题 · 错误 {wrong} 题 · 正确率 {Math.round(accuracy * 100)}%
            </p>
          )}
          {won && isStreak && (
            <p className="mixed-play__pass">四则混合已点亮 · 获得「运算透视」· +2 星</p>
          )}
          {won && mode === 'challenge' && (
            <p className="mixed-play__pass">挑战通关 · +1 星</p>
          )}
          <div className="mixed-play__result-actions">
            <button type="button" className="mixed-card__btn mixed-card__btn--soft" onClick={() => {
              setCorrect(0)
              setWrong(0)
              setVisionUsed(false)
              setPhase('ready')
              setHostLine(MIXED_MENTOR.intro)
            }}>
              再来一次
            </button>
            <button
              type="button"
              className="mixed-card__btn"
              onClick={() => navigate(`/math/mixed${isDaily ? '?daily=1' : ''}`)}
            >
              返回四则混合
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
