import { useCallback, useEffect, useRef, useState } from 'react'
import { playRecordingEndFeedback } from '@/utils/feedback'
import { createXfyunIatRecognizer } from '@/utils/xfyunIat'
import './VoiceInput.css'

export default function XfyunVoiceInput({
  disabled = false,
  onStart,
  onResult,
  onEnd,
  onError,
  onListeningChange,
}) {
  const [isListening, setIsListening] = useState(false)
  const recognizerRef = useRef(null)

  const updateListening = useCallback(
    (listening) => {
      setIsListening(listening)
      onListeningChange?.(listening)
    },
    [onListeningChange]
  )

  const stopRecognizer = useCallback(() => {
    recognizerRef.current?.stop()
  }, [])

  const startRecognizer = useCallback(() => {
    if (disabled || recognizerRef.current) return

    onStart?.()

    recognizerRef.current = createXfyunIatRecognizer({
      onResult: (text) => onResult?.(text),
      onStart: () => updateListening(true),
      onEnd: (finalText) => {
        updateListening(false)
        recognizerRef.current = null
        playRecordingEndFeedback()
        onEnd?.(finalText)
      },
      onError: (message) => {
        updateListening(false)
        recognizerRef.current = null
        onError?.(message)
      },
    })

    recognizerRef.current.start()
  }, [disabled, onEnd, onError, onResult, onStart, updateListening])

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopRecognizer()
      return
    }
    if (disabled) return
    startRecognizer()
  }, [disabled, isListening, startRecognizer, stopRecognizer])

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop()
      recognizerRef.current = null
    }
  }, [])

  return (
    <button
      type="button"
      className={`voice-btn${isListening ? ' voice-btn--active' : ''}`}
      title={isListening ? '点击结束录音' : '点击开始说话（讯飞识别）'}
      aria-label={isListening ? '结束录音' : '开始说话'}
      aria-pressed={isListening}
      disabled={disabled && !isListening}
      onClick={handleToggle}
    >
      <span className="voice-btn__icon">{isListening ? '⏹' : '🎤'}</span>
      {isListening && <span className="voice-btn__pulse" />}
    </button>
  )
}
