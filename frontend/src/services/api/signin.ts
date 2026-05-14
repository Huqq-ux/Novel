import api from './client'

export const signInApi = {
  getStatus: () => {
    return api.get('/signin/status')
  },

  signIn: () => {
    return api.post('/signin/do')
  },
}
