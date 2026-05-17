import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { bookApi } from '../services/api'
import type { Book } from '../types'
import SearchBar from '../components/SearchBar'
import BookCover from '../components/BookCover'
import InfiniteScroll from '../components/InfiniteScroll'
import PullToRefresh from '../components/PullToRefresh'
import styles from './Home.module.css'

const CATEGORIES = [
  { id: '科幻', name: '科幻', icon: '🚀' },
  { id: '文学', name: '文学', icon: '📚' },
  { id: '悬疑', name: '悬疑', icon: '🔍' },
  { id: '奇幻', name: '奇幻', icon: '🧙' },
  { id: '言情', name: '言情', icon: '💕' },
]

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')
  const sort = searchParams.get('sort')

  const fetchBooks = useCallback(async (pageNum: number, cat: string | null, s: string | null, append: boolean) => {
    if (loading) return
    setLoading(true)
    try {
      const params: any = { page: pageNum, size: 10 }
      if (cat) params.category = cat
      if (s === 'hot') params.sort = 'clickCount'
      else if (s === 'new') params.sort = 'createTime'
      else if (s === 'rating') params.sort = 'rating'
      else if (s === 'finish') params.isFinished = true

      const res: any = await bookApi.getBooks(params)
      if (res?.code === 200 && res.data?.records) {
        setBooks(prev => append ? [...prev, ...res.data.records] : res.data.records)
        setHasMore(res.data.records.length >= 10)
      }
    } catch (error) {
      console.error('Failed to load books:', error)
    } finally {
      setLoading(false)
    }
  }, [loading])

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchBooks(nextPage, category, sort, true)
  }, [page, category, sort, fetchBooks])

  const handleRefresh = async () => {
    setPage(1)
    await fetchBooks(1, category, sort, false)
  }

  useEffect(() => {
    setPage(1)
    setBooks([])
    setHasMore(true)
    fetchBooks(1, category, sort, false)
  }, [category, sort])

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <h1>梧桐书院</h1>
            <p>好书如挚友，终身不相忘</p>
          </div>
          <div className={styles.notifyBtn} onClick={() => navigate('/notifications')}>
            <Bell size={18} color="var(--color-text-tertiary)" />
            <span className={styles.notifyDot} />
          </div>
        </div>

        <div className={styles.searchWrap}>
          <SearchBar
            onSearch={val => navigate(`/search?keyword=${encodeURIComponent(val)}`)}
            onFocus={() => navigate('/search')}
          />
        </div>

        <div className={styles.heroBanner} onClick={() => navigate('/paid-books')}>
          <div className={styles.heroBadge}>Editor's Pick · 今日推荐</div>
          <div className={styles.heroTitle}>精选付费书籍专区</div>
          <div className={styles.heroDesc}>精选优质付费内容，开启精彩阅读之旅</div>
          <div className={styles.heroAction}>立即探索 →</div>
        </div>

        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>分类浏览</span>
          <span className={styles.sectionMore}>全部 →</span>
        </div>
        <div className={styles.categories}>
          {CATEGORIES.map(cat => (
            <div key={cat.id} className={styles.categoryItem}
              onClick={() => navigate(`/home?category=${cat.id}`)}>
              <div className={styles.categoryIcon}>{cat.icon}</div>
              <div className={styles.categoryName}>{cat.name}</div>
            </div>
          ))}
        </div>

        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            {category ? `${category}分类` : '🔥 热门推荐'}
          </span>
        </div>

        {books.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-placeholder)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
            <div>暂无书籍数据</div>
          </div>
        ) : (
          <InfiniteScroll loadMore={loadMore} hasMore={hasMore} loading={loading}>
            <div className={styles.bookGrid}>
              {books.map(book => (
                <div
                  key={book.id}
                  className={styles.bookCard}
                  onClick={() => navigate(`/book/${book.id}`, { state: { from: location.pathname + location.search } })}
                >
                  <div className={styles.bookCoverWrap}>
                    <BookCover src={book.cover} alt={book.title} height="130px" />
                    {book.isFinished && <span className={styles.finishedBadge}>完结</span>}
                  </div>
                  <div className={styles.bookInfo}>
                    <div className={`${styles.bookTitle} text-ellipsis`}>{book.title}</div>
                    <div className={`${styles.bookAuthor} text-ellipsis`}>{book.author}</div>
                    <div className={styles.bookMeta}>⭐ {book.rating || '新书'}</div>
                  </div>
                </div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </PullToRefresh>
  )
}
