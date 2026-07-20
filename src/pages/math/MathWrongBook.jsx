import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MathBackButton from './components/MathBackButton'
import MathQuestionPanel from '@/pages/math/components/MathQuestionPanel'
import SpatialQuestionPanel from '@/pages/math/spatial/SpatialQuestionPanel'
import { checkSpeedAnswer } from '@/utils/speedCalcEngine'
import { checkMixedAnswer } from '@/utils/mixedCalcEngine'
import { checkSpatialAnswer } from '@/utils/spatialEngine'
import {
  clearWrongQuestions,
  getDueWrongQuestions,
  getWrongQuestions,
  recordWrongReviewResult,
  removeWrongQuestion,
} from '@/utils/mathStorage'
import './MathWrongBook.css'

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('zh-CN')
}

function toQuestion(item) {
  if (item.kind === 'spatial' && item.meta) {
    const meta = item.meta
    if (meta.type === 'count') {
      return {
        kind: 'spatial',
        type: 'count',
        prompt: item.prompt,
        answer: item.answer,
        options: meta.options ?? item.options,
        stem: { blocks: meta.blocks },
        meta,
      }
    }
    return {
      kind: 'spatial',
      type: meta.type,
      prompt: item.prompt,
      answer: item.answer,
      options: item.options,
      optionGrids: meta.optionGrids ?? meta.options,
      stem: meta.stem,
      meta,
    }
  }

  return {
    kind: item.kind,
    prompt: item.prompt,
    answer: item.answer,
    options: item.options,
  }
}

function checkReviewAnswer(question, option) {
  if (question.kind === 'spatial') return checkSpatialAnswer(question, option)
  if (question.kind === 'mixed-op') return checkMixedAnswer(question, option)
  return checkSpeedAnswer(question, option)
}

export default function MathWrongBook() {
  const [items, setItems] = useState([])
  const [reviewIndex, setReviewIndex] = useState(-1)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const dueItems = useMemo(() => getDueWrongQuestions(), [items])
  const reviewing = reviewIndex >= 0 && reviewIndex < dueItems.length
  const current = reviewing ? dueItems[reviewIndex] : null
  const question = current ? toQuestion(current) : null

  function reload() {
    setItems(getWrongQuestions())
  }

  useEffect(() => {
    reload()
  }, [])

  function handleRemove(id) {
    if (!window.confirm('确定从错题本移除这道题吗？')) return
    removeWrongQuestion(id)
    reload()
  }

  function handleClear() {
    if (!window.confirm('确定清空数学错题本吗？')) return
    clearWrongQuestions()
    setReviewIndex(-1)
    reload()
  }

  function startReview() {
    if (!dueItems.length) return
    setReviewIndex(0)
    setSelected(null)
    setFeedback(null)
  }

  function handleReviewAnswer(option) {
    if (!current || feedback) return
    setSelected(option)
    const ok = checkReviewAnswer(question, option)
    recordWrongReviewResult(current.id, ok)
    setFeedback({
      type: ok ? 'correct' : 'wrong',
      message: ok ? '复习正确！' : `再想想，答案是 ${current.answer}`,
    })
    reload()

    setTimeout(() => {
      const nextDue = getDueWrongQuestions()
      const nextIndex = reviewIndex + 1
      if (nextIndex < nextDue.length) {
        setReviewIndex(nextIndex)
        setSelected(null)
        setFeedback(null)
      } else {
        setReviewIndex(-1)
        setSelected(null)
        setFeedback(null)
      }
    }, ok ? 700 : 1000)
  }

  return (
    <div className="math-wrong">
      <header className="math-wrong__header">
        <MathBackButton to="/math" className="math-wrong__back">
          ← 脑力地图
        </MathBackButton>
        <div>
          <h2>数学错题本</h2>
          <p>挑战模式错题自动收录 · 3 天 / 7 天间隔复习 · 连对 2 次移除</p>
        </div>
      </header>

      {reviewing && question ? (
        <section className="math-wrong__review">
          <p className="math-wrong__review-meta">
            复习 {reviewIndex + 1} / {dueItems.length} · 已错 {current.wrongCount} 次
          </p>
          {question.kind === 'spatial' ? (
            <SpatialQuestionPanel
              question={question}
              selected={selected}
              disabled={Boolean(feedback)}
              feedback={feedback}
              onSelect={handleReviewAnswer}
            />
          ) : (
            <MathQuestionPanel
              question={question}
              selected={selected}
              disabled={Boolean(feedback)}
              feedback={feedback}
              showUnsure={false}
              onSelect={handleReviewAnswer}
            />
          )}
          <button
            type="button"
            className="math-wrong__stop"
            onClick={() => {
              setReviewIndex(-1)
              setFeedback(null)
            }}
          >
            结束复习
          </button>
        </section>
      ) : (
        <>
          <div className="math-wrong__actions">
            <button
              type="button"
              className="math-wrong__review-btn"
              onClick={startReview}
              disabled={!dueItems.length}
            >
              复习到期的题 ({dueItems.length})
            </button>
            {items.length > 0 && (
              <button type="button" className="math-wrong__clear" onClick={handleClear}>
                清空
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="math-wrong__empty">
              <span>🎉</span>
              <p>还没有错题，挑战继续加油！</p>
            </div>
          ) : (
            <ul className="math-wrong__list">
              {items.map((item) => {
                const isDue = !item.reviewAt || item.reviewAt <= Date.now()
                return (
                  <li key={item.id} className="math-wrong__item">
                    <div className="math-wrong__item-main">
                      <span className="math-wrong__item-kind">
                        {item.kind === 'estimation'
                          ? '估算'
                          : item.kind === 'mixed-op'
                            ? '混合'
                          : item.kind === 'spatial'
                            ? '空间'
                          : item.kind === 'sudoku'
                            ? '数独'
                            : item.kind === 'twentyfour'
                              ? '24点'
                              : '速算'}
                      </span>
                      <strong>{item.prompt}</strong>
                      <p>
                        答案 {item.answer} · 错 {item.wrongCount} 次 · 复习进度 {item.correctStreak ?? 0}/2
                      </p>
                      <p className="math-wrong__item-dates">
                        下次复习 {formatDate(item.reviewAt)}
                        {isDue && <span className="math-wrong__due"> · 已到期</span>}
                      </p>
                    </div>
                    <button type="button" className="math-wrong__remove" onClick={() => handleRemove(item.id)}>
                      移除
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
