import api from './client'

export const bookshelfApi = {
  getBookshelf: () => {
    return api.get('/bookshelf')
  },

  addToBookshelf: (bookId: number) => {
    return api.post('/bookshelf/add', { bookId })
  },

  removeFromBookshelf: (bookId: number) => {
    return api.delete(`/bookshelf/${bookId}`)
  },

  updateProgress: (bookId: number, chapterId: number) => {
    return api.put('/bookshelf/progress', { bookId, chapterId })
  },
}
