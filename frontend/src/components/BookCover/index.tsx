import { useState } from 'react'
import type { BookCoverProps } from './types'
import styles from './styles.module.css'

export default function BookCover({
  src, alt = '', width = '100%', height = '160px', className = '', style,
}: BookCoverProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className={`${styles.wrapper} ${className}`} style={{ width, height, ...style }}>
      {!error && src && (
        <img
          src={src}
          alt={alt}
          className={`${styles.image} ${loaded ? styles.loaded : styles.loading}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      {(!src || error || !loaded) && (
        <div className={styles.placeholder}>📖</div>
      )}
    </div>
  )
}
