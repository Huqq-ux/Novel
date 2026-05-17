import { useEffect, useRef } from 'react'
import type { InfiniteScrollProps } from './types'
import styles from './styles.module.css'

export default function InfiniteScroll({ loadMore, hasMore, loading, children }: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || loading) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <>
      {children}
      <div ref={sentinelRef} className={styles.sentinel} />
      {loading && (
        <div className={styles.footer}>
          <div className={styles.spinner} />
        </div>
      )}
      {!hasMore && !loading && (
        <div className={styles.footer}>— 没有更多了 —</div>
      )}
    </>
  )
}
