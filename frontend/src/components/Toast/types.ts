export type ToastType = 'success' | 'error' | 'info' | 'loading'

export interface ToastOptions {
  type?: ToastType
  content: string
  duration?: number
}
