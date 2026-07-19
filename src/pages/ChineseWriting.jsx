import { useCallback, useEffect, useMemo, useRef } from 'react'
import ChatMessageBox from '@/components/ChatMessageBox'
import QuickHints from '@/components/QuickHints'
import VoiceStatusBar from '@/components/VoiceStatusBar'
import XfyunVoiceInput from '@/components/XfyunVoiceInput'
import { useInputBar } from '@/hooks/useInputBar'
import { useChatStore } from '@/store/chatStore'
import { checkApiStatus } from '@/utils/api'
import { getHintStageLabel, getWelcomeHints, getWritingQuickHints } from '@/utils/writingHints'
import './ChineseWriting.css'

export default function ChineseWriting() {
  const messages = useChatStore((s) => s.messages)
  const error = useChatStore((s) => s.error)
  const clearError = useChatStore((s) => s.clearError)
  const retryMessage = useChatStore((s) => s.retryMessage)
  const resetConversation = useChatStore((s) => s.resetConversation)

  const {
    draftText,
    isLoading,
    isVoiceListening,
    canSend,
    inputLocked,
    textareaRef,
    setDraftText,
    setVoiceListening,
    handleSend,
    handleVoiceStart,
    handleVoiceResult,
    handleVoiceEnd,
    handleKeyDown,
  } = useInputBar(useChatStore)

  const listRef = useRef(null)

  const quickHints = useMemo(() => getWritingQuickHints(messages), [messages])
  const hintLabel = useMemo(() => getHintStageLabel(messages), [messages])
  const welcomeHints = getWelcomeHints()

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    checkApiStatus().then((status) => {
      if (!status.ok) {
        useChatStore.setState({ error: status.message })
      }
    })
  }, [])

  const handleVoiceError = useCallback((msg) => {
    useChatStore.setState({ error: msg })
  }, [])

  function handleReset() {
    if (!window.confirm('确定要清空对话并重新开始吗？')) return
    resetConversation()
  }

  function useHint(hint) {
    if (inputLocked) return
    setDraftText(hint)
    textareaRef.current?.focus()
  }

  return (
    <div className="writing-page">
      <header className="writing-page__header">
        <h2 className="writing-page__title">写作引导</h2>
        <div className="writing-page__header-right">
          <p className="writing-page__desc">
            资深家教将通过多轮对话，引导你完成写作构思与成文
          </p>
          {messages.length > 0 && (
            <button type="button" className="writing-page__reset" onClick={handleReset}>
              重新开始
            </button>
          )}
        </div>
      </header>

      <div ref={listRef} className="writing-page__messages">
        {messages.length === 0 ? (
          <div className="writing-page__welcome">
            <div className="welcome-card">
              <span className="welcome-card__icon">✍️</span>
              <h3>开始你的写作之旅</h3>
              <p>告诉老师你想写什么题目或主题，例如：</p>
              <ul>
                {welcomeHints.map((hint) => (
                  <li key={hint} onClick={() => useHint(hint)}>
                    「{hint}」
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBox
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              status={msg.status}
              onRetry={
                msg.status === 'failed'
                  ? () => retryMessage(msg.id)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {error && (
        <div className="writing-page__error">
          <span>⚠️ {error}</span>
          <button type="button" onClick={clearError}>关闭</button>
        </div>
      )}

      <footer className="writing-page__input">
        <VoiceStatusBar active={isVoiceListening} />

        {messages.length > 0 && (
          <QuickHints
            label={hintLabel}
            hints={quickHints}
            disabled={inputLocked || isLoading}
            onSelect={useHint}
          />
        )}

        <div className="input-bar">
          <XfyunVoiceInput
            disabled={isLoading}
            onListeningChange={setVoiceListening}
            onStart={handleVoiceStart}
            onResult={handleVoiceResult}
            onEnd={handleVoiceEnd}
            onError={handleVoiceError}
          />

          <textarea
            ref={textareaRef}
            className="input-bar__textarea"
            placeholder={
              isVoiceListening
                ? '正在听你说…请先点麦克风结束'
                : '输入你的想法，或点击麦克风说话…'
            }
            rows={1}
            value={draftText}
            disabled={inputLocked}
            readOnly={isVoiceListening}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            type="button"
            className="input-bar__send"
            disabled={!canSend}
            title={isVoiceListening ? '请先结束语音识别' : undefined}
            onClick={handleSend}
          >
            {isLoading ? '…' : '发送'}
          </button>
        </div>
        <p className="input-bar__tip">
          Enter 发送 · Shift+Enter 换行 · 录音时请先点麦克风结束，再点发送
        </p>
      </footer>
    </div>
  )
}
