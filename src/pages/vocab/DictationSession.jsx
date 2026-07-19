import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVocabStore } from '@/store/vocabStore'
import { speakWordEntry, stopSpeaking } from '@/utils/speech'
import './DictationSession.css'

export default function DictationSession() {
  const navigate = useNavigate()
  const session = useVocabStore((s) => s.session)
  const updateSession = useVocabStore((s) => s.updateSession)

  const [index, setIndex] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const autoPlayRef = useRef(false)
  const playbackGenRef = useRef(0)

  const words = session?.words || []
  const settings = session?.settings || { repeats: 2, readExample: true }
  const total = words.length
  const current = words[index]

  useEffect(() => {
    if (!session?.words?.length) {
      navigate('/chinese/vocab', { replace: true })
    }
  }, [session, navigate])

  const playCurrent = useCallback(async () => {
    if (!current) return

    const generation = stopSpeaking()
    playbackGenRef.current = generation

    setSessionActive(true)
    setSpeaking(true)

    await speakWordEntry(current, {
      repeats: settings.repeats,
      readExample: settings.readExample,
      generation,
    })

    if (playbackGenRef.current === generation) {
      setSpeaking(false)
    }
  }, [current, settings.repeats, settings.readExample])

  useEffect(() => {
    stopSpeaking()
    setSpeaking(false)

    if (autoPlayRef.current) {
      autoPlayRef.current = false
      playCurrent()
    }
  }, [index, playCurrent])

  useEffect(
    () => () => {
      stopSpeaking()
    },
    []
  )

  function interruptPlayback() {
    stopSpeaking()
    setSpeaking(false)
  }

  function goPrev() {
    interruptPlayback()

    if (index <= 0) return

    setSessionActive(true)
    autoPlayRef.current = true
    setIndex((prev) => Math.max(prev - 1, 0))
  }

  function goNext() {
    interruptPlayback()

    if (index >= total - 1) {
      updateSession({ finishedAt: Date.now() })
      navigate('/chinese/vocab/result')
      return
    }

    setSessionActive(true)
    autoPlayRef.current = true
    setIndex((prev) => prev + 1)
  }

  if (!session || !current) return null

  const progress = ((index + 1) / total) * 100
  const showStart = index === 0 && !sessionActive
  const speakerLabel = speaking
    ? '正在朗读…'
    : showStart
      ? '开始'
      : '重读'

  return (
    <div className="dictation-session">
      <div className="dictation-session__top">
        <span className="dictation-session__book">{session.bookName}</span>
        <span className="dictation-session__progress-text">
          第 {index + 1} / {total} 个词
        </span>
      </div>

      <div className="dictation-session__progress">
        <div className="dictation-session__progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="dictation-session__main">
        <button
          type="button"
          className={`dictation-session__speaker${speaking ? ' dictation-session__speaker--active' : ''}`}
          onClick={playCurrent}
          aria-label={showStart ? '开始听词' : '重读'}
        >
          <span className="dictation-session__speaker-icon" aria-hidden="true">🔊</span>
          <span className="dictation-session__speaker-label">{speakerLabel}</span>
        </button>

        <p className="dictation-session__hint">
          {showStart
            ? '请点击「开始」听第一个词，然后在纸上书写'
            : '写完了点「下一个」或「上一个」会自动朗读，也可点「重读」'}
        </p>
      </div>

      <div className="dictation-session__nav">
        <button
          type="button"
          className="dictation-session__nav-btn"
          onClick={goPrev}
          disabled={index === 0}
        >
          ⬅ 上一个
        </button>
        <button
          type="button"
          className="dictation-session__nav-btn dictation-session__nav-btn--primary"
          onClick={goNext}
        >
          {index >= total - 1 ? '完成听写 ✓' : '下一个 ➡'}
        </button>
      </div>
    </div>
  )
}
