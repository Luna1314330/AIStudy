import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { SPEED_CHAMPION } from '@/data/mathBrainMap'
import {
  getMathGrade,
  getMathStars,
  getSuperpowerBonusSeconds,
  hasSuperpower,
  isProjectLit,
  loadMathProgress,
} from '@/utils/mathStorage'
import '../SpeedArena.css'

export default function SpeedArenaHome() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isDaily = params.get('daily') === '1'
  const grade = getMathGrade()
  const stars = getMathStars()
  const progress = loadMathProgress()
  const lit = isProjectLit('speed')
  const bonusSec = getSuperpowerBonusSeconds()
  const hasSense = hasSuperpower('speed-sense')
  const bestStreak = progress.projects?.speed?.blitzBestStreak ?? 0
  const defendWins = progress.projects?.speed?.defendWins ?? 0

  function goBlitz(mode) {
    navigate(`/math/speed/blitz?mode=${mode}${isDaily ? '&daily=1' : ''}`)
  }

  function goDefend(mode) {
    navigate(`/math/speed/defend?mode=${mode}${isDaily ? '&daily=1' : ''}`)
  }

  return (
    <div className="speed-arena">
      <header className="speed-arena__header">
        <MathBackButton to="/math" className="speed-arena__back">
          ← 脑力地图
        </MathBackButton>
        <div className="speed-arena__title-wrap">
          <h2>⚡ 速算擂台</h2>
          <p>
            {grade} 年级题库 · 数学星星 {stars} 颗
            {isDaily && <span className="speed-arena__daily-tag">今日最强大脑</span>}
          </p>
        </div>
        <Link to="/math/wrong" className="speed-arena__wrong">
          错题本
        </Link>
      </header>

      <section className="speed-arena__host">
        <span className="speed-arena__host-avatar">{SPEED_CHAMPION.avatar}</span>
        <div>
          <strong>{SPEED_CHAMPION.name}</strong>
          <p>{SPEED_CHAMPION.intro}</p>
        </div>
      </section>

      {hasSense && (
        <p className="speed-arena__bonus">超能力「速算感应」已激活：60 秒挑战 +{bonusSec} 秒</p>
      )}

      {lit && (
        <p className="speed-arena__open">
          擂台已点亮 · 练习与挑战永久开放，随时来刷题、刷星、刷连对记录
        </p>
      )}

      <div className="speed-arena__stats">
        <div>
          <span>60 秒最高连对</span>
          <strong>{bestStreak}</strong>
        </div>
        <div>
          <span>守擂成功</span>
          <strong>{defendWins} 次</strong>
        </div>
        <div>
          <span>擂台状态</span>
          <strong>{lit ? '已点亮 ★' : '攻擂中'}</strong>
        </div>
      </div>

      <section className="speed-arena__modes">
        <article className="speed-card">
          <h3>60 秒挑战</h3>
          <p>
            一屏一题，连对 streak；挑战模式正确率 ≥80% 得 1 星
            {lit ? ' · 可反复挑战' : ''}
          </p>
          <div className="speed-card__actions">
            <button type="button" className="speed-card__btn speed-card__btn--soft" onClick={() => goBlitz('practice')}>
              练习
            </button>
            <button type="button" className="speed-card__btn" onClick={() => goBlitz('challenge')}>
              挑战
            </button>
          </div>
        </article>

        <article className="speed-card speed-card--defend">
          <h3>守擂 5 题</h3>
          <p>
            {lit
              ? '已获「速算感应」· 攻擂练习永久开放，全对仍可 +2 星'
              : '闪电小算连出 5 题全对 · 首次攻擂成功点亮擂台 + 速算感应 + 2 星'}
          </p>
          <div className="speed-card__actions">
            <button type="button" className="speed-card__btn speed-card__btn--soft" onClick={() => goDefend('practice')}>
              练习
            </button>
            <button type="button" className="speed-card__btn speed-card__btn--gold" onClick={() => goDefend('challenge')}>
              攻擂
            </button>
          </div>
        </article>
      </section>

      <p className="speed-arena__hint">
        挑战模式错题自动进错题本；点「我不确定」不会收录。约 20% 估算题。
      </p>
    </div>
  )
}
