import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BookCover from '../components/BookCover'
import Button from '../components/Button'
import Empty from '../components/Empty'
import Skeleton from '../components/Skeleton'
import Toast from '../components/Toast'
import { bookshelfApi } from '../services/api'
import type { BookshelfItem } from '../types'
import styles from './MyFavorites.module.css'

export default function MyFavorites() {
  const navigate = useNavigate()
  const location = useLocation()
  const [favorites, setFavorites] = useState<BookshelfItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const res: any = await bookshelfApi.getBookshelf()
      if (res?.code === 200 && res?.data) {
        setFavorites(res.data)
      }
    } catch {
      Toast.error('加载收藏失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (bookId: number) => {
    try {
      await bookshelfApi.removeFromBookshelf(bookId)
      setFavorites(favorites.filter(f => f.bookId !== bookId))
      Toast.success('已取消收藏')
    } catch {
      Toast.error('操作失败')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/user')}>
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.title}>
          我的收藏
        </h2>
      </div>

      {loading ? (
        <div className={styles.list}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.favoriteCard}>
              <Skeleton width={60} height={80} type="rect" />
              <div className={styles.favoriteInfo} style={{ flex: 1 }}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="40%" height={14} />
                <Skeleton width="30%" height={14} />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Empty
          description="暂无收藏"
        />
      ) : (
        <div className={styles.list}>
          {favorites.map((item) => (
            <div
              key={item.id}
              className={styles.favoriteCard}
              onClick={() => navigate(`/book/${item.bookId}`, { state: { from: location.pathname } })}
            >
              <div className={styles.coverWrap}>
                <BookCover
                  src={item.book?.cover || ''}
                  alt={item.book?.title || ''}
                  width={60}
                  height={80}
                  title={item.book?.title || ''}
                />
              </div>
              <div className={styles.favoriteInfo}>
                <div className={styles.favoriteTitle}>
                  {item.book?.title || '未知'}
                </div>
                <div className={styles.favoriteAuthor}>
                  {item.book?.author || '未知'} - {item.book?.category || '未知'}
                </div>
                <div className={styles.favoriteDate}>
                  最近阅读: {item.lastReadTime ? new Date(item.lastReadTime).toLocaleDateString('zh-CN') : '-'}
                </div>
                <div className={styles.favoriteAction}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.bookId) }}
                  >
                    取消收藏
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
