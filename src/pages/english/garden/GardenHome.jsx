import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GARDEN_BOOK_COUNT, getGardenBook, getGardenRegion, getGardenSeries, getBookSeriesLabel, formatBookTitleCn } from '@/data/englishReadingKingdom'
import {
  canEnterShrine,
  drawRandomShrine,
  getCompletedCount,
  getInProgressBooks,
  getTotalStars,
  isShrineCompleted,
  isShrineInProgress,
  loadGardenProgress,
  resetCompletedShrines,
} from '@/utils/gardenStorage'
import GardenBookCard from './GardenBookCard'
import './GardenHome.css'

export default function GardenHome() {
  const navigate = useNavigate()
  const gardenRegion = getGardenRegion()
  const seriesList = getGardenSeries()
  const [progressTick, setProgressTick] = useState(0)
  const [drawnBook, setDrawnBook] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const completedCount = useMemo(() => getCompletedCount(), [progressTick])
  const totalStars = useMemo(() => getTotalStars(), [progressTick])
  const pendingCount = GARDEN_BOOK_COUNT - completedCount
  const lastDrawId = useMemo(
    () => loadGardenProgress().lastDrawId,
    [progressTick, drawnBook],
  )

  const inProgressBooks = useMemo(() => getInProgressBooks(), [progressTick, drawnBook])
  const inProgressCount = inProgressBooks.length

  const lastDrawBook = useMemo(
    () => (lastDrawId ? getGardenBook(lastDrawId) : null),
    [lastDrawId],
  )

  const displayBook = drawnBook ?? lastDrawBook
  const showDrawResult = Boolean(drawnBook)
  const showContinue = Boolean(
    !drawnBook &&
      lastDrawBook &&
      pendingCount > 0 &&
      !isShrineCompleted(lastDrawBook.id) &&
      isShrineInProgress(lastDrawBook.id),
  )

  function refreshProgress() {
    setProgressTick((value) => value + 1)
  }

  function handleDraw() {
    if (pendingCount === 0 || isDrawing) return

    setIsDrawing(true)
    setDrawnBook(null)

    window.setTimeout(() => {
      const picked = drawRandomShrine()
      setDrawnBook(picked)
      setIsDrawing(false)
      refreshProgress()
    }, 900)
  }

  function goToShrine(bookId) {
    if (!canEnterShrine(bookId)) return
    navigate(`/english/garden/shrine/${bookId}`)
  }

  function handleResetCompleted() {
    if (completedCount === 0) return
    if (
      !window.confirm(
        '确定清空所有已完成的神庙吗？已开启数量与星星将归零，进行中的挑战会保留。',
      )
    ) {
      return
    }

    resetCompletedShrines()
    setDrawnBook(null)
    refreshProgress()
  }

  return (
    <div className="garden-home" style={{ backgroundColor: gardenRegion?.bgColor }}>
      <header className="garden-home__header">
        <Link to="/english" className="garden-home__back">
          ← 返回地图
        </Link>
        <div className="garden-home__intro">
          <div className="garden-home__title-row">
            <h2 className="garden-home__title">
              {gardenRegion?.icon} {gardenRegion?.name}
            </h2>
            {inProgressCount > 0 && (
              <Link to="/english/garden/in-progress" className="garden-home__in-progress-link">
                进行中 {inProgressCount} 本
              </Link>
            )}
          </div>
          <p className="garden-home__desc">{gardenRegion?.description}</p>
        </div>
        <div className="garden-home__stats">
          <div className="garden-home__stats-col">
            <span className="garden-home__stats-label">已开启</span>
            <strong>
              {completedCount}/{GARDEN_BOOK_COUNT}
            </strong>
          </div>
          <div className="garden-home__stats-col garden-home__stats-col--stars">
            <span className="garden-home__stats-stars" aria-label={`${totalStars} 颗星`}>
              <span className="garden-home__stats-star-icon" aria-hidden="true">⭐</span>
              <span className="garden-home__stats-star-count">{totalStars}</span>
            </span>
          </div>
          {completedCount > 0 && (
            <button
              type="button"
              className="garden-home__reset"
              onClick={handleResetCompleted}
            >
              清空已完成
            </button>
          )}
        </div>
      </header>

      <section className="garden-gacha">
        <div className={`garden-gacha__card${isDrawing ? ' garden-gacha__card--drawing' : ''}`}>
          <div className="garden-gacha__card-inner">
            <div className="garden-gacha__col garden-gacha__col--cover">
              {displayBook && !isDrawing && (showDrawResult || showContinue) ? (
                <img
                  src={displayBook.coverImage}
                  alt={displayBook.title}
                  className="garden-gacha__card-cover"
                />
              ) : (
                <div
                  className={`garden-gacha__card-placeholder${isDrawing ? ' garden-gacha__card-placeholder--drawing' : ''}`}
                  aria-hidden="true"
                >
                  ?
                </div>
              )}
            </div>

            <div className="garden-gacha__col garden-gacha__col--info">
              {isDrawing ? (
                <>
                  <span className="garden-gacha__card-tag">绘本神庙抽卡</span>
                  <span className="garden-gacha__card-series">正在抽卡，请稍候…</span>
                  <strong className="garden-gacha__card-title">?</strong>
                  <span className="garden-gacha__card-title-cn">即将揭晓下一座绘本神庙</span>
                </>
              ) : showDrawResult && displayBook ? (
                <>
                  <span className="garden-gacha__card-tag">抽中绘本神庙</span>
                  <span className="garden-gacha__card-series">
                    {getBookSeriesLabel(displayBook.id)} 中的
                  </span>
                  <strong className="garden-gacha__card-title">{displayBook.title}</strong>
                  <span className="garden-gacha__card-title-cn">
                    {formatBookTitleCn(displayBook.titleCn)}
                  </span>
                </>
              ) : showContinue && displayBook ? (
                <>
                  <span className="garden-gacha__card-tag">进行中</span>
                  <span className="garden-gacha__card-series">
                    {getBookSeriesLabel(displayBook.id)} 中的
                  </span>
                  <strong className="garden-gacha__card-title">{displayBook.title}</strong>
                  <span className="garden-gacha__card-title-cn">
                    {formatBookTitleCn(displayBook.titleCn)}
                  </span>
                </>
              ) : inProgressCount > 0 && !showDrawResult ? (
                <>
                  <span className="garden-gacha__card-tag">进行中</span>
                  <span className="garden-gacha__card-series">
                    共有 {inProgressCount} 座绘本神庙待完成
                  </span>
                  <strong className="garden-gacha__card-title">可抽卡，也可进进行中页</strong>
                  <span className="garden-gacha__card-title-cn">点封面直接继续挑战</span>
                </>
              ) : (
                <>
                  <span className="garden-gacha__card-tag">绘本神庙抽卡</span>
                  <span className="garden-gacha__card-series">
                    {pendingCount > 0
                      ? `还有 ${pendingCount} 座绘本神庙待挑战`
                      : '全部绘本神庙已开启'}
                  </span>
                  <strong className="garden-gacha__card-title">抽卡决定下一座</strong>
                  <span className="garden-gacha__card-title-cn">等待抽卡揭晓系列与书名</span>
                </>
              )}
            </div>

            <div className="garden-gacha__col garden-gacha__col--action">
              {isDrawing ? (
                <span className="garden-gacha__card-action-hint">正在为你挑选下一座绘本神庙…</span>
              ) : showDrawResult && displayBook ? (
                <>
                  <span className="garden-gacha__card-action-hint">
                    配对正确率需达到 80% 才能点亮；未达标仍为进行中，可继续挑战或被再次抽中
                  </span>
                  <button
                    type="button"
                    className="garden-gacha__go"
                    onClick={() => goToShrine(displayBook.id)}
                  >
                    前往挑战
                  </button>
                </>
              ) : showContinue && displayBook ? (
                <>
                  <span className="garden-gacha__card-action-hint">
                    继续上次抽中的神庙，或重新抽卡
                  </span>
                  <div className="garden-gacha__card-actions">
                    <button
                      type="button"
                      className="garden-gacha__go"
                      onClick={() => goToShrine(displayBook.id)}
                    >
                      继续挑战
                    </button>
                    <button
                      type="button"
                      className="garden-gacha__btn garden-gacha__btn--inline"
                      onClick={handleDraw}
                      disabled={pendingCount === 0}
                    >
                      重新抽卡
                    </button>
                  </div>
                </>
              ) : inProgressCount > 0 && !showDrawResult ? (
                <>
                  <span className="garden-gacha__card-action-hint">
                    抽卡随机选一座，或进入进行中页面点封面继续
                  </span>
                  <div className="garden-gacha__card-actions">
                    <Link to="/english/garden/in-progress" className="garden-gacha__go garden-gacha__go--link">
                      进入进行中
                    </Link>
                    <button
                      type="button"
                      className="garden-gacha__btn garden-gacha__btn--inline"
                      onClick={handleDraw}
                      disabled={pendingCount === 0}
                    >
                      抽卡选绘本神庙
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="garden-gacha__card-action-hint">
                    点击按钮，随机解锁一本绘本神庙
                  </span>
                  <button
                    type="button"
                    className="garden-gacha__btn garden-gacha__btn--inline"
                    onClick={handleDraw}
                    disabled={pendingCount === 0}
                  >
                    抽卡选绘本神庙
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="garden-library">
        {seriesList.map((series) => {
          if (!series.books?.length && !series.batches?.length) return null

          return (
            <div key={`${series.seriesName}-${series.seriesLevel}`} className="garden-series">
              <header className="garden-series__head">
                <div>
                  <h3>{series.seriesName}</h3>
                  <p>
                    {series.seriesLevel} · {series.publisher} · {series.focus}
                  </p>
                </div>
                <span>{series.books?.length ?? 0} 本</span>
              </header>

              {(series.batches ?? [{ folder: series.seriesName, books: series.books }]).map((batch) => (
                <div key={batch.folder} className="garden-batch">
                  <h4 className="garden-batch__title">{batch.folder}</h4>
                  <div className="garden-batch__grid">
                    {batch.books.map((book) => (
                      <GardenBookCard key={book.id} book={book} onEnter={goToShrine} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </section>
    </div>
  )
}
