import { useCallback, useRef } from 'react'

export function useInputBar(useStore) {
  const draftText = useStore((s) => s.draftText)
  const isLoading = useStore((s) => s.isLoading)
  const isVoiceListening = useStore((s) => s.isVoiceListening)
  const setDraftText = useStore((s) => s.setDraftText)
  const setVoiceListening = useStore((s) => s.setVoiceListening)
  const sendMessage = useStore((s) => s.sendMessage)

  const textareaRef = useRef(null)
  const voicePrefixRef = useRef('')

  const canSend =
    draftText.trim().length > 0 && !isLoading && !isVoiceListening
  const inputLocked = isLoading || isVoiceListening

  const handleSend = useCallback(() => {
    if (!canSend) return
    sendMessage()
  }, [canSend, sendMessage])

  const handleVoiceStart = useCallback(() => {
    voicePrefixRef.current = useStore.getState().draftText
  }, [useStore])

  const handleVoiceResult = useCallback(
    (segment) => {
      const prefix = voicePrefixRef.current
      const prev = useStore.getState().draftText
      const next = prefix + segment

      if (prev.startsWith(prefix)) {
        const prevSegment = prev.slice(prefix.length)
        if (segment.length < prevSegment.length) return
      }

      setDraftText(next)
    },
    [setDraftText, useStore]
  )

  const handleVoiceEnd = useCallback(
    (segment) => {
      const prefix = voicePrefixRef.current
      const prev = useStore.getState().draftText
      const next = prefix + (segment || '')

      if (!segment) {
        if (prev.startsWith(prefix) && prev.length > prefix.length) return
        return
      }

      setDraftText(prev.length > next.length ? prev : next)
    },
    [setDraftText, useStore]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (isVoiceListening) return
        handleSend()
      }
    },
    [handleSend, isVoiceListening]
  )

  return {
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
  }
}
