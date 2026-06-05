import api from './client'

export const bookListApi = {
  getPublicLists: (params?: { page?: number; size?: number; sort?: string }) => {
    return api.get('/book-lists', { params })
  },

  getMyLists: () => {
    return api.get('/book-lists/my')
  },

  getList: (id: number) => {
    return api.get(`/book-lists/${id}`)
  },

  getItems: (listId: number) => {
    return api.get(`/book-lists/${listId}/items`)
  },

  createList: (data: { title: string; description?: string; cover?: string; isPublic?: boolean }) => {
    return api.post('/book-lists', data)
  },

  updateList: (id: number, data: { title?: string; description?: string; cover?: string; isPublic?: boolean }) => {
    return api.put(`/book-lists/${id}`, data)
  },

  deleteList: (id: number) => {
    return api.delete(`/book-lists/${id}`)
  },

  addItem: (listId: number, bookId: number) => {
    return api.post(`/book-lists/${listId}/items`, { bookId })
  },

  removeItem: (listId: number, itemId: number) => {
    return api.delete(`/book-lists/${listId}/items/${itemId}`)
  },
}
