import { useCallback, useEffect, useRef } from 'react'
import ChatMessageBox from '@/components/ChatMessageBox'
import VoiceStatusBar from '@/components/VoiceStatusBar'
import XfyunVoiceInput from '@/components/XfyunVoiceInput'
import { useInputBar } from '@/hooks/useInputBar'
import { useReadingChatStore } from '@/store/chatStore'
import { checkApiStatus } from '@/utils/api'
import { getReadingWelcomeHints } from '@/utils/readingHints'
import {
  buildThemeSelectionMessage,
  getReadingBankStats,
  resetReadingQuestionUsage,
} from '@/utils/readingQuestionBank'
import './ChineseWriting.css'

export default function ChineseReading() {
  const messages = useReadingChatStore((s) => s.messages)
  const error = useReadingChatStore((s) => s.error)
  const clearError = useReadingChatStore((s) => s.clearError)
  const retryMessage = useReadingChatStore((s) => s.retryMessage)
  const resetConversation = useReadingChatStore((s) => s.resetConversation)

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
  } = useInputBar(useReadingChatStore)

  const listRef = useRef(null)

  const welcomeThemes = getReadingWelcomeHints()
  const bankStats = getReadingBankStats()

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    checkApiStatus('reading').then((status) => {
      if (!status.ok) {
        useReadingChatStore.setState({ error: status.message })
      }
    })
  }, [])

  const handleVoiceError = useCallback((msg) => {
    useReadingChatStore.setState({ error: msg })
  }, [])

  function handleReset() {
    if (!window.confirm('确定要清空对话并重新开始吗？')) return
    resetReadingQuestionUsage()
    resetConversation()
  }

  function selectTheme(number) {
    if (inputLocked) return

    const selection = buildThemeSelectionMessage(number)
    if (!selection.ok) {
      useReadingChatStore.setState({ error: selection.error })
      return
    }

    useReadingChatStore.getState().sendMessage(String(number), {
      displayContent: selection.displayContent,
      apiQuery: selection.apiQuery,
      readingPassage: selection.item,
    })
  }

  return (
    <div className="writing-page">
      <header className="writing-page__header">
        <h2 className="writing-page__title">阅读理解</h2>
        <div className="writing-page__header-right">
          <p className="writing-page__desc">
            老师将通过多轮对话，引导你读懂文章、理清思路、完成答题
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
            <div className="welcome-card welcome-card--reading">
              <span className="welcome-card__icon">📖</span>
              <h3>想读什么主题的？</h3>
              <ol className="reading-theme-list">
                {welcomeThemes.map(({ number, label }) => (
                  <li key={number} onClick={() => selectTheme(number)}>
                    <span className="reading-theme-list__num">{number}.</span>
                    {label}
                  </li>
                ))}
              </ol>
              <p className="welcome-card__tip">
                点击主题后，将从题库随机抽取一篇文章和题目
                {bankStats.loaded > 0
                  ? `（已加载 ${bankStats.loaded} 篇${bankStats.total !== bankStats.loaded ? `，共 ${bankStats.total} 篇` : ''}）`
                  : ''}
              </p>
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
              kind={msg.kind}
              passage={msg.passage}
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
                : '粘贴文章或题目，也可以点击麦克风说话…'
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
