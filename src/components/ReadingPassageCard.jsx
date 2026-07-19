import { getPassageText } from '@/utils/readingQuestionBank'
import './ReadingPassageCard.css'

export default function ReadingPassageCard({ passage }) {
  if (!passage) return null

  const text = getPassageText(passage)
  const meta = [
    passage.levelName,
    passage.genre,
    passage.wordCount ? `约 ${passage.wordCount} 字` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="reading-passage">
      <header className="reading-passage__header">
        <span className="reading-passage__label">📖 阅读材料</span>
        <h3 className="reading-passage__title">《{passage.title}》</h3>
        {meta && <p className="reading-passage__meta">{meta}</p>}
      </header>
      <div className="reading-passage__body">
        {text.split('\n\n').map((paragraph, index) => (
          <p key={index} className="reading-passage__paragraph">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  )
}
