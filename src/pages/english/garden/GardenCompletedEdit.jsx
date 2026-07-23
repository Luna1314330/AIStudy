import { useMemo, useState } from 'react'
import AppNavButton from '@/components/AppNavButton'
import {
  formatBookTitleCn,
  getBookSeriesLabel,
  getGardenRegion,
} from '@/data/englishReadingKingdom'
import {
  getCompletedBooks,
  getCompletedCount,
  revertShrineToInProgress,
  revertShrineToLocked,
} from '@/utils/gardenStorage'
import './GardenHome.css'

export default function GardenCompletedEdit() {
  const gardenRegion = getGardenRegion()
  const [progressTick, setProgressTick] = useState(0)

  const completedBooks = useMemo(() => getCompletedBooks(), [progressTick])
  const completedCount = useMemo(() => getCompletedCount(), [progressTick])

  function refreshProgress() {
    setProgressTick((value) => value + 1)
  }

  function handleRevertToInProgress(book) {
    if (
      !window.confirm(
        `将「${formatBookTitleCn(book.titleCn) || book.title}」改回进行中？\n已获得的 ⭐ ${book.starsReward} 会被收回。`,
      )
    ) {
      return
    }

    if (revertShrineToInProgress(book.id)) {
      refreshProgress()
    }
  }

  function handleRevertToLocked(book) {
    if (
      !window.confirm(
        `将「${formatBookTitleCn(book.titleCn) || book.title}」改回未开启？\n已获得的 ⭐ ${book.starsReward} 会被收回，需重新抽卡才能挑战。`,
      )
    ) {
      return
    }

    if (revertShrineToLocked(book.id)) {
      refreshProgress()
    }
  }

  return (
    <div className="garden-home garden-completed-edit" style={{ backgroundColor: gardenRegion?.bgColor }}>
      <header className="garden-home__header">
        <AppNavButton to="/english/garden" className="garden-home__back">
          ← 绘本神庙
        </AppNavButton>
        <div className="garden-home__intro">
          <h2 className="garden-home__title">管理已开启绘本</h2>
          <p className="garden-home__desc">可将已点亮的绘本改回「进行中」或「未开启」，星星会同步扣回</p>
        </div>
        <div className="garden-home__stats">
          <div className="garden-home__stats-col">
            <span className="garden-home__stats-label">已开启</span>
            <strong>{completedCount} 本</strong>
          </div>
        </div>
      </header>

      {completedBooks.length === 0 ? (
        <section className="garden-in-progress__empty">
          <span aria-hidden="true">📘</span>
          <p>暂无已开启的绘本</p>
          <AppNavButton to="/english/garden" className="garden-gacha__go">
            返回绘本神庙
          </AppNavButton>
        </section>
      ) : (
        <section className="garden-active garden-active--page">
          <div className="garden-completed-edit__grid">
            {completedBooks.map((book) => (
              <article key={book.id} className="garden-completed-edit__card">
                <p className="garden-completed-edit__series">{getBookSeriesLabel(book.id)}</p>
                <img src={book.coverImage} alt={book.title} className="garden-completed-edit__cover" />
                <h3 className="garden-completed-edit__title">{book.title}</h3>
                <p className="garden-completed-edit__title-cn">{formatBookTitleCn(book.titleCn)}</p>
                <div className="garden-completed-edit__actions">
                  <button
                    type="button"
                    className="garden-completed-edit__btn garden-completed-edit__btn--active"
                    onClick={() => handleRevertToInProgress(book)}
                  >
                    改为进行中
                  </button>
                  <button
                    type="button"
                    className="garden-completed-edit__btn garden-completed-edit__btn--locked"
                    onClick={() => handleRevertToLocked(book)}
                  >
                    改为未开启
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
