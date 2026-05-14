import api from './client'

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
