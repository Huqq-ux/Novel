import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toast } from 'antd-mobile'
import { bookApi } from '../services/api'

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

export default function PaidBooks() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular')

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
      Toast.show('加载失败')
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)',
          padding: '16px',
          color: '#fff',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            onClick={() => navigate(-1)}
            style={{ fontSize: '24px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>付费书籍</div>
        </div>

        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          精选优质付费内容，开启精彩阅读之旅
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          padding: '12px 16px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid #eee',
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 16px',
              borderRadius: '16px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              background: activeCategory === cat ? '#ff9500' : '#f5f5f5',
              color: activeCategory === cat ? '#fff' : '#666',
              transition: 'all 0.2s',
            }}
          >
            {cat}
          </div>
        ))}
      </div>

      <div
        style={{
          background: '#fff',
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid #eee',
        }}
      >
        <span style={{ fontSize: '14px', color: '#666' }}>排序：</span>
        {[
          { key: 'popular', label: '最热门' },
          { key: 'newest', label: '最新上架' },
          { key: 'rating', label: '评分最高' },
        ].map((item) => (
          <div
            key={item.key}
            onClick={() => setSortBy(item.key as any)}
            style={{
              fontSize: '14px',
              cursor: 'pointer',
              color: sortBy === item.key ? '#ff9500' : '#666',
              fontWeight: sortBy === item.key ? 'bold' : 'normal',
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            加载中...
          </div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <div>暂无付费书籍</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => handleBookClick(book.id)}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '112px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  <img
                    src={book.cover || 'https://placehold.co/80x112/eee/999?text=Book'}
                    alt={book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: '#ff9500',
                      color: '#fff',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    付费
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {book.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      {book.author} · {book.category}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#666',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.5',
                      }}
                    >
                      {book.description || '暂无简介'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#999' }}>
                      <span>💰 前{book.freeChapterCount || 0}章免费</span>
                      <span>📖 {formatNumber(book.totalWords || 0)}字</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#ff9500' }}>⭐</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
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

      <div
        style={{
          background: '#fff',
          margin: '16px',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
          💡 付费书籍说明
        </div>
        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
          <div>• 付费书籍提供部分免费章节试读</div>
          <div>• 使用书币可解锁付费章节</div>
          <div>• 解锁后可永久阅读该章节</div>
          <div>• 书币可通过充值或每日签到获取</div>
        </div>
      </div>
    </div>
  )
}
