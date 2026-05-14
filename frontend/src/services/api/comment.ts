import api from './client'

export const commentApi = {
  getMyComments: () => {
    return api.get('/comments/my')
  },

  getBookComments: (bookId: number) => {
    return api.get(`/comments/book/${bookId}`)
  },

  deleteComment: (id: number) => {
    return api.delete(`/comments/${id}`)
  },

  addComment: (bookId: number, content: string, parentId?: number) => {
    return api.post('/comments/add', { bookId, content, parentId })
  },

  toggleLike: (commentId: number) => {
    return api.post(`/comments/${commentId}/like`)
  },
}

export const ratingApi = {
  submitRating: (bookId: number, rating: number) => {
    return api.post(`/ratings/${bookId}`, { rating })
  },

  getUserRating: (bookId: number) => {
    return api.get(`/ratings/${bookId}/user`)
  },

  getRatingStats: (bookId: number) => {
    return api.get(`/ratings/${bookId}/stats`)
  },

  deleteRating: (bookId: number) => {
    return api.delete(`/ratings/${bookId}`)
  },
}
