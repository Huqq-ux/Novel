export interface RatingStats {
  average: number
  count: number
  distribution: Record<number, number>
}

export interface StarRatingProps {
  rating?: number
  stats?: RatingStats
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: 'sm' | 'md'
}
