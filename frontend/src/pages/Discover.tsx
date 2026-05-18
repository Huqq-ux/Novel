import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Bot, ArrowLeft, ChevronRight } from 'lucide-react'
import { bookApi, aiApi } from '../services/api'
import type { Book } from '../types'
import Button from '../components/Button'
import Card from '../components/Card'
import Tag from '../components/Tag'
import Input from '../components/Input'
import SearchBar from '../components/SearchBar'
import BookCover from '../components/BookCover'
import Empty from '../components/Empty'
import styles from './Discover.module.css'

export default function Discover() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSort, setSelectedSort] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const [showAIRecommend, setShowAIRecommend] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const categories = [
    { id: '技术', name: '技术', icon: '💻' },
    { id: '文学', name: '文学', icon: '📚' },
    { id: '科幻', name: '科幻', icon: '🚀' },
    { id: '悬疑', name: '悬疑', icon: '🔍' },
    { id: '奇幻', name: '奇幻', icon: '🧙' },
  ]

  const fetchBooks = async (pageNum: number, category: string | null, sort: string | null, append: boolean = false) => {
    if (loading) return
    setLoading(true)
    try {
      const params: any = { page: pageNum, size: 10 }
      if (category) {
        params.category = category
      }
      if (sort === 'hot') {
        params.sort = 'clickCount'
      } else if (sort === 'new') {
        params.sort = 'createTime'
      } else if (sort === 'rating') {
        params.sort = 'rating'
      } else if (sort === 'finish') {
        params.isFinished = true
      }

      const res: any = await bookApi.getBooks(params)
      if (res && res.code === 200 && res.data && res.data.records) {
        if (append) {
          setBooks(prev => [...prev, ...res.data.records])
        } else {
          setBooks(res.data.records)
        }
        setHasMore(res.data.records.length >= 10)
      }
    } catch (error) {
      console.error('Failed to load books:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchBooks(nextPage, selectedCategory, selectedSort, true)
  }

  useEffect(() => {
    if (selectedCategory || selectedSort) {
      setPage(1)
      setBooks([])
      fetchBooks(1, selectedCategory, selectedSort, false)
    }
  }, [selectedCategory, selectedSort])

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) return
    setSelectedCategory(categoryId)
    setSelectedSort(null)
  }

  const handleRankClick = (sortType: string) => {
    if (selectedSort === sortType) return
    setSelectedSort(sortType)
    setSelectedCategory(null)
  }

  const handleBack = () => {
    setSelectedCategory(null)
    setSelectedSort(null)
    setPage(1)
    setBooks([])
    setHasMore(true)
  }

  const handleAIRecommend = async () => {
    if ((!aiInput.trim() && !selectedCategory) || aiLoading) return
    setAiLoading(true)
    setShowAIRecommend(true)
    try {
      const userId = parseInt(localStorage.getItem('userId') || '0') || undefined
      const message = aiInput.trim() || `推荐${selectedCategory}类的小说`
      const result = await aiApi.recommend(message, undefined, userId) as any
      setAiAnswer(result?.response || '抱歉，AI推荐暂时不可用。')
    } catch {
      setAiAnswer('抱歉，AI推荐暂时不可用，请稍后再试。')
    } finally {
      setAiLoading(false)
    }
  }

  const getTitle = () => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory)
      return category ? `${category.name}分类` : '书籍列表'
    }
    if (selectedSort === 'hot') return '热门榜'
    if (selectedSort === 'new') return '新书榜'
    if (selectedSort === 'rating') return '评分榜'
    if (selectedSort === 'finish') return '完结榜'
    return '发现'
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        {(selectedCategory || selectedSort) && (
          <Button variant="text" size="sm" onClick={handleBack}>
            <ArrowLeft size={16} />
          </Button>
        )}
        <h2 className={styles.pageTitle}>
          {getTitle()}
        </h2>
      </div>

      {!selectedCategory && !selectedSort && (
        <>
          <div className={styles.searchWrap}>
            <SearchBar
              placeholder="搜索书名或作者"
              onSearch={(val) => navigate(`/search?keyword=${encodeURIComponent(val)}`)}
              onFocus={() => navigate('/search')}
            />
          </div>

          <Card className={styles.aiCard}>
            <div className={styles.aiCardInner}>
              <div className={styles.aiCardHeader}>
                <Sparkles size={20} />
                <span className={styles.aiCardTitle}>AI智能推荐</span>
              </div>
              <div className={styles.aiCardDesc}>
                告诉我你的阅读偏好，AI为你量身推荐好书
              </div>
              <div className={styles.aiInputRow}>
                <div className={styles.aiInput}>
                  <Input
                    placeholder="如：推荐科幻小说、类似三体的书..."
                    value={aiInput}
                    onChange={setAiInput}
                    onEnterPress={handleAIRecommend}
                    className={styles.aiInputField}
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className={styles.aiPromptBtn}
                  onClick={handleAIRecommend}
                  loading={aiLoading}
                >
                  推荐
                </Button>
              </div>
              <div className={styles.aiSuggestionChips}>
                {['推荐科幻小说', '最近热门文学', '类似斗破苍穹', '适合睡前阅读'].map(q => (
                  <span
                    key={q}
                    className={styles.aiSuggestionChip}
                    onClick={() => { setAiInput(q) }}
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {showAIRecommend && (
            <Card className={styles.aiResultCard} variant="flat">
              <div className={styles.aiResultHeader}>
                <Bot size={16} color="var(--color-primary)" />
                <span className={styles.aiResultTitle}>AI推荐结果</span>
              </div>
              {aiLoading ? (
                <div className={styles.aiResultLoading}>AI正在为您精选推荐...</div>
              ) : (
                <div className={styles.aiResultContent}>
                  {aiAnswer}
                </div>
              )}
            </Card>
          )}

          <Card title="分类浏览" className={styles.categoryCard}>
            <div className={styles.categoryGrid}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={styles.categoryItem}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className={styles.categoryIconWrap}>{category.icon}</div>
                  <div className={styles.categoryName}>{category.name}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="排行榜" className={styles.rankingCard}>
            <div
              className={styles.rankingItem}
              onClick={() => handleRankClick('hot')}
            >
              <div className={styles.rankingItemInner}>
                <span className={styles.rankingLabel}>
                  <span className={styles.rankingIcon}>🔥</span>
                  热门榜
                </span>
                <span className={styles.rankingArrow}>
                  查看更多 <ChevronRight size={14} />
                </span>
              </div>
            </div>
            <div
              className={styles.rankingItem}
              onClick={() => handleRankClick('new')}
            >
              <div className={styles.rankingItemInner}>
                <span className={styles.rankingLabel}>
                  <span className={styles.rankingIcon}>🆕</span>
                  新书榜
                </span>
                <span className={styles.rankingArrow}>
                  查看更多 <ChevronRight size={14} />
                </span>
              </div>
            </div>
            <div
              className={styles.rankingItem}
              onClick={() => handleRankClick('rating')}
            >
              <div className={styles.rankingItemInner}>
                <span className={styles.rankingLabel}>
                  <span className={styles.rankingIcon}>⭐</span>
                  评分榜
                </span>
                <span className={styles.rankingArrow}>
                  查看更多 <ChevronRight size={14} />
                </span>
              </div>
            </div>
            <div
              className={styles.rankingItem}
              onClick={() => handleRankClick('finish')}
            >
              <div className={styles.rankingItemInner}>
                <span className={styles.rankingLabel}>
                  <span className={styles.rankingIcon}>✅</span>
                  完结榜
                </span>
                <span className={styles.rankingArrow}>
                  查看更多 <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </Card>
        </>
      )}

      {(selectedCategory || selectedSort) && (
        <div>
          {books.length === 0 && !loading ? (
            <Empty
              icon="📚"
              description="暂无书籍数据"
            />
          ) : (
            <>
              <div className={styles.bookGrid}>
                {books.map((book) => (
                  <div
                    key={book.id}
                    className={styles.bookCard}
                    onClick={() => navigate(`/book/${book.id}`, { state: { from: location.pathname } })}
                  >
                    <div className={styles.bookCoverWrap}>
                      <BookCover
                        src={book.cover}
                        alt={book.title}
                        title={book.title}
                      />
                      {book.isFinished && (
                        <div className={styles.finishedBadge}>
                          <Tag color="accent">完结</Tag>
                        </div>
                      )}
                    </div>
                    <div className={styles.bookInfo}>
                      <div className={`${styles.bookTitle} text-ellipsis`}>
                        {book.title}
                      </div>
                      <div className={`${styles.bookAuthor} text-ellipsis`}>
                        {book.author}
                      </div>
                      <div className={`${styles.bookDesc} text-ellipsis-2`}>
                        {book.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className={styles.loadMore}>
                  <Button
                    variant="primary"
                    block
                    onClick={loadMore}
                    loading={loading}
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
