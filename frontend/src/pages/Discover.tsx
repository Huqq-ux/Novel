import { useState, useEffect } from 'react'
import { List, Card, Button, Grid, Tag, Input, SearchBar } from 'antd-mobile'
import { bookApi, aiApi } from '../services/api'
import type { Book } from '../types'
import { useNavigate, useLocation } from 'react-router-dom'

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
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        {(selectedCategory || selectedSort) && (
          <Button size="small" onClick={handleBack} style={{ marginRight: '12px' }}>
            ← 返回
          </Button>
        )}
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          {getTitle()}
        </h2>
      </div>

      {!selectedCategory && !selectedSort && (
        <>
          <SearchBar
            placeholder="搜索书名或作者"
            onSearch={(val) => navigate(`/search?keyword=${encodeURIComponent(val)}`)}
            onFocus={() => navigate('/search')}
            style={{ marginBottom: '12px' }}
          />

          <Card
            style={{
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
            }}
          >
            <div style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>AI智能推荐</span>
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
                告诉我你的阅读偏好，AI为你量身推荐好书
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  placeholder="如：推荐科幻小说、类似三体的书..."
                  value={aiInput}
                  onChange={setAiInput}
                  onEnterPress={handleAIRecommend}
                  style={{
                    flex: 1,
                    '--background': 'rgba(255,255,255,0.2)',
                    '--color': '#fff',
                    '--placeholder-color': 'rgba(255,255,255,0.7)',
                    '--border-radius': '8px',
                  } as any}
                />
                <Button
                  size="small"
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '8px',
                  }}
                  onClick={handleAIRecommend}
                  loading={aiLoading}
                >
                  推荐
                </Button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {['推荐科幻小说', '最近热门文学', '类似斗破苍穹', '适合睡前阅读'].map(q => (
                  <span
                    key={q}
                    onClick={() => { setAiInput(q) }}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.2)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {showAIRecommend && (
            <Card
              style={{
                marginBottom: '16px',
                borderLeft: '3px solid #764ba2',
                background: 'linear-gradient(135deg, #f9f7ff 0%, #fff 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>🤖</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#764ba2' }}>AI推荐结果</span>
              </div>
              {aiLoading ? (
                <div style={{ color: '#999', fontSize: '13px' }}>AI正在为您精选推荐...</div>
              ) : (
                <div style={{ fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: '#333' }}>
                  {aiAnswer}
                </div>
              )}
            </Card>
          )}

          <Card title="分类浏览" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{category.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{category.name}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="排行榜">
            <List>
              <List.Item
                onClick={() => handleRankClick('hot')}
                style={{ padding: '12px 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🔥 热门榜</span>
                  <span style={{ color: '#999' }}>查看更多 →</span>
                </div>
              </List.Item>
              <List.Item
                onClick={() => handleRankClick('new')}
                style={{ padding: '12px 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🆕 新书榜</span>
                  <span style={{ color: '#999' }}>查看更多 →</span>
                </div>
              </List.Item>
              <List.Item
                onClick={() => handleRankClick('rating')}
                style={{ padding: '12px 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⭐ 评分榜</span>
                  <span style={{ color: '#999' }}>查看更多 →</span>
                </div>
              </List.Item>
              <List.Item
                onClick={() => handleRankClick('finish')}
                style={{ padding: '12px 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✅ 完结榜</span>
                  <span style={{ color: '#999' }}>查看更多 →</span>
                </div>
              </List.Item>
            </List>
          </Card>
        </>
      )}

      {(selectedCategory || selectedSort) && (
        <div>
          {books.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              <div>暂无书籍数据</div>
            </div>
          ) : (
            <>
              <Grid columns={2} gap={12}>
                {books.map((book) => (
                  <Grid.Item key={book.id}>
                    <Card
                      onClick={() => navigate(`/book/${book.id}`, { state: { from: location.pathname } })}
                      style={{ padding: '8px' }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img
                          src={book.cover || 'https://placehold.co/150x200/eee/999?text=Book'}
                          alt={book.title}
                          style={{
                            width: '100%',
                            height: '160px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                        />
                        {book.isFinished && (
                          <Tag
                            color="success"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              fontSize: '10px',
                            }}
                          >
                            完结
                          </Tag>
                        )}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <div
                          className="text-ellipsis"
                          style={{ fontSize: '14px', fontWeight: 'bold' }}
                        >
                          {book.title}
                        </div>
                        <div
                          className="text-ellipsis"
                          style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}
                        >
                          {book.author}
                        </div>
                        <div
                          className="text-ellipsis-2"
                          style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}
                        >
                          {book.description}
                        </div>
                      </div>
                    </Card>
                  </Grid.Item>
                ))}
              </Grid>
              {hasMore && (
                <Button
                  block
                  color="primary"
                  onClick={loadMore}
                  loading={loading}
                  style={{ marginTop: '16px' }}
                >
                  {loading ? '加载中...' : '加载更多'}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
