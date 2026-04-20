import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { List, Empty, Button, Dialog, Toast } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { bookshelfApi } from '../services/api'

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

export default function ReadingHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const [records, setRecords] = useState<ReadingRecord[]>([])
  const [loading, setLoading] = useState(true)

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
      Toast.show('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueReading = (bookId: number, chapterId: number) => {
    navigate(`/read/${bookId}/${chapterId}`, { state: { from: location.pathname } })
  }

  const handleDelete = async (e: React.MouseEvent, bookId: number, bookTitle: string) => {
    e.stopPropagation()
    const result = await Dialog.confirm({
      content: `确定要删除《${bookTitle}》的阅读记录吗？`,
    })
    if (result) {
      try {
        await bookshelfApi.removeFromBookshelf(bookId)
        setRecords(records.filter(r => r.bookId !== bookId))
        Toast.show('删除成功')
      } catch (error) {
        console.error('Failed to delete reading record:', error)
        Toast.show('删除失败')
      }
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
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div
          onClick={() => navigate('/user')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: '12px',
          }}
        >
          <LeftOutline fontSize={18} color="#fff" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          我的阅读
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      ) : records.length === 0 ? (
        <Empty description="暂无阅读记录" />
      ) : (
        <List>
          {records.map((record) => (
            <List.Item
              key={record.id}
              onClick={() => handleContinueReading(record.bookId, record.lastChapterId)}
              style={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <img
                  src={record.book?.cover || 'https://placehold.co/80x100/eee/999?text=Book'}
                  alt={record.book?.title}
                  style={{
                    width: '60px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {record.book?.title || '未知书籍'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    {record.book?.author || '未知作者'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    阅读进度: {formatProgress(record.progress)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                    最近阅读: {formatTime(record.lastReadTime)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      size="small" 
                      color="primary" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContinueReading(record.bookId, record.lastChapterId)
                      }}
                    >
                      继续阅读
                    </Button>
                    <Button 
                      size="small" 
                      color="danger"
                      fill="outline"
                      onClick={(e) => handleDelete(e, record.bookId, record.book?.title || '未知书籍')}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  )
}
