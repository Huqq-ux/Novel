export interface SkeletonProps {
  type?: 'text' | 'title' | 'card' | 'avatar' | 'rect'
  width?: string | number
  height?: string | number
  count?: number
  style?: React.CSSProperties
}
