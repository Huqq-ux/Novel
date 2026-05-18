import { useState, useMemo } from 'react'
import type { BookCoverProps } from './types'
import { SIZE_MAP } from './types'
import { generateCoverSVG } from '@/utils/coverGenerator'
import styles from './styles.module.css'

export default function BookCover({
  src, alt = '', size, width, height, title, author, category, className = '', style,
}: BookCoverProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const dims = size ? SIZE_MAP[size] : null
  const w = width ?? dims?.width ?? '100%'
  const h = height ?? dims?.height ?? '160px'

  const fallbackSvg = useMemo(() => {
    if (title) {
      return generateCoverSVG({ title, author, category, width: 200, height: 280 })
    }
    return null
  }, [title, author, category])

  const showFallback = !src || error || !loaded

  return (
    <div className={`${styles.wrapper} ${className}`} style={{ width: w, height: h, ...style }}>
      {!error && src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${styles.image} ${loaded ? styles.loaded : styles.loading}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      {showFallback && (
        <div className={styles.fallback}>
          {fallbackSvg ? (
            <img src={fallbackSvg} alt={alt || title || ''} className={styles.fallbackSvg} />
          ) : (
            <span style={{ fontSize: '24px' }}>📖</span>
          )}
        </div>
      )}
    </div>
  )
}
