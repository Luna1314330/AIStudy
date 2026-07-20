import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { MIXED_MENTOR } from '@/data/mathBrainMap'
import {
  getMathGrade,
  getMathStars,
  hasCalcVision,
  isProjectLit,
  loadMathProgress,
} from '@/utils/mathStorage'
import '../Mixed.css'

export default function MixedHome() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isDaily = params.get('daily') === '1'
  const grade = getMathGrade()
  const stars = getMathStars()
  const progress = loadMathProgress()
  const lit = isProjectLit('mixed')
  const hasVision = hasCalcVision()
  const challengeWins = progress.projects?.mixed?.challengeWins ?? 0
  const streakWins = progress.projects?.mixed?.streakWins ?? 0
  const bestAccuracy = progress.projects?.mixed?.bestAccuracy ?? 0

  function goPlay(mode) {
    navigate(`/math/mixed/play?mode=${mode}${isDaily ? '&daily=1' : ''}`)
  }

  return (
    <div className="mixed-hub">
      <header className="mixed-hub__header">
        <MathBackButton to="/math" className="mixed-hub__back">
          ← 脑力地图
        </MathBackButton>
        <div>
          <h2>🧮 四则混合</h2>
          <p>
            {grade} 年级 · 混合运算 · 数学星星 {stars} 颗
            {isDaily && <span className="mixed-hub__daily-tag">今日最强大脑</span>}
          </p>
        </div>
        <Link to="/math/wrong" className="mixed-hub__wrong">
          错题本
        </Link>
      </header>

      <section className="mixed-hub__host">
        <span className="mixed-hub__host-avatar">{MIXED_MENTOR.avatar}</span>
        <div>
          <strong>{MIXED_MENTOR.name}</strong>
          <p>{MIXED_MENTOR.intro}</p>
        </div>
      </section>

      {hasVision && (
        <p className="mixed-hub__bonus">超能力「运算透视」已激活：每局可查看 1 次运算顺序提示</p>
      )}

      <div className="mixed-hub__stats">
        <div>
          <span>挑战通关</span>
          <strong>{challengeWins} 次</strong>
        </div>
        <div>
          <span>连闯成功</span>
          <strong>{streakWins} 次</strong>
        </div>
        <div>
          <span>最高正确率</span>
          <strong>{bestAccuracy ? `${Math.round(bestAccuracy * 100)}%` : '—'}</strong>
        </div>
        <div>
          <span>项目状态</span>
          <strong>{lit ? '已点亮 ★' : '进行中'}</strong>
        </div>
      </div>

      <section className="mixed-hub__modes">
        <article className="mixed-card">
          <h3>自由练习</h3>
          <p>10 题一组，即时反馈，熟悉乘除优先与括号规则</p>
          <button type="button" className="mixed-card__btn mixed-card__btn--soft" onClick={() => goPlay('practice')}>
            开始练习
          </button>
        </article>

        <article className="mixed-card">
          <h3>挑战一组</h3>
          <p>10 题 · 正确率 ≥80% 通关 · 挑战成功 +1 星</p>
          <button type="button" className="mixed-card__btn" onClick={() => goPlay('challenge')}>
            开始挑战
          </button>
        </article>

        <article className="mixed-card mixed-card--streak">
          <h3>连闯 5 题</h3>
          <p>连续 5 题全对 · 点亮四则混合 + 运算透视 + 2 星</p>
          <button type="button" className="mixed-card__btn mixed-card__btn--gold" onClick={() => goPlay('streak')}>
            开始连闯
          </button>
        </article>
      </section>

      <p className="mixed-hub__hint">含加减乘除混合、括号与运算顺序 · 挑战错题进错题本</p>
    </div>
  )
}
