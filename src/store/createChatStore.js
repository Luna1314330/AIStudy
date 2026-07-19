import { create } from 'zustand'
import { sendChatMessage } from '@/utils/api'
import { getSessionId, resetSessionId, saveSessionId } from '@/utils/session'

let messageId = 0

function nextId() {
  messageId += 1
  return `msg-${Date.now()}-${messageId}`
}

async function requestAssistantReply({ agent, text, sessionId, assistantId, set, get }) {
  const result = await sendChatMessage({
    agent,
    query: text,
    conversationId: sessionId,
    onDelta: ({ reply, conversationId }) => {
      if (conversationId) {
        saveSessionId(agent, conversationId)
      }

      set((state) => ({
        conversationId: conversationId || state.conversationId,
        messages: state.messages.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: reply, status: reply ? 'streaming' : 'loading' }
            : msg
        ),
      }))
    },
  })

  if (result.conversationId) {
    saveSessionId(agent, result.conversationId)
  }

  set((state) => ({
    conversationId: result.conversationId || state.conversationId,
    messages: state.messages.map((msg) =>
      msg.id === assistantId ? { ...msg, content: result.reply, status: 'done' } : msg
    ),
  }))
}

export function createChatStore(agent) {
  return create((set, get) => ({
    messages: [],
    conversationId: null,
    isLoading: false,
    isVoiceListening: false,
    error: null,
    draftText: '',

    setDraftText: (text) => set({ draftText: text }),

    setVoiceListening: (listening) => set({ isVoiceListening: listening }),

    clearError: () => set({ error: null }),

    resetConversation: () => {
      resetSessionId(agent)
      set({
        messages: [],
        conversationId: null,
        error: null,
        draftText: '',
        isLoading: false,
        isVoiceListening: false,
      })
    },

    sendMessage: async (content, options = {}) => {
      const displayText = (options.displayContent ?? content ?? get().draftText).trim()
      const apiText = (options.apiQuery ?? displayText).trim()
      if (!displayText || !apiText || get().isLoading || get().isVoiceListening) return

      const userId = nextId()
      const assistantId = nextId()
      const sessionId = get().conversationId || getSessionId(agent)
      const passageMessage = options.readingPassage
        ? {
            id: nextId(),
            role: 'assistant',
            kind: 'passage',
            passage: options.readingPassage,
            content: '',
            timestamp: Date.now(),
            status: 'done',
          }
        : null

      set((state) => ({
        error: null,
        draftText: content == null ? '' : state.draftText,
        isLoading: true,
        messages: [
          ...state.messages,
          {
            id: userId,
            role: 'user',
            content: displayText,
            apiQuery: apiText !== displayText ? apiText : undefined,
            timestamp: Date.now(),
            status: 'done',
          },
          ...(passageMessage ? [passageMessage] : []),
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            status: 'loading',
          },
        ],
      }))

      try {
        await requestAssistantReply({ agent, text: apiText, sessionId, assistantId, set, get })
      } catch (err) {
        const message = err instanceof Error ? err.message : '发送失败，请稍后重试'
        set((state) => ({
          error: message,
          messages: state.messages
            .map((msg) => {
              if (msg.id === userId) return { ...msg, status: 'failed' }
              if (msg.id === assistantId) return null
              return msg
            })
            .filter(Boolean),
        }))
      } finally {
        set({ isLoading: false })
      }
    },

    retryMessage: async (failedUserId) => {
      if (get().isLoading || get().isVoiceListening) return

      const failedMsg = get().messages.find((msg) => msg.id === failedUserId)
      if (!failedMsg || failedMsg.status !== 'failed') return

      const text = (failedMsg.apiQuery || failedMsg.content).trim()
      if (!text) return

      const assistantId = nextId()
      const sessionId = get().conversationId || getSessionId(agent)

      set((state) => ({
        error: null,
        isLoading: true,
        messages: [
          ...state.messages.map((msg) =>
            msg.id === failedUserId ? { ...msg, status: 'done' } : msg
          ),
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            status: 'loading',
          },
        ],
      }))

      try {
        await requestAssistantReply({ agent, text, sessionId, assistantId, set, get })
      } catch (err) {
        const message = err instanceof Error ? err.message : '重试失败，请稍后再试'
        set((state) => ({
          error: message,
          messages: state.messages
            .map((msg) => {
              if (msg.id === failedUserId) return { ...msg, status: 'failed' }
              if (msg.id === assistantId) return null
              return msg
            })
            .filter(Boolean),
        }))
      } finally {
        set({ isLoading: false })
      }
    },
  }))
}
