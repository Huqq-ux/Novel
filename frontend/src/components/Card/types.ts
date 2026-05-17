import type { ReactNode, MouseEvent } from 'react'

export type CardVariant = 'elevated' | 'flat'

export interface CardProps {
  variant?: CardVariant
  cover?: ReactNode
  title?: string
  children?: ReactNode
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  className?: string
  style?: React.CSSProperties
}
