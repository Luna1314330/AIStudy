import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNavButton from '@/components/AppNavButton'
import { SUBJECT_NAV, CHINESE_MODULES } from '@/router'
import './Layout.css'

function isSubjectNavActive(key, pathname) {
  if (key === 'chinese') return pathname.startsWith('/chinese')
  return pathname.startsWith(`/${key}`)
}

function isChineseModuleActive(path, pathname) {
  if (path === '/chinese/vocab') {
    return pathname === path || pathname.startsWith(`${path}/`)
  }
  return pathname === path
}

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentSubject = location.pathname.startsWith('/chinese')
    ? 'chinese'
    : location.pathname.split('/')[1] || ''

  const showSidebar = currentSubject === 'chinese'

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const titles = {
      writing: '写作引导',
      vocab: '生词听写',
      reading: '阅读理解',
      math: '数学',
      english: '英语',
      science: '科学',
    }
    const key = location.pathname.split('/').pop()
    const title = titles[key] || '学习小助手'
    document.title = `${title} · 学习小助手`
  }, [location.pathname])

  return (
    <div className="layout">
      <header className="header">
        <div className="header__brand">
          <span className="header__logo">📚</span>
          <h1 className="header__title">学习小助手</h1>
        </div>

        <nav className="header__nav">
          {SUBJECT_NAV.map((item) => {
            const isActive = isSubjectNavActive(item.key, location.pathname)

            return (
              <AppNavButton
                key={item.key}
                to={item.path}
                className={`header__nav-item${isActive ? ' header__nav-item--active' : ''}`}
              >
                <span className="header__nav-icon">{item.icon}</span>
                <span className="header__nav-label">{item.label}</span>
              </AppNavButton>
            )
          })}
        </nav>

        <button
          type="button"
          className="header__menu-btn"
          aria-label="切换侧边栏"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          ☰
        </button>
      </header>

      <div className="layout__body">
        {showSidebar && (
          <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
            <div className="sidebar__header">
              <h2 className="sidebar__title">语文 · 子模块</h2>
            </div>
            <nav className="sidebar__nav">
              {CHINESE_MODULES.map((mod) => {
                const isActive = isChineseModuleActive(mod.path, location.pathname)

                return (
                  <AppNavButton
                    key={mod.key}
                    to={mod.path}
                    className={[
                      'sidebar__item',
                      isActive ? 'sidebar__item--active' : '',
                      !mod.ready ? 'sidebar__item--pending' : '',
                    ].join(' ')}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span>{mod.label}</span>
                    {!mod.ready && <span className="sidebar__badge">待开发</span>}
                  </AppNavButton>
                )
              })}
            </nav>
          </aside>
        )}

        {showSidebar && sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
