import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { TWENTYFOUR_DEALER } from '@/data/mathBrainMap'
import {
  getMathGrade,
  getMathStars,
  hasCalcVision,
  isProjectLit,
  loadMathProgress,
} from '@/utils/mathStorage'
import '../TwentyFour.css'

export default function TwentyFourHome() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isDaily = params.get('daily') === '1'
  const grade = getMathGrade()
  const stars = getMathStars()
  const progress = loadMathProgress()
  const lit = isProjectLit('twentyfour')
  const hasVision = hasCalcVision()
  const challengeWins = progress.projects?.twentyfour?.challengeWins ?? 0
  const streakWins = progress.projects?.twentyfour?.streakWins ?? 0

  function goPlay(mode) {
    navigate(`/math/twentyfour/play?mode=${mode}${isDaily ? '&daily=1' : ''}`)
  }

  return (
    <div className="tf-hub">
      <header className="tf-hub__header">
        <MathBackButton to="/math" className="tf-hub__back">
          ← 脑力地图
        </MathBackButton>
        <div>
          <h2>🃏 24 点实验室</h2>
          <p>
            {grade} 年级牌面 · 数学星星 {stars} 颗
            {isDaily && <span className="tf-hub__daily-tag">今日最强大脑</span>}
          </p>
        </div>
        <Link to="/math/wrong" className="tf-hub__wrong">
          错题本
        </Link>
      </header>

      <section className="tf-hub__host">
        <span className="tf-hub__host-avatar">{TWENTYFOUR_DEALER.avatar}</span>
        <div>
          <strong>{TWENTYFOUR_DEALER.name}</strong>
          <p>{TWENTYFOUR_DEALER.intro}</p>
        </div>
      </section>

      {hasVision && (
        <p className="tf-hub__bonus">超能力「运算透视」已激活：挑战/连闯每局可查看 2 次提示（普通为 1 次）</p>
      )}

      {lit && (
        <p className="tf-hub__open">实验室已点亮 · 练习与挑战永久开放</p>
      )}

      <div className="tf-hub__stats">
        <div>
          <span>挑战通关</span>
          <strong>{challengeWins} 题</strong>
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

      <section className="tf-hub__modes">
        <article className="tf-card">
          <h3>自由练习</h3>
          <p>点选两张牌 + 运算符合并，提示不限次数，可撤销</p>
          <button type="button" className="tf-card__btn tf-card__btn--soft" onClick={() => goPlay('practice')}>
            开始练习
          </button>
        </article>

        <article className="tf-card">
          <h3>挑战一题</h3>
          <p>算出 24 · 每局 1 次提示 · 最多错 3 次 · 成功 +1 星</p>
          <button type="button" className="tf-card__btn" onClick={() => goPlay('challenge')}>
            开始挑战
          </button>
        </article>

        <article className="tf-card tf-card--streak">
          <h3>连闯 5 题</h3>
          <p>
            {lit
              ? '已获「运算透视」· 连闯仍可 +2 星'
              : '连续 5 题挑战成功 · 点亮实验室 + 运算透视 + 2 星'}
          </p>
          <button type="button" className="tf-card__btn tf-card__btn--gold" onClick={() => goPlay('streak')}>
            开始连闯
          </button>
        </article>
      </section>

      <p className="tf-hub__hint">每张牌只能用一次 · 点击：选牌 → 选运算 → 再选牌</p>
    </div>
  )
}
