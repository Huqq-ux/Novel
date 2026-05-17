import type { SkeletonProps } from './types'
import styles from './styles.module.css'

export default function Skeleton({ type = 'text', width, height, count = 1, style }: SkeletonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${styles.skeleton} ${styles[type]}`}
          style={{ width, height, ...style }}
        />
      ))}
    </div>
  )
}
