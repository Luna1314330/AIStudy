import { formatBookTitleCn } from '@/data/englishReadingKingdom'
import { canEnterShrine, isShrineCompleted, isShrineInProgress } from '@/utils/gardenStorage'

function getBookStatus(bookId) {
  if (isShrineCompleted(bookId)) return 'done'
  if (isShrineInProgress(bookId)) return 'active'
  return 'locked'
}

const STATUS_LABEL = {
  locked: '未开启',
  active: '进行中',
  done: '已开启',
}

export default function GardenBookCard({ book, onEnter, forceActive = false }) {
  const status = forceActive ? 'active' : getBookStatus(book.id)
  const canEnter = forceActive ? true : canEnterShrine(book.id)

  return (
    <button
      type="button"
      className={`garden-book-card garden-book-card--${status}`}
      onClick={() => canEnter && onEnter(book.id)}
      disabled={!canEnter}
      aria-label={`${book.title} ${book.titleCn}，${STATUS_LABEL[status]}${canEnter ? '，点击进入' : ''}`}
    >
      <div className="garden-book-card__cover-wrap">
        <img src={book.coverImage} alt={book.title} className="garden-book-card__cover" loading="lazy" />
      </div>
      <span className="garden-book-card__title">{book.title}</span>
      <span className="garden-book-card__title-cn">{formatBookTitleCn(book.titleCn)}</span>
      <span className="garden-book-card__status">{STATUS_LABEL[status]}</span>
      {status === 'active' && <span className="garden-book-card__enter">继续挑战 →</span>}
    </button>
  )
}
