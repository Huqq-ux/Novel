import api from './client'

export const adminApi = {
  getUsers: (params: { page?: number; pageSize?: number; keyword?: string; role?: string; status?: number }) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.pageSize) query.append('pageSize', params.pageSize.toString())
    if (params.keyword) query.append('keyword', params.keyword)
    if (params.role) query.append('role', params.role)
    if (params.status !== undefined) query.append('status', params.status.toString())
    return api.get(`/admin/users?${query.toString()}`)
  },

  updateUserStatus: (id: number, status: number) => {
    return api.post(`/admin/users/${id}/status`, { status })
  },

  updateUserRole: (id: number, role: string) => {
    return api.post(`/admin/users/${id}/role`, { role })
  },

  getStats: () => {
    return api.get('/admin/stats')
  },

  updateBookStatus: (id: number, status: number) => {
    return api.post(`/admin/books/${id}/status`, { status })
  },

  deleteBook: (id: number) => {
    return api.delete(`/admin/books/${id}`)
  },

  getBooks: (params: { page?: number; pageSize?: number; keyword?: string; category?: string; status?: number; priceType?: number }) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.pageSize) query.append('pageSize', params.pageSize.toString())
    if (params.keyword) query.append('keyword', params.keyword)
    if (params.category) query.append('category', params.category)
    if (params.status !== undefined) query.append('status', params.status.toString())
    if (params.priceType !== undefined) query.append('priceType', params.priceType.toString())
    return api.get(`/admin/books?${query.toString()}`)
  },

  addPaidBook: (data: {
    title: string
    author: string
    category: string
    description: string
    cover?: string
    freeChapterCount?: number
    totalWords?: number
    priceType: number
    status: number
  }) => {
    return api.post('/admin/books/paid', data)
  },

  updatePaidBook: (id: number, data: {
    title?: string
    author?: string
    category?: string
    description?: string
    cover?: string
    freeChapterCount?: number
    totalWords?: number
  }) => {
    return api.put(`/admin/books/paid/${id}`, data)
  },
}

export const notificationApi = {
  getNotifications: (page: number = 1, pageSize: number = 20) => {
    return api.get(`/notifications?page=${page}&pageSize=${pageSize}`)
  },

  getUnreadCount: () => {
    return api.get('/notifications/unread-count')
  },

  markAsRead: (id: number) => {
    return api.post(`/notifications/${id}/read`)
  },

  markAllAsRead: () => {
    return api.post('/notifications/read-all')
  },
}
