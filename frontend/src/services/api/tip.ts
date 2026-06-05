import api from './client'

export const tipApi = {
  createTip: (data: { authorId: number; bookId: number; chapterId?: number; amount: number; message?: string }) => {
    return api.post('/tips', data)
  },

  getBookTips: (bookId: number) => {
    return api.get(`/tips/book/${bookId}`)
  },

  getReceivedTips: () => {
    return api.get('/tips/received')
  },
}
