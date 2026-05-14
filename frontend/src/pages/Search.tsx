import { useState, useEffect } from 'react'
import { SearchBar, Card, Button } from 'antd-mobile'
import { bookApi, aiApi } from '../services/api'
import type { Book } from '../types'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'

export default function Search() {
  const [keyword, setKeyword] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const handleSearch = async (value: string) => {
    if (!value.trim()) return
    setLoading(true)
    setShowAI(false)
    setAiAnswer('')
    try {
      const response: any = await bookApi.searchBooks(value)
      if (response && response.code === 200) {
        setBooks(response.data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAISearch = async () => {
    if (!keyword.trim() || aiLoading) return
    setAiLoading(true)
    setShowAI(true)
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0') || undefined
      const result = await aiApi.search(keyword, undefined, userId) as any
      setAiAnswer(result?.response || '抱歉，AI搜索暂时不可用。')
    } catch {
      setAiAnswer('抱歉，AI搜索暂时不可用，请稍后再试。')
    } finally {
      setAiLoading(false)
    }
  }

  const handleBookClick = (bookId: number) => {
    navigate(`/book/${bookId}`, { state: { from: location.pathname } })
  }

  useEffect(() => {
    const kw = searchParams.get('keyword')
    if (kw) {
      setKeyword(kw)
      handleSearch(kw)
    }
  }, [])

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div
          onClick={() => navigate(-1)}
          style={{
            fontSize: '20px',
            cursor: 'pointer',
            color: '#1677ff',
            flexShrink: 0,
            padding: '4px 2px',
          }}
        >
          ←
        </div>
        <SearchBar
          placeholder="搜索书名或作者"
          value={keyword}
          onChange={setKeyword}
          onSearch={handleSearch}
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button
          color="primary"
          size="small"
          loading={loading}
          onClick={() => handleSearch(keyword)}
          style={{ flex: 1 }}
        >
          搜索
        </Button>
        <Button
          size="small"
          loading={aiLoading}
          onClick={handleAISearch}
          style={{ flex: 1, borderColor: '#1677ff', color: '#1677ff' }}
        >
          ✨ AI智能搜索
        </Button>
      </div>

      {showAI && (
        <Card
          style={{
            marginBottom: '16px',
            borderLeft: '3px solid #1677ff',
            background: 'linear-gradient(135deg, #f0f5ff 0%, #fff 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>🤖</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1677ff' }}>AI搜索结果</span>
          </div>
          {aiLoading ? (
            <div style={{ color: '#999', fontSize: '13px' }}>AI正在为您搜索分析...</div>
          ) : (
            <div style={{ fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: '#333' }}>
              {aiAnswer}
            </div>
          )}
        </Card>
      )}

      <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#666' }}>
        📚 书籍搜索结果
      </div>

      {books.map((book) => (
        <Card
          key={book.id}
          onClick={() => handleBookClick(book.id)}
          style={{ marginBottom: '8px', padding: '8px' }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <img
              src={book.cover || 'https://placehold.co/80x100/eee/999?text=Book'}
              alt={book.title}
              style={{
                width: '60px',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>
                {book.title}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                {book.author}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as any,
                }}
              >
                {book.description}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {book.category} · {book.wordCount}字
              </div>
            </div>
          </div>
        </Card>
      ))}

      {books.length === 0 && !loading && keyword && !showAI && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
          <div>未找到相关书籍，试试AI智能搜索？</div>
          <Button
            size="small"
            onClick={handleAISearch}
            style={{ marginTop: '12px', borderColor: '#1677ff', color: '#1677ff' }}
          >
            ✨ AI智能搜索
          </Button>
        </div>
      )}
    </div>
  )
}
