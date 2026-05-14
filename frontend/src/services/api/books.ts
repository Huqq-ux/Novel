import api from './client'

export const bookApi = {
  getBooks: (params?: { page?: number; size?: number; category?: string; sort?: string; priceType?: number }) => {
    return api.get('/books', { params })
  },

  getBookDetail: (id: number) => {
    return api.get(`/books/${id}`)
  },

  getChapters: (bookId: number) => {
    return api.get(`/books/${bookId}/chapters`)
  },

  getChapterContent: (bookId: number, chapterId: number) => {
    return api.get(`/books/${bookId}/chapters/${chapterId}`)
  },

  searchBooks: (keyword: string) => {
    return api.get('/books/search', { params: { keyword } })
  },

  getAllBooks: (params: { page?: number; pageSize?: number; keyword?: string; category?: string; status?: number }) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.pageSize) query.append('pageSize', params.pageSize.toString())
    if (params.keyword) query.append('keyword', params.keyword)
    if (params.category) query.append('category', params.category)
    if (params.status !== undefined) query.append('status', params.status.toString())
    return api.get(`/books?${query.toString()}`)
  },

  getBookById: (id: number) => {
    return api.get(`/books/${id}`)
  },
}
