import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { bookshelfApi } from '../services/api'
import Button from '../components/Button'
import Card from '../components/Card'
import BookCover from '../components/BookCover'
import Empty from '../components/Empty'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import styles from './ReadingHistory.module.css'

interface Book {
  id: number
  title: string
  author: string
  cover: string
  chapterCount: number
}

interface ReadingRecord {
  id: number
  userId: number
  bookId: number
  lastChapterId: number
  lastReadTime: string
  progress: number
  book: Book
}

/**
 * 阅读历史页面
 * 功能描述：展示用户的阅读历史记录，支持继续阅读和删除记录
 * 实现逻辑：通过 bookshelf API 获取书架数据作为阅读记录，按最近阅读时间排序展示，
 * 提供继续阅读跳转和确认删除功能
 */
export default function ReadingHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const [records, setRecords] = useState<ReadingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<ReadingRecord | null>(null)

  useEffect(() => {
    loadReadingHistory()
  }, [])

  const loadReadingHistory = async () => {
    try {
      setLoading(true)
      const response: any = await bookshelfApi.getBookshelf()
      if (response && response.code === 200 && Array.isArray(response.data)) {
        setRecords(response.data)
      }
    } catch (error) {
      console.error('Failed to load reading history:', error)
      Toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueReading = (bookId: number, chapterId: number) => {
    navigate(`/read/${bookId}/${chapterId}`, { state: { from: location.pathname } })
  }

  const handleDelete = (e: React.MouseEvent, record: ReadingRecord) => {
    e.stopPropagation()
    setDeleteTarget(record)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await bookshelfApi.removeFromBookshelf(deleteTarget.bookId)
      setRecords(records.filter(r => r.bookId !== deleteTarget.bookId))
      Toast.success('删除成功')
    } catch (error) {
      console.error('Failed to delete reading record:', error)
      Toast.error('删除失败')
    } finally {
      setDeleteTarget(null)
    }
  }

  const formatTime = (time: string) => {
    if (!time) return '未知'
    const date = new Date(time)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const formatProgress = (progress: number) => {
    if (!progress || progress <= 0) {
      return '0%'
    }
    return `${Math.min(progress, 100)}%`
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate('/user')}
          aria-label="返回"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.headerTitle}>我的阅读</h2>
      </div>

      {loading ? (
        <div className={styles.loadingState}>加载中...</div>
      ) : records.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty description="暂无阅读记录" />
        </div>
      ) : (
        <div className={styles.list}>
          {records.map((record) => (
            <Card
              key={record.id}
              variant="elevated"
              onClick={() => handleContinueReading(record.bookId, record.lastChapterId)}
            >
              <div className={styles.recordCard}>
                <div className={styles.coverWrap}>
                  <BookCover
                    src={record.book?.cover}
                    alt={record.book?.title}
                    width={60}
                    height={80}
                    title={record.book?.title}
                  />
                </div>
                <div className={styles.recordInfo}>
                  <div className={styles.bookTitle}>
                    {record.book?.title || '未知书籍'}
                  </div>
                  <div className={styles.bookAuthor}>
                    {record.book?.author || '未知作者'}
                  </div>
                  <div className={styles.progressBarWrap}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(record.progress || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className={styles.progressRow}>
                    阅读进度: {formatProgress(record.progress)}
                  </div>
                  <div className={styles.timeRow}>
                    最近阅读: {formatTime(record.lastReadTime)}
                  </div>
                  <div className={styles.actions}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContinueReading(record.bookId, record.lastChapterId)
                      }}
                    >
                      继续阅读
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      danger
                      onClick={(e) => handleDelete(e, record)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        visible={!!deleteTarget}
        title="确认删除"
        content={`确定要删除《${deleteTarget?.book?.title}》的阅读记录吗？`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmText="删除"
        danger
      />
    </div>
  )
}
