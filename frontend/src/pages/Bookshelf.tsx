import { useState, useEffect } from 'react'
import { useBookshelfStore } from '../store/bookshelf'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookshelfApi } from '../services/api'
import { Trash2 } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Tag from '../components/Tag'
import Empty from '../components/Empty'
import BookCover from '../components/BookCover'
import styles from './Bookshelf.module.css'

type FilterKey = 'all' | 'reading' | 'finished'

const FILTERS: { key: FilterKey; label: string; activeColor: 'primary' | 'accent' | 'default' }[] = [
  { key: 'all', label: '全部', activeColor: 'primary' },
  { key: 'reading', label: '阅读中', activeColor: 'primary' },
  { key: 'finished', label: '已读完', activeColor: 'accent' },
]

export default function Bookshelf() {
  const { bookshelf, removeFromBookshelf, setBookshelf } = useBookshelfStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    loadBookshelf()
  }, [])

  /**
   * 加载书架数据
   * 通过API获取用户的书架列表，并与本地数据合并
   */
  const loadBookshelf = async () => {
    try {
      const response: any = await bookshelfApi.getBookshelf()
      if (response && response.code === 200 && Array.isArray(response.data)) {
        const serverData = response.data
        setBookshelf(serverData.map((item: any) => ({
          ...item,
          progress: item.progress || 0,
          lastChapterId: item.lastChapterId || 0,
          lastReadTime: item.lastReadTime || new Date().toISOString(),
        })))
      }
    } catch (error) {
      console.error('Failed to load bookshelf:', error)
    }
  }

  /**
   * 从书架移除书籍
   * 根据书籍ID从后端API和本地状态中移除书籍
   * @param bookId - 要移除的书籍ID
   */
  const handleRemove = async (bookId: number) => {
    try {
      await bookshelfApi.removeFromBookshelf(bookId)
      removeFromBookshelf(bookId)
    } catch (error) {
      console.error('Failed to remove from bookshelf:', error)
    }
  }

  const formatProgress = (progress: number) => {
    if (!progress || progress <= 0) {
      return '0%'
    }
    return `${Math.min(progress, 100)}%`
  }

  /**
   * 格式化日期显示
   * 将ISO格式的日期字符串转换为中文本地化日期格式
   * @param dateString - ISO格式的日期字符串
   * @returns 中文本地化的日期字符串，如"2023/12/15"
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  const filteredBooks = bookshelf.filter((item) => {
    if (filter === 'all') return true
    const isFinished = item.progress >= 100
    if (filter === 'reading') return !isFinished
    return isFinished
  })

  return (
    <div className={styles.page}>
      <div className={styles.headerSection}>
        <div className={styles.header}>
          <h2 className={styles.title}>我的书架</h2>
          <span className={styles.count}>{bookshelf.length} 本</span>
        </div>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={styles.filterBtn}
              onClick={() => setFilter(f.key)}
            >
              <Tag color={filter === f.key ? f.activeColor : 'default'}>
                {f.label}
              </Tag>
            </button>
          ))}
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className={styles.empty}>
          <Empty
            description={
              bookshelf.length === 0 ? '书架空空如也' : '没有符合条件的书籍'
            }
            action={
              bookshelf.length === 0 ? (
                <Button variant="primary" size="sm" onClick={() => navigate('/discover')}>
                  去发现
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className={styles.list}>
          {filteredBooks.map((item) => {
            const isFinished = item.progress >= 100
            return (
              <Card
                key={item.id}
                variant="elevated"
                onClick={() =>
                  navigate(`/book/${item.bookId}`, {
                    state: { from: location.pathname },
                  })
                }
              >
                <div className={styles.itemInner}>
                  <div className={styles.itemCover}>
                    <BookCover
                      src={item.book?.cover}
                      alt={item.book?.title}
                      width={80}
                      height={100}
                      title={item.book?.title}
                    />
                  </div>
                  <div className={styles.itemInfo}>
                    <div className={styles.bookTitle}>{item.book?.title}</div>
                    <div className={styles.bookAuthor}>{item.book?.author}</div>
                    <div className={styles.progressSection}>
                      <div className={styles.progressBar}>
                        <div
                          className={`${styles.progressFill} ${
                            isFinished
                              ? styles.progressFinished
                              : styles.progressReading
                          }`}
                          style={{
                            width: `${Math.min(item.progress || 0, 100)}%`,
                          }}
                        />
                      </div>
                      <div className={styles.meta}>
                        <span className={styles.metaProgress}>
                          {formatProgress(item.progress)}
                        </span>
                        <span className={styles.metaDate}>
                          {item.lastReadTime
                            ? formatDate(item.lastReadTime)
                            : '未阅读'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.removeWrap}>
                    <Button
                      variant="text"
                      danger
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(item.bookId)
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
