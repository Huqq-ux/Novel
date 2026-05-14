import api from './client'

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
