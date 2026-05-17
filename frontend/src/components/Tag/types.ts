import type { ReactNode } from 'react'

export type TagColor = 'default' | 'primary' | 'accent' | 'danger' | 'warning' | 'info'

export interface TagProps {
  color?: TagColor
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}
