import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Bookmark } from 'lucide-react'
import { bookApi, bookshelfApi, commentApi } from '../services/api'
import { useBookshelfStore } from '../store/bookshelf'
import type { Book, Chapter } from '../types'
import BookRating from '../components/BookRating'
import BookCover from '../components/BookCover'
import Toast from '../components/Toast'
import styles from './BookDetail.module.css'

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = useRef<string>(location.state?.from || '/')
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const { isInBookshelf, addToBookshelf, getLastChapterId, setBookshelf } = useBookshelfStore()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      bookshelfApi.getBookshelf().then((res: any) => {
        if (res?.code === 200 && res?.data) {
          setBookshelf(res.data)
        }
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (id) {
      loadBookDetail()
      loadChapters()
      loadCommentCount()
    }
  }, [id])

  const loadBookDetail = async () => {
    try {
      const response: any = await bookApi.getBookDetail(Number(id))
      if (response && response.code === 200) {
        setBook(response.data)
      }
    } catch (error) {
      console.error('Failed to load book detail:', error)
      Toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadChapters = async () => {
    try {
      const response: any = await bookApi.getChapters(Number(id))
      if (response && response.code === 200) {
        setChapters(response.data)
      }
    } catch (error) {
      console.error('Failed to load chapters:', error)
    }
  }

  const loadCommentCount = async () => {
    try {
      const response: any = await commentApi.getBookComments(Number(id))
      if (response && response.code === 200) {
        setCommentCount(response.data?.length || 0)
      }
    } catch (error) {
      console.error('Failed to load comment count:', error)
    }
  }

  const handleAddToBookshelf = async () => {
    if (!book) return
    try {
      const response: any = await bookshelfApi.addToBookshelf(book.id)
      if (response && response.code === 401) {
        Toast.info('请先登录')
        return
      }
      addToBookshelf({
        id: Date.now(),
        bookId: book.id,
        book,
        lastChapterId: chapters[0]?.id || 0,
        lastReadTime: new Date().toISOString(),
        progress: 0,
      })
      Toast.success('已加入书架')
    } catch (error: any) {
      console.error('Failed to add to bookshelf:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.info('请先登录')
      } else {
        Toast.error('添加失败')
      }
    }
  }

  const handleStartReading = () => {
    if (chapters.length > 0 && book) {
      const lastChapterId = getLastChapterId(book.id)
      const chapterId = lastChapterId || chapters[0].id
      navigate(`/read/${book.id}/${chapterId}`, { state: { from: fromPath.current } })
    }
  }

  const handleChapterClick = (chapterId: number) => {
    navigate(`/read/${book?.id}/${chapterId}`, { state: { from: fromPath.current } })
  }

  const handleViewComments = () => {
    navigate(`/book/${id}/comments`, { state: { from: fromPath.current } })
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div style={{
          width: 24, height: 24,
          border: '2px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      </div>
    )
  }

  if (!book) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>书籍不存在</div>
  }

  const description = book.description || ''
  const displayDesc = expanded ? description : description.slice(0, 120)
  const inShelf = isInBookshelf(book.id)

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div className={styles.hero}>
        <div className={styles.backBtn} onClick={() => navigate(fromPath.current)}>
          <ArrowLeft size={16} />
        </div>
        <div className={styles.cover}>
          <BookCover src={book.cover} alt={book.title} width="100px" height="140px" title={book.title} author={book.author} category={book.category} />
        </div>
        <div className={styles.title}>{book.title}</div>
        <div className={styles.author}>{book.author} · {book.category} · {book.totalWords || book.wordCount || 0}万字</div>
        <div className={styles.tags}>
          <span className={styles.heroTag}>⭐ {book.rating || '新书'}</span>
          {book.isFinished ? <span className={styles.heroTag}>已完结</span> : <span className={styles.heroTag}>连载中</span>}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.primaryAction} onClick={handleStartReading}>
          📖 {getLastChapterId(book.id) ? '继续阅读' : '开始阅读'}
        </button>
        {!inShelf && (
          <div className={styles.iconAction} onClick={handleAddToBookshelf}>
            <Bookmark size={20} color="var(--color-primary)" />
          </div>
        )}
        <div className={styles.iconAction} onClick={handleViewComments}>
          <MessageCircle size={20} color="var(--color-text-tertiary)" />
        </div>
      </div>

      {book.priceType === 1 && (
        <div className={styles.section}>
          <div className={styles.infoCard} style={{ marginBottom: '0', color: 'var(--color-primary-dark)' }}>
            💰 付费书籍 · 前{book.freeChapterCount || 0}章免费
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>作品简介</div>
          <div className={styles.infoContent}>
            {displayDesc}
            {description.length > 120 && (
              <span className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
                {expanded ? ' 收起' : '... 展开'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <BookRating bookId={book.id} />
      </div>

      <div className={styles.section}>
        <div className={styles.commentRow} onClick={handleViewComments}>
          <div className={styles.commentRowLeft}>
            <MessageCircle size={18} color="var(--color-primary)" />
            <span>读者评论</span>
          </div>
          <div className={styles.commentRowRight}>
            <span>{commentCount} 条</span>
            <span>&gt;</span>
          </div>
        </div>
      </div>

      {chapters.length > 0 && (
        <div className={styles.section}>
          <div className={styles.infoTitle} style={{ paddingLeft: 'var(--space-md)', marginBottom: '8px' }}>📋 目录</div>
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className={styles.chapterItem} onClick={() => handleChapterClick(chapter.id)}>
              <span className={styles.chapterTitle}>第{index + 1}章 {chapter.title}</span>
              <span className={styles.chapterMeta}>
                {book.priceType === 1 && (
                  chapter.isFree === 1 ? '免费' : `${chapter.price || 10}书币`
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
