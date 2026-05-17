import { useState, useRef, useCallback } from 'react'
import type { PullToRefreshProps } from './types'
import styles from './styles.module.css'

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - startY.current
    if (diff > 80 && !refreshing) {
      setRefreshing(true)
      try { await onRefresh() } finally { setRefreshing(false) }
    }
  }, [onRefresh, refreshing])

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {refreshing && (
        <div className={styles.indicator}>
          <span className={styles.spinner} />
          刷新中...
        </div>
      )}
      {children}
    </div>
  )
}
