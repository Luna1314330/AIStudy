import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppNavButton from '@/components/AppNavButton'
import { getBookSeriesLabel, getGardenRegion } from '@/data/englishReadingKingdom'
import { canEnterShrine, getInProgressBooks } from '@/utils/gardenStorage'
import GardenBookCard from './GardenBookCard'
import './GardenHome.css'

export default function GardenInProgress() {
  const navigate = useNavigate()
  const gardenRegion = getGardenRegion()
  const inProgressBooks = useMemo(() => getInProgressBooks(), [])

  function goToShrine(bookId) {
    if (!canEnterShrine(bookId)) return
    navigate(`/english/garden/shrine/${bookId}`)
  }

  return (
    <div className="garden-home garden-in-progress" style={{ backgroundColor: gardenRegion?.bgColor }}>
      <header className="garden-home__header">
        <AppNavButton to="/english/garden" className="garden-home__back">
          ← 绘本神庙
        </AppNavButton>
        <div className="garden-home__intro">
          <h2 className="garden-home__title">进行中的绘本神庙</h2>
          <p className="garden-home__desc">点封面直接进入挑战；也可返回抽卡随机选一座</p>
        </div>
        <div className="garden-home__stats">
          <div className="garden-home__stats-col">
            <span className="garden-home__stats-label">进行中</span>
            <strong>{inProgressBooks.length} 本</strong>
          </div>
        </div>
      </header>

      {inProgressBooks.length === 0 ? (
        <section className="garden-in-progress__empty">
          <span aria-hidden="true">📚</span>
          <p>暂无进行中的绘本神庙</p>
          <AppNavButton to="/english/garden" className="garden-gacha__go">
            去抽卡选绘本
          </AppNavButton>
        </section>
      ) : (
        <section className="garden-active garden-active--page">
          <div className="garden-in-progress__grid">
            {inProgressBooks.map((book) => (
              <div key={book.id} className="garden-in-progress__item">
                <p className="garden-in-progress__series">{getBookSeriesLabel(book.id)}</p>
                <GardenBookCard book={book} onEnter={goToShrine} forceActive />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
