import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import MathBackButton from '../components/MathBackButton'
import { SPATIAL_GUIDE } from '@/data/mathBrainMap'
import {
  getMathGrade,
  getMathStars,
  hasSpaceIntuition,
  isProjectLit,
  loadMathProgress,
} from '@/utils/mathStorage'
import '../Spatial.css'

export default function SpatialHome() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isDaily = params.get('daily') === '1'
  const grade = getMathGrade()
  const stars = getMathStars()
  const progress = loadMathProgress()
  const lit = isProjectLit('spatial')
  const hasIntuition = hasSpaceIntuition()
  const challengeWins = progress.projects?.spatial?.challengeWins ?? 0
  const streakWins = progress.projects?.spatial?.streakWins ?? 0
  const bestAccuracy = progress.projects?.spatial?.bestAccuracy ?? 0

  function goPlay(mode) {
    navigate(`/math/spatial/play?mode=${mode}${isDaily ? '&daily=1' : ''}`)
  }

  return (
    <div className="spatial-hub">
      <header className="spatial-hub__header">
        <MathBackButton to="/math" className="spatial-hub__back">
          ← 脑力地图
        </MathBackButton>
        <div>
          <h2>🧊 空间挑战</h2>
          <p>
            {grade} 年级 · 旋转与立体 · 数学星星 {stars} 颗
            {isDaily && <span className="spatial-hub__daily-tag">今日最强大脑</span>}
          </p>
        </div>
        <Link to="/math/wrong" className="spatial-hub__wrong">
          错题本
        </Link>
      </header>

      <section className="spatial-hub__host">
        <span className="spatial-hub__host-avatar">{SPATIAL_GUIDE.avatar}</span>
        <div>
          <strong>{SPATIAL_GUIDE.name}</strong>
          <p>{SPATIAL_GUIDE.intro}</p>
        </div>
      </section>

      {hasIntuition && (
        <p className="spatial-hub__bonus">超能力「空间直觉」已激活：每局可额外预览 1 次旋转效果</p>
      )}

      <div className="spatial-hub__stats">
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

      <section className="spatial-hub__modes">
        <article className="spatial-card">
          <h3>自由练习</h3>
          <p>8 题一组，旋转、镜像、数方块与俯视图</p>
          <button type="button" className="spatial-card__btn spatial-card__btn--soft" onClick={() => goPlay('practice')}>
            开始练习
          </button>
        </article>

        <article className="spatial-card">
          <h3>挑战一组</h3>
          <p>8 题 · 正确率 ≥80% 通关 · 挑战成功 +1 星</p>
          <button type="button" className="spatial-card__btn" onClick={() => goPlay('challenge')}>
            开始挑战
          </button>
        </article>

        <article className="spatial-card spatial-card--streak">
          <h3>连闯 3 题</h3>
          <p>连续 3 题全对 · 点亮空间挑战 + 空间直觉 + 2 星</p>
          <button type="button" className="spatial-card__btn spatial-card__btn--gold" onClick={() => goPlay('streak')}>
            开始连闯
          </button>
        </article>
      </section>

      <p className="spatial-hub__hint">四年级侧重旋转与数方块 · 五六年增加镜像与俯视图 · 挑战错题进错题本</p>
    </div>
  )
}
