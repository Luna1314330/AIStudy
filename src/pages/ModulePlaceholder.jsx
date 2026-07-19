import { Link } from 'react-router-dom'
import './Placeholder.css'

export default function ModulePlaceholder({ title, placeholder, module }) {
  const icons = { vocab: '📝', reading: '📚' }

  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <span className="placeholder-card__icon">{icons[module] || '🚧'}</span>
        <h2>{title}</h2>
        <p>{placeholder}</p>
        <Link to="/chinese/writing" className="placeholder-card__link">
          ← 返回写作引导
        </Link>
      </div>
    </div>
  )
}
