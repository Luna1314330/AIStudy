import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { SUDOKU_GUARDIAN } from '@/data/mathBrainMap'
import SudokuGrid from '@/pages/math/sudoku/SudokuGrid'
import {
  findHintCell,
  generateSudokuPuzzle,
  getSudokuSizeForGrade,
  getSudokuSizeLabel,
  isCellWrong,
  isPuzzleComplete,
} from '@/utils/sudokuEngine'
import {
  getMathGrade,
  hasLogicShield,
  markDailyBrainComplete,
  recordSudokuChallengeWin,
  recordSudokuStreakWin,
  recordSudokuWrongCell,
} from '@/utils/mathStorage'
import '../Sudoku.css'

const MAX_MISTAKES = 3
const STREAK_TOTAL = 3

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function createSession(grade, mode) {
  const playMode = mode === 'practice' ? 'practice' : 'challenge'
  return generateSudokuPuzzle(grade, { mode: playMode })
}

export default function SudokuPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = params.get('mode') || 'practice'
  const isDaily = params.get('daily') === '1'
  const isPractice = mode === 'practice'
  const isStreak = mode === 'streak'
  const isChallenge = mode === 'challenge' || isStreak
  const grade = getMathGrade()
  const size = getSudokuSizeForGrade(grade)

  const [session, setSession] = useState(() => createSession(grade, mode))
  const [grid, setGrid] = useState(() => [...session.puzzle])
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [wrongIndices, setWrongIndices] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [shieldUsed, setShieldUsed] = useState(false)
  const [showConflicts, setShowConflicts] = useState(false)
  const [hostLine, setHostLine] = useState(SUDOKU_GUARDIAN.intro)
  const [phase, setPhase] = useState('playing')
  const [streakRound, setStreakRound] = useState(1)
  const [won, setWon] = useState(false)
  const [flashIndex, setFlashIndex] = useState(null)
  const [alert, setAlert] = useState(null)
  const failTimerRef = useRef(null)

  const hasShield = hasLogicShield()

  useEffect(() => () => {
    if (failTimerRef.current) clearTimeout(failTimerRef.current)
  }, [])

  const title = useMemo(() => {
    if (isPractice) return '自由练习'
    if (isStreak) return `连闯 ${streakRound}/${STREAK_TOTAL}`
    return '挑战一局'
  }, [isPractice, isStreak, streakRound])

  const resetSession = useCallback(
    (nextRound = 1) => {
      const next = createSession(grade, isPractice ? 'practice' : 'challenge')
      setSession(next)
      setGrid([...next.puzzle])
      setSelectedIndex(null)
      setWrongIndices([])
      setMistakes(0)
      setShieldUsed(false)
      setShowConflicts(false)
      setPhase('playing')
      setStreakRound(nextRound)
      setHostLine(isStreak ? SUDOKU_GUARDIAN.streakIntro : SUDOKU_GUARDIAN.intro)
      setFlashIndex(null)
      setAlert(null)
      if (failTimerRef.current) {
        clearTimeout(failTimerRef.current)
        failTimerRef.current = null
      }
    },
    [grade, isPractice, isStreak],
  )

  function failGame(message) {
    setPhase('done')
    setWon(false)
    setHostLine(message || (isStreak ? SUDOKU_GUARDIAN.streakLose : SUDOKU_GUARDIAN.lose))
  }

  function winGame() {
    if (isPractice) {
      setPhase('done')
      setWon(true)
      setHostLine(SUDOKU_GUARDIAN.win)
      return
    }

    if (isStreak) {
      if (streakRound >= STREAK_TOTAL) {
        recordSudokuStreakWin()
        if (isDaily) markDailyBrainComplete(todayKey())
        setPhase('done')
        setWon(true)
        setHostLine(SUDOKU_GUARDIAN.streakWin)
        return
      }
      setHostLine(`第 ${streakRound} 局完成！下一局～`)
      setTimeout(() => resetSession(streakRound + 1), 700)
      return
    }

    recordSudokuChallengeWin()
    if (isDaily) markDailyBrainComplete(todayKey())
    setPhase('done')
    setWon(true)
    setHostLine(SUDOKU_GUARDIAN.win)
  }

  function triggerWrongFlash(index) {
    setFlashIndex(index)
    window.setTimeout(() => setFlashIndex(null), 900)
  }

  function showAlert(payload) {
    setAlert(payload)
    window.setTimeout(() => setAlert(null), 1000)
  }

  function handleWrongCell(index, answer) {
    const row = Math.floor(index / size)
    const col = index % size
    triggerWrongFlash(index)
    setWrongIndices((prev) => [...new Set([...prev, index])])

    if (hasShield && !shieldUsed) {
      setShieldUsed(true)
      setHostLine('逻辑护盾挡住了这次失误！')
      showAlert({
        type: 'shield',
        title: '🛡️ 逻辑护盾生效',
        message: `第 ${row + 1} 行第 ${col + 1} 列应为 ${answer}`,
        sub: `这次不计失误 · 还剩 ${MAX_MISTAKES} 次机会`,
      })
      return
    }

    const nextMistakes = mistakes + 1
    setMistakes(nextMistakes)
    setHostLine(SUDOKU_GUARDIAN.wrong)
    recordSudokuWrongCell({ size, row, col, answer })

    const remaining = MAX_MISTAKES - nextMistakes
    const isLast = nextMistakes >= MAX_MISTAKES

    showAlert({
      type: isLast ? 'critical' : 'wrong',
      title: isLast ? '❌ 失误已满 3 次' : `❌ 填错了 · 失误 ${nextMistakes}/${MAX_MISTAKES}`,
      message: `第 ${row + 1} 行第 ${col + 1} 列应为 ${answer}`,
      sub: isLast ? '本局即将结束…' : `还可错 ${remaining} 次 · 点「清除」可改`,
    })

    if (isLast) {
      failTimerRef.current = window.setTimeout(() => {
        setAlert(null)
        failGame('失误满 3 次，本局结束')
      }, 1000)
    }
  }

  function handleDigit(digit) {
    if (phase !== 'playing' || selectedIndex == null || session.fixedMask[selectedIndex]) return

    const nextGrid = [...grid]
    nextGrid[selectedIndex] = digit
    setGrid(nextGrid)

    if (isChallenge && isCellWrong(nextGrid, session.solution, selectedIndex)) {
      handleWrongCell(selectedIndex, session.solution[selectedIndex])
      return
    }

    if (isPuzzleComplete(nextGrid, session.solution)) {
      winGame()
    }
  }

  function handleErase() {
    if (phase !== 'playing' || selectedIndex == null || session.fixedMask[selectedIndex]) return
    const nextGrid = [...grid]
    nextGrid[selectedIndex] = 0
    setGrid(nextGrid)
    setWrongIndices((prev) => prev.filter((i) => i !== selectedIndex))
  }

  function handleHint() {
    if (!isPractice || phase !== 'playing') return
    const idx = findHintCell(grid, session.solution, session.fixedMask)
    if (idx == null) return
    const nextGrid = [...grid]
    nextGrid[idx] = session.solution[idx]
    setGrid(nextGrid)
    setSelectedIndex(idx)
    if (isPuzzleComplete(nextGrid, session.solution)) winGame()
  }

  function handleCheck() {
    if (!isPractice) return
    setShowConflicts(true)
    setHostLine('红色格子有冲突，检查一下～')
  }

  return (
    <div className="sudoku-play">
      <header className="sudoku-hub__header">
        <MathBackButton to={`/math/sudoku${isDaily ? '?daily=1' : ''}`} className="sudoku-hub__back">
          ← 简单数独
        </MathBackButton>
        <div>
          <h2>{title}</h2>
          <p>{getSudokuSizeLabel(size)} · {grade} 年级</p>
        </div>
      </header>

      <section className="sudoku-hub__host sudoku-hub__host--compact">
        <span className="sudoku-hub__host-avatar">{SUDOKU_GUARDIAN.avatar}</span>
        <p>{hostLine}</p>
      </section>

      {phase === 'playing' && (
        <>
          {isChallenge && (
            <div className={`sudoku-play__hud${mistakes > 0 ? ' sudoku-play__hud--warn' : ''}`}>
              <div className="sudoku-play__hud-main">
                <span>失误机会</span>
                <div className="sudoku-play__mistake-dots" aria-label={`失误 ${mistakes}/${MAX_MISTAKES}`}>
                  {[...Array(MAX_MISTAKES)].map((_, i) => (
                    <span
                      key={i}
                      className={[
                        'sudoku-play__mistake-dot',
                        i < mistakes && 'sudoku-play__mistake-dot--used',
                        i === mistakes - 1 && flashIndex != null && 'sudoku-play__mistake-dot--pulse',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  ))}
                </div>
                <strong>{mistakes}/{MAX_MISTAKES}</strong>
              </div>
              {hasShield && (
                <span className={shieldUsed ? 'sudoku-play__shield sudoku-play__shield--used' : 'sudoku-play__shield'}>
                  {shieldUsed ? '护盾已用' : '🛡️ 护盾可用'}
                </span>
              )}
            </div>
          )}

          <div className="sudoku-play__board-wrap">
            {alert && (
              <div className="sudoku-play__overlay" role="alert" aria-live="assertive">
                <div className={`sudoku-play__toast sudoku-play__toast--${alert.type}`}>
                  <strong>{alert.title}</strong>
                  <span>{alert.message}</span>
                  {alert.sub && <em>{alert.sub}</em>}
                </div>
              </div>
            )}
            <SudokuGrid
              size={size}
              grid={grid}
              fixedMask={session.fixedMask}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              wrongIndices={wrongIndices}
              flashIndex={flashIndex}
              showConflicts={showConflicts}
            />
          </div>

          <div className="sudoku-play__pad">
            {[...Array(size)].map((_, i) => (
              <button key={i + 1} type="button" onClick={() => handleDigit(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button type="button" className="sudoku-play__erase" onClick={handleErase}>
              清除
            </button>
          </div>

          {isPractice && (
            <div className="sudoku-play__tools">
              <button type="button" className="sudoku-card__btn sudoku-card__btn--soft" onClick={handleHint}>
                提示一格
              </button>
              <button type="button" className="sudoku-card__btn sudoku-card__btn--soft" onClick={handleCheck}>
                检查冲突
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'done' && (
        <div className="sudoku-play__result">
          <h3>{won ? '完成！' : '本局结束'}</h3>
          <p>{hostLine}</p>
          {won && isChallenge && !isStreak && <p className="sudoku-play__reward">挑战成功 · +1 星</p>}
          {won && isStreak && <p className="sudoku-play__reward">连闯成功 · 逻辑护盾 · +2 星 · 点亮数独岛</p>}
          <div className="sudoku-play__result-actions">
            <button type="button" className="sudoku-card__btn sudoku-card__btn--soft" onClick={() => resetSession(1)}>
              再来一局
            </button>
            <button
              type="button"
              className="sudoku-card__btn"
              onClick={() => navigate(`/math/sudoku${isDaily ? '?daily=1' : ''}`)}
            >
              返回
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
