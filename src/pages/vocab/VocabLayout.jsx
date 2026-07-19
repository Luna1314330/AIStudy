import { NavLink, Outlet, useLocation } from 'react-router-dom'
import './VocabLayout.css'

const TABS = [
  { label: '开始听写', path: '/chinese/vocab' },
  { label: '错词本', path: '/chinese/vocab/wrong' },
  { label: '词库管理', path: '/chinese/vocab/books' },
]

export default function VocabLayout() {
  const location = useLocation()
  const hideTabs =
    location.pathname.includes('/dictation') || location.pathname.includes('/result')

  return (
    <div className="vocab-layout">
      {!hideTabs && (
        <nav className="vocab-tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/chinese/vocab'}
              className={({ isActive }) =>
                `vocab-tabs__item${isActive ? ' vocab-tabs__item--active' : ''}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
      <div className="vocab-layout__content">
        <Outlet />
      </div>
    </div>
  )
}
