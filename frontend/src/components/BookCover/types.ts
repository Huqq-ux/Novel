export interface BookCoverProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  width?: number | string
  height?: number | string
  title?: string
  author?: string
  category?: string
  className?: string
  style?: React.CSSProperties
}

export const SIZE_MAP: Record<string, { width: number; height: number }> = {
  sm: { width: 60, height: 80 },
  md: { width: 80, height: 112 },
  lg: { width: 100, height: 140 },
}
