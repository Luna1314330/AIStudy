let sharedAudioContext = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx()
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {})
  }
  return sharedAudioContext
}

function playTone(ctx, frequency, startAt, duration, peakGain = 0.1) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.025)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.05)
}

/** 塞尔达风格「叮——」获得容器音效 */
export function playShrineRevealDing() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime + 0.02
  playTone(ctx, 987.77, now, 0.55, 0.11)
  playTone(ctx, 1318.51, now + 0.07, 0.75, 0.08)
  playTone(ctx, 1760, now + 0.12, 0.95, 0.05)
}

/** 旋转阶段轻微环境音 */
export function playShrineRevealSpin() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime + 0.02
  playTone(ctx, 440, now, 0.35, 0.025)
  playTone(ctx, 554.37, now + 0.05, 0.45, 0.02)
}
