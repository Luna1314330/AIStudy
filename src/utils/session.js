const LEGACY_WRITING_KEY = 'writing-voice-session-id'

function getStorageKey(agent = 'writing') {
  return `coze-session-${agent}`
}

export function getSessionId(agent = 'writing') {
  const key = getStorageKey(agent)

  if (agent === 'writing') {
    const legacy = localStorage.getItem(LEGACY_WRITING_KEY)
    if (legacy && !localStorage.getItem(key)) {
      localStorage.setItem(key, legacy)
    }
  }

  const stored = localStorage.getItem(key)
  if (stored) return stored

  const initial = `${agent}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  localStorage.setItem(key, initial)
  return initial
}

export function saveSessionId(agent, sessionId) {
  if (!sessionId) return
  localStorage.setItem(getStorageKey(agent), sessionId)
}

export function resetSessionId(agent = 'writing') {
  localStorage.removeItem(getStorageKey(agent))
  if (agent === 'writing') {
    localStorage.removeItem(LEGACY_WRITING_KEY)
  }
  return getSessionId(agent)
}
