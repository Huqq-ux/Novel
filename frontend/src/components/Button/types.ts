import type { ReactNode, MouseEvent } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'text'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  danger?: boolean
  loading?: boolean
  disabled?: boolean
  block?: boolean
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  className?: string
  style?: React.CSSProperties
}
