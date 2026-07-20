import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { SPATIAL_GUIDE } from '@/data/mathBrainMap'
import SpatialQuestionPanel from './SpatialQuestionPanel'
import {
  checkSpatialAnswer,
  generateSpatialQuestion,
  getSpatialPreviewGrid,
} from '@/utils/spatialEngine'
import {
  getMathGrade,
  hasSpaceIntuition,
  markDailyBrainComplete,
  recordSpatialChallengeWin,
  recordSpatialStreakWin,
  recordWrongQuestion,
} from '@/utils/mathStorage'
import '../Spatial.css'

const CHALLENGE_TOTAL = 8
const STREAK_TOTAL = 3

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export default function SpatialPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') || 'practice'
  const isDaily = params.get('daily') === '1'
  const isPractice = mode === 'practice'
  const isStreak = mode === 'streak'
  const isChallenge = mode === 'challenge' || isStreak
  const grade = getMathGrade()
  const hasIntuition = hasSpaceIntuition()

  const totalQuestions = isStreak ? STREAK_TOTAL : CHALLENGE_TOTAL

  const [phase, setPhase] = useState('ready')
  const [round, setRound] = useState(0)
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [hostLine, setHostLine] = useState(SPATIAL_GUIDE.intro)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [previewUsed, setPreviewUsed] = useState(false)
  const [previewGrid, setPreviewGrid] = useState(null)
  const [won, setPassed] = useState(false)

  const title = useMemo(() => {
    if (isPractice) return '自由练习'
    if (isStreak) return `连闯 ${Math.max(round, 1)}/${STREAK_TOTAL}`
    return '挑战一组'
  }, [isPractice, isStreak, round])

  const canPreview =
    hasIntuition &&
    isChallenge &&
    !isPractice &&
    question &&
    (question.type === 'rotate' || question.type === 'mirror')

  const startRound = useCallback(
    (index = 1) => {
      setRound(index)
      setQuestion(generateSpatialQuestion(grade))
      setSelected(null)
      setFeedback(null)
      setPreviewGrid(null)
      setHostLine(index === 1 ? SPATIAL_GUIDE.intro : `第 ${index} 题，继续！`)
      setPhase('playing')
    },
    [grade],
  )

  function finishChallenge(finalCorrect, finalWrong, success) {
    if (isStreak) {
      if (success) {
        recordSpatialStreakWin()
        if (isDaily) markDailyBrainComplete(todayKey())
      }
      setPassed(success)
      setHostLine(success ? SPATIAL_GUIDE.streakWin : SPATIAL_GUIDE.streakLose)
      setPhase('done')
      return
    }

    if (isChallenge && !isPractice) {
      const passed = recordSpatialChallengeWin({ correct: finalCorrect, wrong: finalWrong })
      if (isDaily && passed) markDailyBrainComplete(todayKey())
      setPassed(passed)
      setHostLine(passed ? SPATIAL_GUIDE.win : SPATIAL_GUIDE.lose)
      setPhase('done')
      return
    }

    setPassed(success)
    setHostLine(success ? '练习完成，空间感越来越准了！' : '练习结束，多练几题会更稳！')
    setPhase('done')
  }

  function handleAnswer(option) {
    if (phase !== 'playing' || feedback || !question) return
    setSelected(option)

    const ok = checkSpatialAnswer(question, option)
    if (ok) {
      const nextCorrect = correct + 1
      setCorrect(nextCorrect)
      setFeedback({ type: 'correct', message: '正确！' })

      if (round >= totalQuestions) {
        window.setTimeout(() => finishChallenge(nextCorrect, wrong, true), 650)
        return
      }

      window.setTimeout(() => {
        setPreviewUsed(false)
        startRound(round + 1)
      }, 650)
      return
    }

    const nextWrong = wrong + 1
    setWrong(nextWrong)
    const answerLabel = question.type === 'count' ? `${question.answer} 个` : question.answer
    setFeedback({
      type: 'wrong',
      message: `${SPATIAL_GUIDE.wrong} 答案：${answerLabel}`,
    })
    setHostLine('换个角度再看看～')

    if (isChallenge && !isPractice) {
      recordWrongQuestion(question, { grade, project: 'spatial' })
    }

    if (isStreak) {
      window.setTimeout(() => finishChallenge(correct, nextWrong, false), 900)
      return
    }

    if (round >= totalQuestions) {
      window.setTimeout(() => finishChallenge(correct, nextWrong, false), 900)
      return
    }

    window.setTimeout(() => {
      setPreviewUsed(false)
      startRound(round + 1)
    }, 900)
  }

  function handlePreview() {
    if (!canPreview || previewUsed || previewGrid) return
    const grid = getSpatialPreviewGrid(question)
    if (!grid) return
    setPreviewGrid(grid)
    setPreviewUsed(true)
    setHostLine('空间直觉：预览已显示，不会告诉你选哪一项哦～')
  }

  const accuracy = useMemo(() => {
    const total = correct + wrong
    if (!total) return 0
    return correct / total
  }, [correct, wrong])

  return (
    <div className="spatial-play">
      <header className="spatial-play__header">
        <MathBackButton to={`/math/spatial${isDaily ? '?daily=1' : ''}`} className="spatial-hub__back">
          ← 空间挑战
        </MathBackButton>
        <div>
          <h2>{title}</h2>
          <p>{SPATIAL_GUIDE.name} · {isStreak ? '一错即停' : `${totalQuestions} 题一组`}</p>
        </div>
      </header>

      <section className="spatial-hub__host spatial-hub__host--compact">
        <span className="spatial-hub__host-avatar">{SPATIAL_GUIDE.avatar}</span>
        <div>
          <strong>{SPATIAL_GUIDE.name}</strong>
          <p>{hostLine}</p>
        </div>
      </section>

      {phase === 'ready' && (
        <div className="spatial-play__ready">
          <p>
            {isPractice && '练习模式不计星，错题不进错题本。'}
            {mode === 'challenge' && '8 题一组，正确率 ≥80% 得 1 星。'}
            {isStreak && '连闯 3 题全对，点亮空间挑战并获得「空间直觉」。'}
          </p>
          <button
            type="button"
            className="spatial-card__btn spatial-card__btn--gold"
            onClick={() => {
              setPreviewUsed(false)
              setCorrect(0)
              setWrong(0)
              startRound(1)
            }}
          >
            开始
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div className="spatial-play__hud">
            <span>
              第 {round} / {totalQuestions} 题
            </span>
            {!isPractice && (
              <span>
                已对 {correct} · 已错 {wrong}
              </span>
            )}
            {canPreview && (
              <button
                type="button"
                className="spatial-play__vision"
                onClick={handlePreview}
                disabled={previewUsed || Boolean(feedback)}
              >
                {previewUsed ? '预览已用' : '旋转预览'}
              </button>
            )}
          </div>

          <SpatialQuestionPanel
            question={question}
            selected={selected}
            disabled={Boolean(feedback)}
            feedback={feedback}
            previewGrid={previewGrid}
            onSelect={handleAnswer}
          />
        </>
      )}

      {phase === 'done' && (
        <div className="spatial-play__result">
          <h3>{won ? '挑战成功！' : isPractice ? '练习结束' : '挑战失败'}</h3>
          <p>{hostLine}</p>
          {!isPractice && (
            <p>
              正确 {correct} 题 · 错误 {wrong} 题 · 正确率 {Math.round(accuracy * 100)}%
            </p>
          )}
          {won && isStreak && (
            <p className="spatial-play__pass">空间挑战已点亮 · 获得「空间直觉」· +2 星</p>
          )}
          {won && mode === 'challenge' && <p className="spatial-play__pass">挑战通关 · +1 星</p>}
          <div className="spatial-play__result-actions">
            <button
              type="button"
              className="spatial-card__btn spatial-card__btn--soft"
              onClick={() => {
                setCorrect(0)
                setWrong(0)
                setPreviewUsed(false)
                setPhase('ready')
                setHostLine(SPATIAL_GUIDE.intro)
              }}
            >
              再来一次
            </button>
            <button
              type="button"
              className="spatial-card__btn"
              onClick={() => navigate(`/math/spatial${isDaily ? '?daily=1' : ''}`)}
            >
              返回空间挑战
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
