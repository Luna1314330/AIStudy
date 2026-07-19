import MarkdownContent from '@/components/MarkdownContent'
import ReadingPassageCard from '@/components/ReadingPassageCard'
import './ChatMessageBox.css'
import './ReadingPassageCard.css'

export default function ChatMessageBox({
  role,
  content,
  timestamp,
  status = 'done',
  onRetry,
  kind,
  passage,
}) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : ''

  const isPassage = kind === 'passage' && passage
  const isAssistant = role === 'assistant' && !isPassage
  const isStreaming = status === 'streaming'
  const isLoading = status === 'loading'
  const isFailed = status === 'failed'

  return (
    <div
      className={`message message--${isPassage ? 'passage' : role === 'user' ? 'user' : 'assistant'}`}
    >
      <div className="message__avatar">{isPassage ? '文' : role === 'user' ? '我' : '师'}</div>
      <div className="message__bubble">
        {isPassage ? (
          <>
            <ReadingPassageCard passage={passage} />
            {timestamp && (
              <time className="message__time">{formattedTime}</time>
            )}
          </>
        ) : isLoading ? (
          <div className="message__loading">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="message__loading-text">家教老师正在思考…</span>
          </div>
        ) : isFailed ? (
          <div className="message__failed">
            <div className="message__content">{content}</div>
            <button type="button" className="message__retry" onClick={onRetry}>
              发送失败，点击重试
            </button>
          </div>
        ) : isAssistant ? (
          <div className="message__content">
            <MarkdownContent content={content} />
            {isStreaming && <span className="markdown__cursor" aria-hidden="true" />}
          </div>
        ) : (
          <div className="message__content">{content}</div>
        )}
        {timestamp && !isLoading && !isFailed && (
          <time className="message__time">{formattedTime}</time>
        )}
      </div>
    </div>
  )
}
