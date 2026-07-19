import { Link } from 'react-router-dom'
import './Placeholder.css'

export default function SubjectPlaceholder({ icon, title, description }) {
  return (
    <div className="subject-placeholder">
      <div className="subject-placeholder__card">
        <span className="subject-placeholder__icon">{icon}</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <Link to="/chinese/writing" className="subject-placeholder__cta">
          先去体验语文 · 写作引导 →
        </Link>
      </div>
    </div>
  )
}
