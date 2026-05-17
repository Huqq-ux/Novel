import type { ReactNode } from 'react'

export interface InputProps {
  prefix?: ReactNode
  suffix?: ReactNode
  placeholder?: string
  value?: string
  defaultValue?: string
  clearable?: boolean
  error?: string | boolean
  maxLength?: number
  rows?: number
  type?: 'text' | 'password' | 'email'
  onChange?: (value: string) => void
  onEnterPress?: () => void
  onFocus?: () => void
  className?: string
  style?: React.CSSProperties
}
