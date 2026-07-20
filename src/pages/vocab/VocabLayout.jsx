import { Outlet, useLocation } from 'react-router-dom'
import AppNavButton from '@/components/AppNavButton'
import './VocabLayout.css'

const TABS = [
  { label: '开始听写', path: '/chinese/vocab' },
  { label: '错词本', path: '/chinese/vocab/wrong' },
  { label: '词库管理', path: '/chinese/vocab/books' },
]

function isVocabTabActive(tabPath, pathname) {
  if (tabPath === '/chinese/vocab') {
    return pathname === '/chinese/vocab'
  }
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`)
}

export default function VocabLayout() {
  const location = useLocation()
  const hideTabs =
    location.pathname.includes('/dictation') || location.pathname.includes('/result')

  return (
    <div className="vocab-layout">
      {!hideTabs && (
        <nav className="vocab-tabs">
          {TABS.map((tab) => {
            const isActive = isVocabTabActive(tab.path, location.pathname)

            return (
              <AppNavButton
                key={tab.path}
                to={tab.path}
                className={`vocab-tabs__item${isActive ? ' vocab-tabs__item--active' : ''}`}
              >
                {tab.label}
              </AppNavButton>
            )
          })}
        </nav>
      )}
      <div className="vocab-layout__content">
        <Outlet />
      </div>
    </div>
  )
}
