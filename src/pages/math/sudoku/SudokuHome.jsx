import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { SUDOKU_GUARDIAN } from '@/data/mathBrainMap'
import {
  getMathGrade,
  getMathStars,
  hasLogicShield,
  isProjectLit,
  loadMathProgress,
} from '@/utils/mathStorage'
import { getSudokuSizeForGrade, getSudokuSizeLabel } from '@/utils/sudokuEngine'
import '../Sudoku.css'

export default function SudokuHome() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isDaily = params.get('daily') === '1'
  const grade = getMathGrade()
  const size = getSudokuSizeForGrade(grade)
  const stars = getMathStars()
  const progress = loadMathProgress()
  const lit = isProjectLit('sudoku')
  const hasShield = hasLogicShield()
  const challengeWins = progress.projects?.sudoku?.challengeWins ?? 0
  const streakWins = progress.projects?.sudoku?.streakWins ?? 0

  function goPlay(mode) {
    navigate(`/math/sudoku/play?mode=${mode}${isDaily ? '&daily=1' : ''}`)
  }

  return (
    <div className="sudoku-hub">
      <header className="sudoku-hub__header">
        <MathBackButton to="/math" className="sudoku-hub__back">
          ← 脑力地图
        </MathBackButton>
        <div>
          <h2>🔢 简单数独</h2>
          <p>
            {grade} 年级 · {getSudokuSizeLabel(size)} · 数学星星 {stars} 颗
            {isDaily && <span className="sudoku-hub__daily-tag">今日最强大脑</span>}
          </p>
        </div>
        <Link to="/math/wrong" className="sudoku-hub__wrong">
          错题本
        </Link>
      </header>

      <section className="sudoku-hub__host">
        <span className="sudoku-hub__host-avatar">{SUDOKU_GUARDIAN.avatar}</span>
        <div>
          <strong>{SUDOKU_GUARDIAN.name}</strong>
          <p>{SUDOKU_GUARDIAN.intro}</p>
        </div>
      </section>

      {hasShield && (
        <p className="sudoku-hub__bonus">超能力「逻辑护盾」已激活：每局挑战可容错 1 次</p>
      )}

      <div className="sudoku-hub__stats">
        <div>
          <span>挑战通关</span>
          <strong>{challengeWins} 局</strong>
        </div>
        <div>
          <span>连闯成功</span>
          <strong>{streakWins} 次</strong>
        </div>
        <div>
          <span>项目状态</span>
          <strong>{lit ? '已点亮 ★' : '进行中'}</strong>
        </div>
      </div>

      <section className="sudoku-hub__modes">
        <article className="sudoku-card">
          <h3>自由练习</h3>
          <p>提示与检查可用，熟悉 {getSudokuSizeLabel(size)} 规则</p>
          <button type="button" className="sudoku-card__btn sudoku-card__btn--soft" onClick={() => goPlay('practice')}>
            开始练习
          </button>
        </article>

        <article className="sudoku-card">
          <h3>挑战一局</h3>
          <p>最多错 3 格，填完即通关 · 挑战成功 +1 星</p>
          <button type="button" className="sudoku-card__btn" onClick={() => goPlay('challenge')}>
            开始挑战
          </button>
        </article>

        <article className="sudoku-card sudoku-card--streak">
          <h3>连闯 3 局</h3>
          <p>连续完成 3 局挑战 · 点亮数独岛 + 逻辑护盾 + 2 星</p>
          <button type="button" className="sudoku-card__btn sudoku-card__btn--gold" onClick={() => goPlay('streak')}>
            开始连闯
          </button>
        </article>
      </section>

      <p className="sudoku-hub__hint">四年级 4×4 · 五年级 6×6 · 六年级 9×9 · 挑战错题进错题本</p>
    </div>
  )
}
