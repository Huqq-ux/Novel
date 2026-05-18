import api from './client'

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
    localStorage.removeItem('bookshelf-storage')
    return Promise.resolve()
  },
}
