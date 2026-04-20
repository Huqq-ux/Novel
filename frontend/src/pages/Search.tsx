import { useState } from 'react'
import { SearchBar, List, Card } from 'antd-mobile'
import { bookApi } from '../services/api'
import type { Book } from '../types'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Search() {
  const [keyword, setKeyword] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = async (value: string) => {
    if (!value.trim()) return
    setLoading(true)
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

  const handleBookClick = (bookId: number) => {
    navigate(`/book/${bookId}`, { state: { from: location.pathname } })
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <SearchBar
        placeholder="搜索书名或作者"
        value={keyword}
        onChange={setKeyword}
        onSearch={handleSearch}
        style={{ marginBottom: '16px' }}
      />
      <List>
        {books.map((book) => (
          <List.Item
            key={book.id}
            onClick={() => handleBookClick(book.id)}
            style={{ padding: '12px 0' }}
          >
            <Card
              style={{
                display: 'flex',
                flexDirection: 'row',
                padding: '8px',
                gap: '12px',
              }}
            >
              <img
                src={book.cover || 'https://placehold.co/80x100/eee/999?text=Book'}
                alt={book.title}
                style={{
                  width: '80px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {book.title}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {book.author}
                </div>
                <div
                  className="text-ellipsis-2"
                  style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}
                >
                  {book.description}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {book.category} · {book.wordCount}字
                </div>
              </div>
            </Card>
          </List.Item>
        ))}
      </List>
      {books.length === 0 && !loading && keyword && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无搜索结果
        </div>
      )}
    </div>
  )
}