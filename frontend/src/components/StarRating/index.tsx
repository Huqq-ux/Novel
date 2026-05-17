import { useState } from 'react'
import { Star } from 'lucide-react'
import type { StarRatingProps } from './types'
import styles from './styles.module.css'

export default function StarRating({
  rating = 0, stats, interactive = false, onChange, size = 'md',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const starSize = size === 'sm' ? 14 : 18
  const displayRating = hoverRating || rating

  return (
    <div className={styles.wrapper}>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= displayRating
          return (
            <button
              key={star}
              className={`${styles.starBtn} ${!interactive && styles.readOnly}`}
              disabled={!interactive}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
            >
              <Star
                size={starSize}
                fill={filled ? 'var(--color-primary)' : 'none'}
                color={filled ? 'var(--color-primary)' : 'var(--color-border)'}
              />
            </button>
          )
        })}
        {stats && (
          <>
            <span className={styles.avg}>{stats.average.toFixed(1)}</span>
            <span className={styles.count}>({stats.count})</span>
          </>
        )}
      </div>

      {stats?.distribution && (
        <div className={styles.bars}>
          {[5, 4, 3, 2, 1].map(star => {
            const pct = stats.count > 0
              ? (stats.distribution[star] || 0) / stats.count * 100
              : 0
            return (
              <div key={star} className={styles.barRow}>
                <span className={styles.barLabel}>{star}★</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
