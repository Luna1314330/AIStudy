import axios from 'axios'

const apiMode = import.meta.env.VITE_COZE_API_MODE || 'bot'
const botId = import.meta.env.VITE_COZE_BOT_ID || ''
const userId = import.meta.env.VITE_COZE_USER_ID || 'learning-assistant-user'
const apiDomain = import.meta.env.VITE_COZE_API_DOMAIN || ''
const readingApiDomain =
  import.meta.env.VITE_COZE_READING_API_DOMAIN || apiDomain
const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 120000

function normalizeDomain(domain) {
  return (domain || '').replace(/^https?:\/\//, '')
}

const COZE_AGENTS = {
  writing: {
    projectId: import.meta.env.VITE_COZE_PROJECT_ID || '',
    label: '写作引导',
    apiDomain: normalizeDomain(apiDomain),
  },
  reading: {
    projectId: import.meta.env.VITE_COZE_READING_PROJECT_ID || '',
    label: '阅读理解',
    apiDomain: normalizeDomain(readingApiDomain),
  },
}

const CODING_DEV_PROXY = {
  writing: '/api/coze-agent',
  reading: '/api/coze-agent-reading',
}

const useSameOriginApi = import.meta.env.VITE_USE_SAME_ORIGIN_API === 'true'

const isCodingMode = apiMode === 'coding'

const baseURL = import.meta.env.DEV || useSameOriginApi
  ? (isCodingMode ? '/api/coze-agent' : '/api/coze')
  : (isCodingMode
    ? (apiDomain ? `https://${apiDomain.replace(/^https?:\/\//, '')}` : '')
    : (import.meta.env.VITE_COZE_BASE_URL || 'https://api.coze.cn'))

const http = axios.create({
  baseURL,
  timeout: POLL_TIMEOUT_MS + 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

if (!import.meta.env.DEV && !useSameOriginApi && import.meta.env.VITE_COZE_API_TOKEN) {
  http.defaults.headers.common.Authorization = `Bearer ${import.meta.env.VITE_COZE_API_TOKEN}`
}

function getAgentConfig(agent = 'writing') {
  const config = COZE_AGENTS[agent]
  if (!config) {
    throw new Error(`未知智能体：${agent}`)
  }
  return config
}

function assertConfigured(agent = 'writing') {
  if (!import.meta.env.VITE_COZE_API_TOKEN && !useSameOriginApi) {
    throw new Error('未配置 VITE_COZE_API_TOKEN')
  }

  if (isCodingMode) {
    const { projectId: agentProjectId, label, apiDomain: agentApiDomain } = getAgentConfig(agent)
    if (!agentProjectId) {
      throw new Error(`未配置 ${label} 的 project_id`)
    }
    if (!agentApiDomain) {
      throw new Error(
        agent === 'reading'
          ? '未配置 VITE_COZE_READING_API_DOMAIN（阅读理解部署域名）'
          : '未配置 VITE_COZE_API_DOMAIN（部署页域名，如 6bcnbr396w.coze.site）'
      )
    }
    return
  }

  if (!botId) {
    throw new Error('未配置 VITE_COZE_BOT_ID，请复制 .env.example 为 .env.local 并填写')
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function assertApiOk(data) {
  if (typeof data?.code === 'number' && data.code !== 0) {
    throw new Error(data.msg || `Coze API 错误 (${data.code})`)
  }
}

function extractTextFromUnknown(value, depth = 0) {
  if (value == null || depth > 6) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    return value.map((item) => extractTextFromUnknown(item, depth + 1)).filter(Boolean).join('\n')
  }

  if (typeof value === 'object') {
    const preferredKeys = ['text', 'answer', 'content', 'output', 'result', 'message', 'reply', 'data']
    for (const key of preferredKeys) {
      if (value[key]) {
        const extracted = extractTextFromUnknown(value[key], depth + 1)
        if (extracted) return extracted
      }
    }

    if (value.prompt) {
      return extractTextFromUnknown(value.prompt, depth + 1)
    }
  }

  return ''
}

function extractReplyFromMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return ''

  const answer = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.type === 'answer')

  if (answer?.content) {
    return typeof answer.content === 'string' ? answer.content : JSON.stringify(answer.content)
  }

  const assistant = [...messages].reverse().find((m) => m.role === 'assistant')
  if (assistant?.content) {
    return typeof assistant.content === 'string' ? assistant.content : JSON.stringify(assistant.content)
  }

  return ''
}

async function pollChatUntilComplete(conversationId, chatId) {
  const start = Date.now()

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS)

    const { data } = await http.get('/v3/chat/retrieve', {
      params: {
        conversation_id: conversationId,
        chat_id: chatId,
      },
    })

    assertApiOk(data)

    const chat = data.data
    const status = chat?.status

    if (status === 'completed') return chat
    if (status === 'failed') throw new Error(chat?.last_error?.msg || '对话生成失败')
    if (status === 'canceled') throw new Error('对话已取消')
  }

  throw new Error('对话超时，请稍后重试')
}

async function listChatMessages(conversationId, chatId) {
  const { data } = await http.get('/v3/chat/message/list', {
    params: {
      conversation_id: conversationId,
      chat_id: chatId,
    },
  })

  assertApiOk(data)
  return data.data || []
}

async function sendBotChatMessage({ query, conversationId = null }) {
  const payload = {
    bot_id: botId,
    user_id: userId,
    stream: false,
    auto_save_history: true,
    additional_messages: [
      {
        role: 'user',
        content: query,
        content_type: 'text',
      },
    ],
  }

  const createUrl = conversationId
    ? `/v3/chat?conversation_id=${encodeURIComponent(conversationId)}`
    : '/v3/chat'

  const { data: createData } = await http.post(createUrl, payload)
  assertApiOk(createData)

  const chat = createData.data
  const chatId = chat?.id
  const newConversationId = chat?.conversation_id || conversationId

  if (!chatId || !newConversationId) {
    throw new Error('Coze API 未返回有效的对话 ID')
  }

  if (chat.status !== 'completed') {
    await pollChatUntilComplete(newConversationId, chatId)
  }

  const messages = await listChatMessages(newConversationId, chatId)
  const reply = extractReplyFromMessages(messages)

  if (!reply) {
    throw new Error('未获取到助手回复，请检查 Bot 配置')
  }

  return {
    reply,
    conversationId: newConversationId,
  }
}

async function pollCodingTask(taskId, agentHttp = http) {
  const start = Date.now()

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS)

    const { data } = await agentHttp.get(`/task/${encodeURIComponent(taskId)}`)
    assertApiOk(data)

    const task = data.data || data
    const status = task?.status

    if (status === 'completed') return task
    if (status === 'failed' || status === 'timeout') {
      throw new Error(task?.error || task?.error_message || '智能体执行失败')
    }
  }

  throw new Error('智能体响应超时，请稍后重试')
}

function buildCodingPayload(query, sessionId, agent = 'writing') {
  const { projectId: agentProjectId } = getAgentConfig(agent)
  return {
    content: {
      query: {
        prompt: [
          {
            type: 'text',
            content: {
              text: query,
            },
          },
        ],
      },
    },
    type: 'query',
    project_id: agentProjectId,
    session_id: sessionId,
  }
}

function createSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function getCodingBaseURL(agent = 'writing') {
  if (import.meta.env.DEV || useSameOriginApi) {
    return CODING_DEV_PROXY[agent] || CODING_DEV_PROXY.writing
  }
  const domain = getAgentConfig(agent).apiDomain
  return domain ? `https://${domain}` : ''
}

function getCodingRequestUrl(path, agent = 'writing') {
  return `${getCodingBaseURL(agent)}${path}`
}

function getAgentHttp(agent = 'writing') {
  return axios.create({
    baseURL: getCodingBaseURL(agent),
    timeout: POLL_TIMEOUT_MS + 10000,
    headers: {
      'Content-Type': 'application/json',
      ...(import.meta.env.DEV || useSameOriginApi || !import.meta.env.VITE_COZE_API_TOKEN
        ? {}
        : { Authorization: `Bearer ${import.meta.env.VITE_COZE_API_TOKEN}` }),
    },
  })
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (!import.meta.env.DEV && !useSameOriginApi && import.meta.env.VITE_COZE_API_TOKEN) {
    headers.Authorization = `Bearer ${import.meta.env.VITE_COZE_API_TOKEN}`
  }
  return headers
}

function parseAsyncTaskResult(result) {
  if (result == null) return ''

  if (typeof result === 'string') {
    const trimmed = result.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return parseAsyncTaskResult(JSON.parse(trimmed))
      } catch {
        return trimmed
      }
    }
    return trimmed
  }

  if (typeof result === 'object' && result.answer) {
    return String(result.answer)
  }

  return extractTextFromUnknown(result)
}

/** 解析 stream_run SSE：按 sequence_id 拼接 answer，支持流式回调 */
async function parseStreamRunResponse(response, { onDelta, signal } = {}) {
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `请求失败 (${response.status})`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('浏览器不支持流式响应')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let sessionId = ''
  const answerParts = new Map()
  let finished = false

  const buildReply = () =>
    [...answerParts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, text]) => text)
      .join('')

  const emitDelta = (isFinished = false) => {
    onDelta?.({
      reply: buildReply(),
      conversationId: sessionId,
      finished: isFinished,
    })
  }

  while (true) {
    if (signal?.aborted) {
      await reader.cancel().catch(() => {})
      throw new DOMException('请求已取消', 'AbortError')
    }

    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''

    for (const chunk of chunks) {
      const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'))
      if (!dataLine) continue

      const raw = dataLine.slice(5).trim()
      if (!raw) continue

      let event
      try {
        event = JSON.parse(raw)
      } catch {
        continue
      }

      if (event.type === 'message_start' && event.session_id) {
        sessionId = event.session_id
      } else if (event.session_id && !sessionId) {
        sessionId = event.session_id
      }

      if (event.type === 'error' || event.content?.error) {
        const err = event.content?.error ?? event.error ?? event
        throw new Error(typeof err === 'string' ? err : JSON.stringify(err))
      }

      if (event.type === 'answer' && typeof event.content?.answer === 'string') {
        const seq = event.sequence_id ?? answerParts.size
        answerParts.set(seq, (answerParts.get(seq) || '') + event.content.answer)
        emitDelta(false)
      }

      if (event.type === 'message_end') {
        finished = true
        const end = event.content?.message_end
        if (end?.code && end.code !== '0' && end.message) {
          throw new Error(end.message)
        }
        emitDelta(true)
      }
    }
  }

  const reply = buildReply().trim()

  return { reply, sessionId, finished }
}

/** 部署页「执行智能体」接口：POST /stream_run（流式） */
async function sendCodingStreamRun({ query, conversationId = null, onDelta, signal, agent = 'writing' }) {
  const sessionId = conversationId || createSessionId()
  const payload = buildCodingPayload(query, sessionId, agent)

  const response = await fetch(getCodingRequestUrl('/stream_run', agent), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    signal,
  })

  const { reply, sessionId: returnedSessionId } = await parseStreamRunResponse(response, {
    onDelta,
    signal,
  })

  if (!reply) {
    throw new Error('未获取到助手回复，请检查智能体部署状态')
  }

  return {
    reply,
    conversationId: returnedSessionId || sessionId,
  }
}

async function sendCodingAgentMessage({
  query,
  conversationId = null,
  onDelta,
  signal,
  agent = 'writing',
}) {
  try {
    return await sendCodingStreamRun({ query, conversationId, onDelta, signal, agent })
  } catch (streamError) {
    if (streamError?.name === 'AbortError') throw streamError

    const payload = buildCodingPayload(query, conversationId || createSessionId(), agent)

    const agentHttp = getAgentHttp(agent)
    const { data: runData } = await agentHttp.post('/async_run', payload)
    assertApiOk(runData)

    const taskId = runData.task_id || runData.data?.task_id
    if (!taskId) {
      throw streamError
    }

    const task = await pollCodingTask(taskId, agentHttp)
    const reply = parseAsyncTaskResult(task.result)

    if (!reply) {
      throw streamError
    }

    onDelta?.({
      reply,
      conversationId: payload.session_id,
      finished: true,
    })

    return {
      reply,
      conversationId: payload.session_id,
    }
  }
}

export async function sendChatMessage({
  query,
  conversationId = null,
  onDelta,
  signal,
  agent = 'writing',
}) {
  assertConfigured(agent)
  return isCodingMode
    ? sendCodingAgentMessage({ query, conversationId, onDelta, signal, agent })
    : sendBotChatMessage({ query, conversationId }).then((result) => {
        onDelta?.({
          reply: result.reply,
          conversationId: result.conversationId,
          finished: true,
        })
        return result
      })
}

export async function checkApiStatus(agent = 'writing') {
  try {
    assertConfigured(agent)
    if (isCodingMode) {
      const { label } = getAgentConfig(agent)
      return { ok: true, message: `${label}智能体配置已就绪` }
    }
    return { ok: true, message: 'Coze Bot 配置已就绪' }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}
