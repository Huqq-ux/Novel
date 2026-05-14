import { useState, useEffect, useCallback } from 'react'
import { InfiniteScroll, Grid, Card, Tag, PullToRefresh, SearchBar } from 'antd-mobile'
import { bookApi } from '../services/api'
import type { Book } from '../types'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')
  const sort = searchParams.get('sort')

  const fetchBooks = useCallback(async (pageNum: number, categoryParam: string | null, sortParam: string | null, append: boolean = false) => {
    if (loading) return
    setLoading(true)
    try {
      const params: any = { page: pageNum, size: 10 }
      if (categoryParam) {
        params.category = categoryParam
      }
      if (sortParam === 'hot') {
        params.sort = 'clickCount'
      } else if (sortParam === 'new') {
        params.sort = 'createTime'
      } else if (sortParam === 'rating') {
        params.sort = 'rating'
      } else if (sortParam === 'finish') {
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
  }, [loading])

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchBooks(nextPage, category, sort, true)
  }, [page, category, sort, fetchBooks])

  const handleRefresh = async () => {
    setPage(1)
    setBooks([])
    setHasMore(true)
    await fetchBooks(1, category, sort, false)
  }

  useEffect(() => {
    setPage(1)
    setBooks([])
    setHasMore(true)
    fetchBooks(1, category, sort, false)
  }, [category, sort])

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <PullToRefresh onRefresh={handleRefresh}>
        <SearchBar
          placeholder="搜索书名或作者"
          onSearch={(val) => navigate(`/search?keyword=${encodeURIComponent(val)}`)}
          onFocus={() => navigate('/search')}
          style={{ marginBottom: '12px' }}
        />

        <div
          onClick={() => navigate('/paid-books')}
          style={{
            background: 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
              💰 付费书籍专区
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              精选优质付费内容，开启精彩阅读之旅
            </div>
          </div>
          <div style={{ fontSize: '24px' }}>→</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            {category ? `${category}分类` : '热门推荐'}
          </h2>
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
                      onClick={() => navigate(`/book/${book.id}`, { state: { from: location.pathname + location.search } })}
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
              <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
            </>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}
