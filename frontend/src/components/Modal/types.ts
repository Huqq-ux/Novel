import type { ReactNode } from 'react'

export interface ModalProps {
  visible: boolean
  title?: string
  content?: ReactNode
  onClose: () => void
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  danger?: boolean
  footer?: ReactNode
  children?: ReactNode
}
