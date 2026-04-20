import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, Button, List, Toast } from 'antd-mobile'
import { LeftOutline, MessageOutline } from 'antd-mobile-icons'
import { bookApi, bookshelfApi, commentApi } from '../services/api'
import { useBookshelfStore } from '../store/bookshelf'
import type { Book, Chapter } from '../types'
import BookRating from '../components/BookRating'

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = useRef<string>(location.state?.from || '/')
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { isInBookshelf, addToBookshelf, getLastChapterId } = useBookshelfStore()

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
      Toast.show('加载失败')
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
        Toast.show('请先登录')
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
      Toast.show('已加入书架')
    } catch (error: any) {
      console.error('Failed to add to bookshelf:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.show('请先登录')
      } else {
        Toast.show('添加失败')
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
    return <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>
  }

  if (!book) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>书籍不存在</div>
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div
        onClick={() => navigate(fromPath.current)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <LeftOutline fontSize={18} color="#fff" />
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <img
            src={book.cover || 'https://placehold.co/120x160/eee/999?text=Book'}
            alt={book.title}
            style={{
              width: '120px',
              height: '160px',
              objectFit: 'cover',
              borderRadius: '4px',
            }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              {book.title}
            </h2>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              作者: {book.author}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              分类: {book.category}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              字数: {book.totalWords || book.wordCount || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              状态: {book.isFinished ? '已完结' : '连载中'}
            </div>
            {book.priceType === 1 && (
              <div style={{ fontSize: '14px', color: '#ff9500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>💰</span>
                <span>付费书籍 · 前{book.freeChapterCount || 0}章免费</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button color="primary" size="small" onClick={handleStartReading}>
                {getLastChapterId(book.id) ? '继续阅读' : '开始阅读'}
              </Button>
              {!isInBookshelf(book.id) && (
                <Button size="small" onClick={handleAddToBookshelf}>
                  加入书架
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="内容简介" style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
          {book.description}
        </p>
      </Card>

      <div style={{ marginBottom: '16px' }}>
        <BookRating bookId={book.id} />
      </div>

      <Card 
        style={{ marginBottom: '16px', cursor: 'pointer' }}
        onClick={handleViewComments}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageOutline fontSize={18} color="#1677ff" />
            <span style={{ fontSize: '15px', fontWeight: '500' }}>读者评论</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#999' }}>
            <span style={{ fontSize: '14px' }}>{commentCount} 条</span>
            <span style={{ fontSize: '12px' }}>&gt;</span>
          </div>
        </div>
      </Card>

      <Card title="目录">
        <List>
          {chapters.map((chapter, index) => (
            <List.Item
              key={chapter.id}
              onClick={() => handleChapterClick(chapter.id)}
              style={{ padding: '12px 0' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ fontSize: '14px' }}>
                  第{index + 1}章 {chapter.title}
                </div>
                {book.priceType === 1 && (
                  <div style={{ fontSize: '12px', color: chapter.isFree === 1 ? '#52c41a' : '#ff9500' }}>
                    {chapter.isFree === 1 ? '免费' : `${chapter.price || 10}书币`}
                  </div>
                )}
              </div>
            </List.Item>
          ))}
        </List>
      </Card>
    </div>
  )
}
