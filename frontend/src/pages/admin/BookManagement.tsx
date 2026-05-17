import { useState, useEffect } from 'react'
import CustomToast from '../../components/Toast'
import { adminApi } from '../../services/api'

const Toast = {
  show: (msg: string) => CustomToast.show({ type: 'info', content: msg }),
}
const confirmDialog = (content: string, onConfirm: () => void) => {
  if (window.confirm(content)) onConfirm()
}

interface Book {
  id: number
  title: string
  author: string
  cover: string
  category: string
  status: number
  wordCount: number
  chapterCount: number
  readCount: number
  collectCount: number
  createTime: string
  updateTime: string
}

interface BookListResponse {
  list: Book[]
  total: number
  page: number
  pageSize: number
}

export default function BookManagement() {
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadBooks()
  }, [page, categoryFilter, statusFilter])

  const loadBooks = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (categoryFilter) params.category = categoryFilter
      if (statusFilter !== undefined) params.status = statusFilter

      const response: any = await adminApi.getBooks(params)
      if (response && response.code === 200) {
        const data: BookListResponse = response.data
        setBooks(data.list || [])
        setTotal(data.total || 0)
        
        const uniqueCategories = [...new Set((data.list || []).map((b: Book) => b.category).filter(Boolean))]
        setCategories(uniqueCategories as string[])
      }
    } catch (error) {
      console.error('Failed to load books:', error)
      Toast.show('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadBooks()
  }

  const handleToggleStatus = async (book: Book) => {
    const newStatus = book.status === 1 ? 0 : 1
    const action = newStatus === 0 ? '下架' : '上架'

    confirmDialog(`确定要${action}书籍 "${book.title}" 吗？`, async () => {
      try {
        const response: any = await adminApi.updateBookStatus(book.id, newStatus)
        if (response && response.code === 200) {
          Toast.show(`${action}成功`)
          loadBooks()
        } else {
          Toast.show(response?.message || '操作失败')
        }
      } catch (error: any) {
        Toast.show(error.response?.data?.message || '操作失败')
      }
    })
  }

  const handleDelete = async (book: Book) => {
    confirmDialog(`确定要删除书籍 "${book.title}" 吗？此操作不可恢复！`, async () => {
      try {
        const response: any = await adminApi.deleteBook(book.id)
        if (response && response.code === 200) {
          Toast.show('删除成功')
          loadBooks()
        } else {
          Toast.show(response?.message || '删除失败')
        }
      } catch (error: any) {
        Toast.show(error.response?.data?.message || '删除失败')
      }
    })
  }

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: 'var(--color-accent-light)',
            color: 'var(--color-accent)',
          }}
        >
          已上架
        </span>
      )
    }
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
        }}
      >
        已下架
      </span>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && books.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--color-text-tertiary)', marginTop: '16px' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-tertiary)"
              strokeWidth="2"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索书名或作者..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                width: '220px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter === undefined ? '' : statusFilter}
            onChange={(e) => {
              const val = e.target.value
              setStatusFilter(val === '' ? undefined : Number(val))
              setPage(1)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <option value="">全部状态</option>
            <option value="1">已上架</option>
            <option value="0">已下架</option>
          </select>

          <button
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            搜索
          </button>
        </div>

        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
          共 {total} 本书籍
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg)' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                书籍信息
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                分类
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                字数
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                章节
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                阅读
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                收藏
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                状态
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {books.length > 0 ? (
              books.map((book) => (
                <tr
                  key={book.id}
                  style={{
                    borderBottom: '1px solid var(--color-divider)',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '64px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-divider)',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {book.cover ? (
                          <img src={book.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-text-tertiary)',
                              fontSize: '20px',
                            }}
                          >
                            📖
                          </div>
                        )}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: '15px' }}>{book.title}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{book.category || '-'}</td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center' }}>
                    {formatNumber(book.wordCount || 0)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center' }}>
                    {book.chapterCount || 0}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: 'var(--color-primary)' }}>
                    {formatNumber(book.readCount || 0)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: 'var(--color-danger)' }}>
                    {formatNumber(book.collectCount || 0)}
                  </td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(book.status)}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleToggleStatus(book)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: book.status === 1 ? 'var(--color-danger-light)' : 'var(--color-accent-light)',
                          color: book.status === 1 ? 'var(--color-danger)' : 'var(--color-accent)',
                          border: `1px solid ${book.status === 1 ? 'var(--color-danger)' : 'var(--color-accent)'}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {book.status === 1 ? '下架' : '上架'}
                      </button>
                      <button
                        onClick={() => handleDelete(book)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'var(--color-card)',
                          color: 'var(--color-danger)',
                          border: '1px solid var(--color-danger)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="1.5"
                    style={{ margin: '0 auto 16px' }}
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <p style={{ margin: 0 }}>暂无书籍数据</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div
            style={{
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-divider)',
            }}
          >
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
              第 {page} / {totalPages} 页
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 12px',
                  backgroundColor: page === 1 ? 'var(--color-bg)' : 'var(--color-card)',
                  color: page === 1 ? 'var(--color-border)' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 12px',
                  backgroundColor: page === totalPages ? 'var(--color-bg)' : 'var(--color-primary)',
                  color: page === totalPages ? 'var(--color-border)' : 'var(--color-text-inverse)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
