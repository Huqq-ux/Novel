import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/user'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post('/api/auth/refresh', {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/user'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

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

export const userApi = {
  login: (username: string, password: string) => {
    return api.post('/auth/login', { username, password })
  },

  register: (username: string, password: string, email: string) => {
    return api.post('/auth/register', { username, password, email })
  },

  getUserInfo: () => {
    return api.get('/user/info')
  },

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken })
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    return Promise.resolve()
  },
}

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

export const signInApi = {
  getStatus: () => {
    return api.get('/signin/status')
  },

  signIn: () => {
    return api.post('/signin/do')
  },
}

export const coinApi = {
  getPackages: () => {
    return api.get('/coin/packages')
  },

  recharge: (packageId: number) => {
    return api.post('/coin/recharge', { packageId })
  },

  getBalance: () => {
    return api.get('/coin/balance')
  },

  getRecords: () => {
    return api.get('/coin/records')
  },
}

export const unlockApi = {
  getStatus: (bookId: number, chapterId: number) => {
    return api.get(`/unlock/status/${bookId}/${chapterId}`)
  },

  unlockChapter: (chapterId: number) => {
    return api.post(`/unlock/chapter/${chapterId}`)
  },

  getUnlockedChapters: (bookId: number) => {
    return api.get(`/unlock/list/${bookId}`)
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

  getBookStats: (bookId: number) => {
    return api.get(`/author/books/${bookId}/stats`)
  },
}

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

export const uploadApi = {
  uploadCover: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  deleteFile: (url: string) => {
    return api.delete('/upload', { params: { url } })
  },

  validateUrl: (url: string) => {
    return api.get('/upload/validate', { params: { url } })
  },
}

export default api
