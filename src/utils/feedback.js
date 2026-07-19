/** 结束录音时的轻反馈：短振动 + 柔和提示音 */
export function playRecordingEndFeedback() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(40)
  }

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.04

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    oscillator.stop(ctx.currentTime + 0.14)

    oscillator.onended = () => {
      ctx.close().catch(() => {})
    }
  } catch {
    // 静默失败，不影响主流程
  }
}
