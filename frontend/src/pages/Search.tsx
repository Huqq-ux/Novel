import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, Sparkles, Bot, BookOpen } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import BookCover from '../components/BookCover'
import Empty from '../components/Empty'
import { bookApi } from '../services/api'
import type { Book } from '../types'
import styles from './Search.module.css'

export default function SearchPage() {
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
    setAiAnswer('')
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0') || undefined

      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: keyword, user_id: userId }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'token') {
              fullText += data.content
              setAiAnswer(fullText)
            } else if (data.type === 'error') {
              fullText = `抱歉，服务暂时不可用：${data.message}`
              setAiAnswer(fullText)
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }

      if (!fullText) {
        setAiAnswer('抱歉，AI搜索暂时不可用，请稍后再试。')
      }
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
    <div className={styles.page}>
      {/* Header: back button + search input */}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="返回"
        >
          <ArrowLeft size={18} />
        </button>
        <div className={styles.searchInputWrap}>
          <span className={styles.searchIcon}>
            <Search size={16} />
          </span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="搜索书名或作者"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(keyword)
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="sm"
          loading={loading}
          onClick={() => handleSearch(keyword)}
          block
        >
          搜索
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={aiLoading}
          onClick={handleAISearch}
          block
        >
          <span className={styles.aiBtn}>
            <Sparkles size={14} />
            AI智能搜索
          </span>
        </Button>
      </div>

      {/* AI Search Result Card */}
      {showAI && (
        <div className={styles.aiCard}>
          <div className={styles.aiCardHeader}>
            <Bot size={18} color="#c4a882" />
            <span className={styles.aiCardTitle}>AI搜索结果</span>
          </div>
          {aiLoading ? (
            <div className={styles.aiCardLoading}>AI正在为您搜索分析...</div>
          ) : (
            <div className={styles.aiCardContent}>{aiAnswer}</div>
          )}
        </div>
      )}

      {/* Book results section header */}
      <div className={styles.sectionHeader}>
        <BookOpen size={16} color="var(--color-text-secondary)" />
        <span className={styles.sectionTitle}>书籍搜索结果</span>
      </div>

      {/* Results list */}
      {books.map((book) => (
        <Card
          key={book.id}
          onClick={() => handleBookClick(book.id)}
          className={styles.resultItem}
        >
          <div className={styles.resultContent}>
            <div className={styles.resultCover}>
              <BookCover
                src={book.cover}
                alt={book.title}
                width="100%"
                height="100%"
                title={book.title}
              />
            </div>
            <div className={styles.resultInfo}>
              <div className={styles.resultTitle}>{book.title}</div>
              <div className={styles.resultAuthor}>{book.author}</div>
              <div className={styles.resultDesc}>{book.description}</div>
              <div className={styles.resultMeta}>
                {book.category} · {book.wordCount}字
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Empty state */}
      {books.length === 0 && !loading && keyword && !showAI && (
        <Empty
          icon="🔍"
          description="未找到相关书籍，试试AI智能搜索？"
          action={
            <Button variant="secondary" size="sm" onClick={handleAISearch}>
              <span className={styles.aiBtn}>
                <Sparkles size={14} />
                AI智能搜索
              </span>
            </Button>
          }
        />
      )}
    </div>
  )
}
