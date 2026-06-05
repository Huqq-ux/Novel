import api from './client'

export const bookmarkApi = {
  getBookmarks: (bookId: number) => {
    return api.get('/bookmarks', { params: { bookId } })
  },

  checkBookmark: (bookId: number, chapterId: number) => {
    return api.get('/bookmarks/check', { params: { bookId, chapterId } })
  },

  addBookmark: (data: {
    bookId: number
    chapterId: number
    chapterTitle?: string
    position?: number
    note?: string
  }) => {
    return api.post('/bookmarks', data)
  },

  deleteBookmark: (id: number) => {
    return api.delete(`/bookmarks/${id}`)
  },
}
