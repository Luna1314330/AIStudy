import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getDailyBrainEntry,
  getProjectById,
  MATH_PROJECTS,
} from '@/data/mathBrainMap'
import {
  getDueWrongQuestions,
  getMathGrade,
  getMathStars,
  hasSuperpower,
  isDailyBrainDone,
  isMathProjectUnlocked,
  isProjectLit,
  setMathGrade,
} from '@/utils/mathStorage'
import './MathHome.css'

const IMPLEMENTED_IDS = new Set(['speed', 'twentyfour', 'sudoku', 'mixed', 'spatial'])

const CARD_TILTS = [-2, 1.5, -1.5, 2, -2, 1.5, -1]

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export default function MathHome() {
  const navigate = useNavigate()
  const [grade, setGrade] = useState(() => getMathGrade())
  const [activeId, setActiveId] = useState('speed')
  const [, bump] = useState(0)

  const daily = useMemo(() => getDailyBrainEntry(), [])
  const stars = getMathStars()
  const dueWrong = getDueWrongQuestions().length
  const dailyDone = isDailyBrainDone(todayKey())
  const activeProject = getProjectById(activeId) ?? MATH_PROJECTS[0]
  const activeLit = isProjectLit(activeId)
  const sortedProjects = useMemo(
    () => [...MATH_PROJECTS].sort((a, b) => a.order - b.order),
    [],
  )

  function refresh() {
    bump((n) => n + 1)
  }

  function handleGradeChange(event) {
    const next = Number(event.target.value)
    setGrade(next)
    setMathGrade(next)
    refresh()
  }

  function handleCardClick(projectId) {
    setActiveId(projectId)
    const unlocked = isMathProjectUnlocked(projectId)
    if (!unlocked) return
    const project = getProjectById(projectId)
    if (project?.path) {
      navigate(project.path)
    }
  }

  function handleDailyBrain() {
    if (daily.type === 'speed') {
      navigate('/math/speed?daily=1')
    }
    if (daily.type === 'sudoku') {
      navigate('/math/sudoku?daily=1')
    }
    if (daily.type === 'twentyfour') {
      navigate('/math/twentyfour?daily=1')
    }
    if (daily.type === 'mixed') {
      navigate('/math/mixed?daily=1')
    }
    if (daily.type === 'spatial') {
      navigate('/math/spatial?daily=1')
    }
  }

  const superpowerName = activeProject?.superpowerLabel
  const hasPower = activeProject?.superpowerId
    ? hasSuperpower(activeProject.superpowerId)
    : false

  return (
    <div className="math-home">
      <header className="math-home__header">
        <div>
          <h2 className="math-home__title">数学最强大脑</h2>
          <p className="math-home__desc">脑力地图 · 练习与挑战</p>
        </div>
        <div className="math-home__meta">
          <label className="math-home__grade">
            <span>年级</span>
            <select value={grade} onChange={handleGradeChange}>
              <option value={4}>四年级</option>
              <option value={5}>五年级</option>
              <option value={6}>六年级</option>
            </select>
          </label>
          <div className="math-home__stars" aria-label={`数学星星 ${stars} 颗`}>
            <span className="math-home__stars-icon">⭐</span>
            <strong>{stars}</strong>
            <span>颗</span>
          </div>
        </div>
      </header>

      <div className={`math-home__daily${dailyDone ? ' math-home__daily--done' : ''}`}>
        <div>
          <p className="math-home__daily-label">今日最强大脑 · {daily.label}</p>
          <strong>{daily.title}</strong>
          {dailyDone && <span className="math-home__daily-badge">已完成</span>}
        </div>
        <button
          type="button"
          className="math-home__daily-btn"
          onClick={handleDailyBrain}
          disabled={!['speed', 'twentyfour', 'sudoku', 'mixed', 'spatial'].includes(daily.type)}
        >
          {['speed', 'twentyfour', 'sudoku', 'mixed', 'spatial'].includes(daily.type) ? '去挑战' : '即将开放'}
        </button>
      </div>

      {activeProject && (
        <div className="math-home__active">
          <div className="math-home__active-col">
            <span className="math-home__active-label">当前项目</span>
            <strong>
              {activeProject.icon} {activeProject.name}
            </strong>
            {activeLit && <span className="math-home__active-lit">已点亮</span>}
          </div>
          {superpowerName && (
            <div className="math-home__active-col">
              <p className="math-home__active-reward">
                {hasPower ? (
                  <>
                    「<span className="math-home__active-power">{superpowerName}</span>」已永久获得
                    <br />
                    <span className="math-home__active-owned">点亮后可随时回来练习与挑战</span>
                  </>
                ) : (
                  <>
                    守擂攻擂成功可获得
                    <br />
                    <span className="math-home__active-power">「{superpowerName}」</span>
                    超能力（仅首次）
                  </>
                )}
              </p>
            </div>
          )}
          {activeProject.isBoss && (
            <div className="math-home__active-col">
              <p className="math-home__active-reward math-home__active-reward--locked">
                需先点亮：
                {(activeProject.requiresProjects ?? [])
                  .map((id) => getProjectById(id)?.name)
                  .filter(Boolean)
                  .join('、')}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="math-home__deck-wrap">
        <p className="math-home__deck-label">脑力项目 · 点击已开放项目进入</p>
        <div className="math-deck" role="list" aria-label="数学脑力项目">
          {sortedProjects.map((project, index) => {
            const isActive = project.id === activeId
            const unlocked = isMathProjectUnlocked(project.id)
            const lit = isProjectLit(project.id)
            const ready = IMPLEMENTED_IDS.has(project.id)

            return (
              <button
                key={project.id}
                type="button"
                role="listitem"
                className={[
                  'math-card',
                  isActive && 'math-card--active',
                  !unlocked && 'math-card--locked',
                  lit && 'math-card--lit',
                  project.isBoss && 'math-card--boss',
                  unlocked && 'math-card--playable',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ '--card-tilt': `${CARD_TILTS[index % CARD_TILTS.length]}deg` }}
                onClick={() => handleCardClick(project.id)}
                aria-label={`${project.name}${lit ? '（已点亮）' : ''}${!unlocked ? '（未解锁）' : ''}`}
                aria-pressed={isActive}
              >
                <span className="math-card__corner math-card__corner--tl">{project.order}</span>
                <span className="math-card__corner math-card__corner--br">{project.icon}</span>

                {!unlocked && <span className="math-card__lock">🔒</span>}
                {lit && <span className="math-card__star">★</span>}
                {!ready && unlocked && <span className="math-card__tag math-card__tag--soon">开发中</span>}

                <span className="math-card__icon">{project.icon}</span>
                <span className="math-card__name">{project.name}</span>

                {project.superpowerLabel && !project.isBoss && (
                  <span className="math-card__power">「{project.superpowerLabel}」</span>
                )}
                {project.isBoss && <span className="math-card__tag">Boss 关</span>}
                {unlocked && <span className="math-card__enter">{ready ? '点击进入' : '查看详情'}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <footer className="math-home__footer">
        <p className="math-home__tip">
          全部项目已解锁 ·「速算擂台」「24 点实验室」「简单数独」「四则混合」「空间挑战」可完整游玩
        </p>
        <Link to="/math/wrong" className="math-home__wrong-link">
          数学错题本
          {dueWrong > 0 && <span className="math-home__wrong-badge">{dueWrong} 待复习</span>}
        </Link>
      </footer>
    </div>
  )
}
