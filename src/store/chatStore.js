import { createChatStore } from '@/store/createChatStore'

export const useChatStore = createChatStore('writing')
export const useReadingChatStore = createChatStore('reading')
