import { aiApiClient } from './client'

export const aiApi = {
  recommend: (message: string, sessionId?: string, userId?: number) => {
    return aiApiClient.post('/recommend', { message, session_id: sessionId, user_id: userId })
  },

  search: (message: string, sessionId?: string, userId?: number) => {
    return aiApiClient.post('/search', { message, session_id: sessionId, user_id: userId })
  },

  customerService: (message: string, sessionId?: string, userId?: number) => {
    return aiApiClient.post('/customer-service', { message, session_id: sessionId, user_id: userId })
  },

  clearSession: (sessionId: string) => {
    return aiApiClient.delete(`/session/${sessionId}`)
  },

  getSession: (sessionId: string) => {
    return aiApiClient.get(`/session/${sessionId}`)
  },
}
