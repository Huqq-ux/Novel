import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BookCover from '../components/BookCover'
import Button from '../components/Button'
import Empty from '../components/Empty'
import Toast from '../components/Toast'
import styles from './MyFavorites.module.css'

interface Favorite {
  id: number
  bookId: number
  bookTitle: string
  bookCover: string
  author: string
  category: string
  addTime: string
}

export default function MyFavorites() {
  const navigate = useNavigate()
  const location = useLocation()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(false)
    setFavorites([
      { id: 1, bookId: 1, bookTitle: '斗破苍穹', bookCover: '', author: '天蚕土豆', category: '玄幻', addTime: '2024-01-15' },
      { id: 2, bookId: 2, bookTitle: '完美世界', bookCover: '', author: '辰东', category: '玄幻', addTime: '2024-01-10' },
      { id: 3, bookId: 3, bookTitle: '遮天', bookCover: '', author: '辰东', category: '玄幻', addTime: '2024-01-05' },
    ])
  }

  const handleRemove = (id: number) => {
    setFavorites(favorites.filter(f => f.id !== id))
    Toast.show({ content: '已取消收藏' })
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
        <div className={styles.loading}>加载中...</div>
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
                  src={item.bookCover}
                  alt={item.bookTitle}
                  width={60}
                  height={80}
                  title={item.bookTitle}
                />
              </div>
              <div className={styles.favoriteInfo}>
                <div className={styles.favoriteTitle}>
                  {item.bookTitle}
                </div>
                <div className={styles.favoriteAuthor}>
                  {item.author} - {item.category}
                </div>
                <div className={styles.favoriteDate}>
                  {'收藏于 ' + item.addTime}
                </div>
                <div className={styles.favoriteAction}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id) }}
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
