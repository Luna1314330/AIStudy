import MathBackButton from './components/MathBackButton'
import { getProjectById, MATH_SUPER_POWERS } from '@/data/mathBrainMap'
import '../Placeholder.css'

export default function MathProjectPlaceholder({ projectId }) {
  const project = getProjectById(projectId)
  const power = project?.superpowerId ? MATH_SUPER_POWERS[project.superpowerId] : null

  if (!project) {
    return (
      <div className="subject-placeholder">
        <div className="subject-placeholder__card">
          <p>项目不存在</p>
          <MathBackButton to="/math" className="subject-placeholder__cta">
            ← 返回脑力地图
          </MathBackButton>
        </div>
      </div>
    )
  }

  return (
    <div className="subject-placeholder">
      <div className="subject-placeholder__card">
        <span className="subject-placeholder__icon">{project.icon}</span>
        <h2>{project.name}</h2>
        <p>
          {project.isBoss
            ? `Boss 关开发中。需先点亮：${(project.requiresProjects ?? [])
                .map((id) => getProjectById(id)?.name)
                .filter(Boolean)
                .join('、')}`
            : `${project.name}正在开发中，很快就来！`}
        </p>
        {power && (
          <p style={{ marginTop: 8, color: '#475569', fontSize: 14 }}>
            点亮后可获「{power.name}」：{power.description}
          </p>
        )}
        <MathBackButton to="/math" className="subject-placeholder__cta">
          ← 返回脑力地图
        </MathBackButton>
      </div>
    </div>
  )
}
