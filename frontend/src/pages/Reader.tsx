import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { bookApi, bookshelfApi, unlockApi } from '../services/api'
import { useBookshelfStore } from '../store/bookshelf'
import type { Book, Chapter } from '../types'
import Button from '../components/Button'
import Toast from '../components/Toast'
import styles from './Reader.module.css'

interface UnlockStatus {
  needUnlock: boolean
  isFree: boolean
  price: number
  unlocked: boolean
}

export default function Reader() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = useRef<string>(location.state?.from || '/')
  const [book, setBook] = useState<Book | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize')
    if (saved) {
      const map: Record<string, number> = { small: 14, medium: 16, large: 20 }
      return map[saved] || 16
    }
    return 16
  })
  const [showToolbar, setShowToolbar] = useState(true)
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const { updateProgress, isInBookshelf, addToBookshelf } = useBookshelfStore()

  useEffect(() => {
    if (bookId && chapterId) {
      loadBookAndChapter()
      loadChapters()
    }
  }, [bookId, chapterId])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserBalance(user.coinBalance || 0)
    }
  }, [])

  const loadBookAndChapter = async () => {
    setLoading(true)
    try {
      const bookResponse: any = await bookApi.getBookDetail(Number(bookId))
      if (bookResponse && bookResponse.code === 200) {
        const bookData = bookResponse.data
        setBook(bookData)

        if (bookData.priceType === 1) {
          const unlockResponse: any = await unlockApi.getStatus(Number(bookId), Number(chapterId))
          if (unlockResponse?.code === 200) {
            const status = unlockResponse.data
            setUnlockStatus(status)

            if (status.needUnlock && !status.isFree) {
              setLoading(false)
              return
            }
          }
        }

        const chapterResponse: any = await bookApi.getChapterContent(Number(bookId), Number(chapterId))
        if (chapterResponse && chapterResponse.code === 200 && chapterResponse.data) {
          setChapter(chapterResponse.data)

          if (!isInBookshelf(Number(bookId))) {
            addToBookshelf({
              id: Date.now(),
              bookId: Number(bookId),
              book: bookData,
              lastChapterId: Number(chapterId),
              lastReadTime: new Date().toISOString(),
              progress: 0,
            })
          } else {
            updateProgress(Number(bookId), Number(chapterId))
          }

          try {
            await bookshelfApi.updateProgress(Number(bookId), Number(chapterId))
          } catch (apiError) {
            console.error('Failed to sync progress to server:', apiError)
          }
        } else {
          Toast.info('章节不存在')
        }
      }
    } catch (error) {
      console.error('Failed to load book/chapter:', error)
      Toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadChapters = async () => {
    try {
      const response: any = await bookApi.getChapters(Number(bookId))
      if (response && response.code === 200) {
        setChapters(response.data)
      }
    } catch (error) {
      console.error('Failed to load chapters:', error)
    }
  }

  const handleUnlock = async () => {
    if (!chapterId) return

    const token = localStorage.getItem('accessToken')
    if (!token) {
      Toast.info('请先登录')
      navigate('/user')
      return
    }

    if (userBalance < (unlockStatus?.price || 0)) {
      const goRecharge = window.confirm(
        `书币不足，当前余额 ${userBalance} 书币，需要 ${unlockStatus?.price} 书币。是否前往充值？`
      )
      if (goRecharge) {
        navigate('/recharge')
      }
      return
    }

    const confirmed = window.confirm(
      `确定花费 ${unlockStatus?.price} 书币解锁此章节吗？`
    )

    if (!confirmed) return

    setUnlocking(true)
    try {
      const response: any = await unlockApi.unlockChapter(Number(chapterId))
      if (response?.code === 200) {
        Toast.success('解锁成功')
        const newBalance = response.data?.remainingBalance || userBalance - (unlockStatus?.price || 0)
        setUserBalance(newBalance)

        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          user.coinBalance = newBalance
          localStorage.setItem('user', JSON.stringify(user))
        }

        setUnlockStatus({ needUnlock: false, isFree: unlockStatus!.isFree, price: unlockStatus!.price, unlocked: true })
        loadBookAndChapter()
      } else {
        Toast.error(response?.message || '解锁失败')
      }
    } catch (error: any) {
      Toast.error(error.response?.data?.message || '解锁失败')
    } finally {
      setUnlocking(false)
    }
  }

  const handlePrevChapter = () => {
    const currentIndex = chapters.findIndex((c) => c.id === Number(chapterId))
    if (currentIndex > 0) {
      setUnlockStatus(null)
      navigate(`/read/${bookId}/${chapters[currentIndex - 1].id}`, { state: { from: fromPath.current } })
    } else {
      Toast.info('已经是第一章了')
    }
  }

  const handleNextChapter = () => {
    const currentIndex = chapters.findIndex((c) => c.id === Number(chapterId))
    if (currentIndex < chapters.length - 1) {
      setUnlockStatus(null)
      navigate(`/read/${bookId}/${chapters[currentIndex + 1].id}`, { state: { from: fromPath.current } })
    } else {
      Toast.info('已经是最后一章了')
    }
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
  }

  const handleGoBack = () => {
    const result = window.confirm('确定要退出阅读吗？')
    if (result) {
      if (bookId && chapterId) {
        updateProgress(Number(bookId), Number(chapterId))
        bookshelfApi.updateProgress(Number(bookId), Number(chapterId))
      }
      navigate(`/book/${bookId}`, { state: { from: fromPath.current } })
    }
  }

  const toggleToolbar = () => {
    setShowToolbar((prev) => !prev)
  }

  const currentIndex = chapters.findIndex((c) => c.id === Number(chapterId))
  const progressPercent = chapters.length > 0 ? Math.round(((currentIndex + 1) / chapters.length) * 100) : 0

  if (loading) {
    return (
      <div className={styles.pageLoading}>
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

  if (unlockStatus?.needUnlock && !unlockStatus.isFree) {
    return (
      <div className={styles.unlockWall}>
        <div className={styles.unlockHeader}>
          <div onClick={handleGoBack} style={{ fontSize: '20px', cursor: 'pointer', marginRight: '12px' }}>
            <ArrowLeft size={20} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
            {book?.title}
          </div>
        </div>

        <div className={styles.unlockBody}>
          <div className={styles.unlockIcon}>🔒</div>
          <div className={styles.unlockTitle}>此章节为付费内容</div>
          <div className={styles.unlockDesc}>解锁后可阅读完整内容</div>

          <div className={styles.unlockInfo}>
            <div className={styles.unlockRow}>
              <span className={styles.unlockLabel}>章节价格</span>
              <span className={styles.unlockValue}>{unlockStatus.price} 书币</span>
            </div>
            <div className={styles.unlockRow}>
              <span className={styles.unlockLabel}>当前余额</span>
              <span style={{
                fontWeight: 'bold',
                color: userBalance >= unlockStatus.price ? 'var(--color-accent)' : 'var(--color-danger)',
              }}>
                {userBalance} 书币
              </span>
            </div>
          </div>

          <div className={styles.unlockBtn}>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={handleUnlock}
              loading={unlocking}
              disabled={unlocking}
            >
              {unlocking ? '解锁中...' : '立即解锁'}
            </Button>
          </div>

          <div className={styles.unlockBtn}>
            <Button variant="secondary" size="lg" block onClick={() => navigate('/recharge')}>
              充值书币
            </Button>
          </div>
        </div>

        <div className={styles.navFooter}>
          <Button variant="secondary" size="sm" onClick={handlePrevChapter}>
            上一章
          </Button>
          <Button variant="secondary" size="sm" onClick={handleNextChapter}>
            下一章
          </Button>
        </div>
      </div>
    )
  }

  if (!chapter) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>章节不存在</div>
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: '80px' }}>
      <div
        style={{
          opacity: showToolbar ? 1 : 0,
          transform: showToolbar ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <div className={styles.toolbar}>
          <span onClick={handleGoBack} style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            返回
          </span>
          <span className={styles.toolbarTitle}>{chapter.title}</span>
          <span style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>⚙</span>
        </div>
      </div>

      <div className={styles.content} onClick={toggleToolbar} style={{ fontSize: `${fontSize}px` }}>
        {chapter.content}
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>
      <div className={styles.progressText}>
        {currentIndex + 1} / {chapters.length} 章 · 已读 {progressPercent}%
      </div>

      <div className={styles.nav}>
        <button
          className={`${styles.navBtn} ${styles.prevBtn}`}
          onClick={handlePrevChapter}
          disabled={currentIndex === 0}
        >
          ← 上一章
        </button>
        <button
          className={`${styles.navBtn} ${styles.nextBtn}`}
          onClick={handleNextChapter}
          disabled={currentIndex >= chapters.length - 1}
        >
          下一章 →
        </button>
      </div>

      <div className={styles.settingsBar}>
        <button
          className={styles.fontSizeBtn}
          onClick={() => handleFontSizeChange(fontSize - 2)}
          disabled={fontSize <= 12}
        >
          A⁻
        </button>
        <span style={{ fontWeight: 600 }}>Aa</span>
        <button
          className={styles.fontSizeBtn}
          onClick={() => handleFontSizeChange(fontSize + 2)}
          disabled={fontSize >= 24}
        >
          A⁺
        </button>
        <span style={{ color: 'var(--color-border)' }}>|</span>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/book/${bookId}/comments`)}>💬 评论</span>
      </div>
    </div>
  )
}
