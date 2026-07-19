function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let playbackGeneration = 0

function isPlaybackActive(generation) {
  return generation === playbackGeneration
}

function cancelCurrentUtterance() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** 停止朗读并作废当前播放会话，返回新的 generation 供后续 speak 使用 */
export function stopSpeaking() {
  playbackGeneration += 1
  cancelCurrentUtterance()
  return playbackGeneration
}

async function delayCancellable(ms, generation) {
  const step = 80
  let elapsed = 0

  while (elapsed < ms) {
    if (!isPlaybackActive(generation)) return false
    const chunk = Math.min(step, ms - elapsed)
    await delay(chunk)
    elapsed += chunk
  }

  return isPlaybackActive(generation)
}

export function speakText(
  text,
  { rate = 0.85, pitch = 1, lang = 'zh-CN', generation = playbackGeneration } = {}
) {
  return new Promise((resolve) => {
    if (!isSpeechSupported() || !text || !isPlaybackActive(generation)) {
      resolve(false)
      return
    }

    cancelCurrentUtterance()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch

    const finish = () => resolve(isPlaybackActive(generation))

    utterance.onend = finish
    utterance.onerror = finish

    window.speechSynthesis.speak(utterance)
  })
}

/** 朗读词语：读 N 遍，可选例句（词与例句间隔 3 秒） */
export async function speakWordEntry(
  entry,
  { repeats = 2, readExample = true, gapMs = 800, wordExampleGapMs = 3000, generation } = {}
) {
  const word = typeof entry === 'string' ? entry : entry.word
  if (!word) return false

  const sessionId = generation ?? playbackGeneration
  if (!isPlaybackActive(sessionId)) return false

  const wordRate = 0.65
  const exampleRate = 0.7

  for (let i = 0; i < repeats; i += 1) {
    if (!isPlaybackActive(sessionId)) return false

    const spoken = await speakText(word, { rate: wordRate, generation: sessionId })
    if (!spoken || !isPlaybackActive(sessionId)) return false

    if (i < repeats - 1) {
      const waited = await delayCancellable(gapMs, sessionId)
      if (!waited) return false
    }
  }

  if (readExample && entry?.example) {
    const waited = await delayCancellable(wordExampleGapMs, sessionId)
    if (!waited) return false

    const spoken = await speakText(entry.example, { rate: exampleRate, generation: sessionId })
    if (!spoken) return false
  }

  return isPlaybackActive(sessionId)
}
