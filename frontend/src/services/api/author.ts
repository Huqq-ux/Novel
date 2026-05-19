import api from './client'

export const authorApi = {
  getStatus: () => {
    return api.get('/author/status')
  },

  apply: (data: {
    realName: string
    phone: string
    email: string
    penName: string
    specialty: string
    workSamples: string[]
    introduction: string
  }) => {
    return api.post('/author/apply', data)
  },

  sendVerifyCode: (email: string) => {
    return api.post('/author/send-verify-code', { email })
  },

  verifyEmail: (code: string) => {
    return api.post('/author/verify-email', { code })
  },

  getMyApplication: () => {
    return api.get('/author/application')
  },

  getPendingApplications: () => {
    return api.get('/author/admin/applications/pending')
  },

  getAllApplications: () => {
    return api.get('/author/admin/applications')
  },

  getApplicationDetail: (id: number) => {
    return api.get(`/author/admin/applications/${id}`)
  },

  approveApplication: (id: number, comment?: string) => {
    return api.post(`/author/admin/applications/${id}/approve`, { comment })
  },

  rejectApplication: (id: number, comment?: string) => {
    return api.post(`/author/admin/applications/${id}/reject`, { comment })
  },
}

export const authorBookApi = {
  getMyBooks: (page: number = 1, pageSize: number = 10) => {
    return api.get(`/author/books?page=${page}&pageSize=${pageSize}`)
  },

  createBook: (data: {
    title: string
    category: string
    description: string
    cover?: string
    priceType?: number
    freeChapterCount?: number
  }) => {
    return api.post('/author/books', data)
  },

  updateBook: (bookId: number, data: {
    title?: string
    category?: string
    description?: string
    cover?: string
    priceType?: number
    freeChapterCount?: number
    isFinished?: boolean
  }) => {
    return api.put(`/author/books/${bookId}`, data)
  },

  getChapters: (bookId: number, page: number = 1, pageSize: number = 20) => {
    return api.get(`/author/books/${bookId}/chapters?page=${page}&pageSize=${pageSize}`)
  },

  addChapter: (bookId: number, data: {
    title: string
    content: string
    price?: number
    isFree?: number
  }) => {
    return api.post(`/author/books/${bookId}/chapters`, data)
  },

  updateChapter: (bookId: number, chapterId: number, data: {
    title?: string
    content?: string
    price?: number
    isFree?: number
  }) => {
    return api.put(`/author/books/${bookId}/chapters/${chapterId}`, data)
  },

  deleteChapter: (bookId: number, chapterId: number) => {
    return api.delete(`/author/books/${bookId}/chapters/${chapterId}`)
  },

  deleteBook: (bookId: number) => {
    return api.delete(`/author/books/${bookId}`)
  },

  getBookStats: (bookId: number) => {
    return api.get(`/author/books/${bookId}/stats`)
  },
}
