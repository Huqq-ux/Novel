import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { bookApi } from '../services/api'
import Tag from '../components/Tag'
import BookCover from '../components/BookCover'
import Toast from '../components/Toast'
import styles from './PaidBooks.module.css'

interface Book {
  id: number
  title: string
  author: string
  cover: string
  category: string
  description: string
  priceType: number
  freeChapterCount: number
  totalWords: number
  chapterCount: number
  clickCount: number
  collectCount: number
  rating: number
  isFinished: boolean
  createTime?: string
}

const categories = ['全部', '玄幻', '仙侠', '都市', '历史', '科幻', '游戏', '悬疑', '言情', '其他']

type SortBy = 'popular' | 'newest' | 'rating'

/**
 * 付费书籍页面
 * 功能描述：展示平台所有付费书籍，支持分类筛选和多种排序方式
 * 实现逻辑：通过 API 获取书籍列表，前端按 priceType 过滤付费书籍，根据分类和排序条件重新整理后渲染
 */
export default function PaidBooks() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [sortBy, setSortBy] = useState<SortBy>('popular')

  useEffect(() => {
    loadPaidBooks()
  }, [activeCategory, sortBy])

  const loadPaidBooks = async () => {
    setLoading(true)
    try {
      const params: any = { priceType: 1 }
      if (activeCategory !== '全部') {
        params.category = activeCategory
      }

      const response: any = await bookApi.getBooks(params)
      if (response && response.code === 200) {
        const bookList = response.data?.records || response.data?.list || response.data || []
        let paidBooks = Array.isArray(bookList)
          ? bookList.filter((b: Book) => b.priceType === 1)
          : []

        if (sortBy === 'popular') {
          paidBooks.sort((a: Book, b: Book) => (b.clickCount || 0) - (a.clickCount || 0))
        } else if (sortBy === 'newest') {
          paidBooks.sort((a: Book, b: Book) => {
            const aTime = a.createTime ? new Date(a.createTime).getTime() : 0
            const bTime = b.createTime ? new Date(b.createTime).getTime() : 0
            return bTime - aTime
          })
        } else if (sortBy === 'rating') {
          paidBooks.sort((a: Book, b: Book) => (b.rating || 0) - (a.rating || 0))
        }

        setBooks(paidBooks)
      }
    } catch (error) {
      console.error('Failed to load paid books:', error)
      Toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  }

  const handleBookClick = (bookId: number) => {
    navigate(`/book/${bookId}`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroRow}>
          <button
            className={styles.heroBack}
            onClick={() => navigate(-1)}
            aria-label="返回"
          >
            <ArrowLeft size={24} />
          </button>
          <div className={styles.heroTitle}>付费书籍</div>
        </div>
        <div className={styles.heroDesc}>
          精选优质付费内容，开启精彩阅读之旅
        </div>
      </div>

      <div className={styles.categoryBar}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`${styles.pill} ${activeCategory === cat ? styles.pillActive : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.sortBar}>
        <span className={styles.sortLabel}>排序：</span>
        {([
          { key: 'popular' as SortBy, label: '最热门' },
          { key: 'newest' as SortBy, label: '最新上架' },
          { key: 'rating' as SortBy, label: '评分最高' },
        ]).map((item) => (
          <button
            key={item.key}
            onClick={() => setSortBy(item.key)}
            className={`${styles.sortOption} ${sortBy === item.key ? styles.sortOptionActive : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.listSection}>
        {loading ? (
          <div className={styles.loadingState}>
            加载中...
          </div>
        ) : books.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <div className={styles.emptyText}>暂无付费书籍</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {books.map((book) => (
              <div
                key={book.id}
                className={styles.bookCard}
                onClick={() => handleBookClick(book.id)}
              >
                <div className={styles.coverWrap}>
                  <BookCover
                    src={book.cover}
                    alt={book.title}
                    width={80}
                    height={112}
                    title={book.title}
                  />
                  <div className={styles.paidBadge}>
                    <Tag color="primary">付费</Tag>
                  </div>
                </div>

                <div className={styles.bookInfo}>
                  <div>
                    <div className={styles.bookTitle}>
                      {book.title}
                    </div>
                    <div className={styles.bookMeta}>
                      {book.author} · {book.category}
                    </div>
                    <div className={styles.bookDesc}>
                      {book.description || '暂无简介'}
                    </div>
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.statsLeft}>
                      <span>💰 前{book.freeChapterCount || 0}章免费</span>
                      <span>📖 {formatNumber(book.totalWords || 0)}字</span>
                    </div>
                    <div className={styles.rating}>
                      <Star size={12} className={styles.ratingIcon} fill="var(--color-primary)" />
                      <span className={styles.ratingValue}>
                        {book.rating ? book.rating.toFixed(1) : '8.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>
          💡 付费书籍说明
        </div>
        <div className={styles.infoList}>
          <div>• 付费书籍提供部分免费章节试读</div>
          <div>• 使用书币可解锁付费章节</div>
          <div>• 解锁后可永久阅读该章节</div>
          <div>• 书币可通过充值或每日签到获取</div>
        </div>
      </div>
    </div>
  )
}
