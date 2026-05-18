import { useState, useEffect } from 'react'
import CustomToast from '../../components/Toast'
import BookCover from '../../components/BookCover'
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
  priceType: number
  freeChapterCount: number
  totalWords: number
  chapterCount: number
  clickCount: number
  collectCount: number
  description: string
  createTime: string
}

interface BookListResponse {
  list: Book[]
  total: number
  page: number
  pageSize: number
}

const categories = ['玄幻', '仙侠', '都市', '历史', '科幻', '游戏', '悬疑', '言情', '其他']

export default function PaidBookManagement() {
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '玄幻',
    description: '',
    cover: '',
    freeChapterCount: 5,
    totalWords: 0,
  })

  useEffect(() => {
    loadBooks()
  }, [page, categoryFilter])

  const loadBooks = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize, priceType: 1 }
      if (keyword) params.keyword = keyword
      if (categoryFilter) params.category = categoryFilter

      const response: any = await adminApi.getBooks(params)
      if (response && response.code === 200) {
        const data: BookListResponse = response.data
        const paidBooks = (data.list || []).filter((b: Book) => b.priceType === 1)
        setBooks(paidBooks)
        setTotal(paidBooks.length)
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

  const handleAddBook = async () => {
    if (!formData.title.trim()) {
      Toast.show('请输入书名')
      return
    }
    if (!formData.author.trim()) {
      Toast.show('请输入作者')
      return
    }

    setLoading(true)
    try {
      const response: any = await adminApi.addPaidBook({
        ...formData,
        priceType: 1,
        status: 1,
      })
      if (response && response.code === 200) {
        Toast.show('添加成功')
        setShowAddModal(false)
        setFormData({
          title: '',
          author: '',
          category: '玄幻',
          description: '',
          cover: '',
          freeChapterCount: 5,
          totalWords: 0,
        })
        loadBooks()
      } else {
        Toast.show(response?.message || '添加失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '添加失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBook = async () => {
    if (!editingBook) return
    if (!formData.title.trim()) {
      Toast.show('请输入书名')
      return
    }

    setLoading(true)
    try {
      const response: any = await adminApi.updatePaidBook(editingBook.id, formData)
      if (response && response.code === 200) {
        Toast.show('更新成功')
        setEditingBook(null)
        loadBooks()
      } else {
        Toast.show(response?.message || '更新失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (book: Book) => {
    confirmDialog(`确定要删除付费书籍 "${book.title}" 吗？此操作不可恢复！`, async () => {
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

  const openEditModal = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category || '玄幻',
      description: book.description || '',
      cover: book.cover || '',
      freeChapterCount: book.freeChapterCount || 5,
      totalWords: book.totalWords || 0,
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
              placeholder="搜索付费书籍..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
            共 {total} 本付费书籍
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-warning)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>+</span> 添加付费书籍
          </button>
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
                免费章节
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                点击
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
                        <BookCover src={book.cover} alt={book.title} width={48} height={64} title={book.title} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {book.title}
                          <span style={{ fontSize: '11px', background: 'var(--color-warning-light)', color: 'var(--color-warning)', padding: '2px 6px', borderRadius: '4px' }}>付费</span>
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{book.category || '-'}</td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center' }}>
                    {formatNumber(book.totalWords || 0)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center' }}>
                    {book.chapterCount || 0}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: 'var(--color-accent)' }}>
                    前{book.freeChapterCount || 0}章
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: 'var(--color-primary)' }}>
                    {formatNumber(book.clickCount || 0)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: 'var(--color-danger)' }}>
                    {formatNumber(book.collectCount || 0)}
                  </td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(book.status)}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openEditModal(book)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          border: '1px solid var(--color-primary)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        编辑
                      </button>
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
                <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
                  <p style={{ margin: 0 }}>暂无付费书籍数据</p>
                  <p style={{ margin: '8px 0 0', fontSize: '12px' }}>点击右上角"添加付费书籍"按钮添加</p>
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

      {(showAddModal || editingBook) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowAddModal(false)
            setEditingBook(null)
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--color-divider)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                {editingBook ? '编辑付费书籍' : '添加付费书籍'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingBook(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  书名 <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入书名"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  作者 <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="请输入作者"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  封面图片URL
                </label>
                <input
                  type="text"
                  value={formData.cover}
                  onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                  placeholder="请输入封面图片URL"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  免费章节数
                </label>
                <input
                  type="number"
                  value={formData.freeChapterCount}
                  onChange={(e) => setFormData({ ...formData, freeChapterCount: parseInt(e.target.value) || 0 })}
                  placeholder="前几章免费"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  总字数
                </label>
                <input
                  type="number"
                  value={formData.totalWords}
                  onChange={(e) => setFormData({ ...formData, totalWords: parseInt(e.target.value) || 0 })}
                  placeholder="请输入总字数"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  简介
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入书籍简介"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingBook(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'var(--color-card)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={editingBook ? handleUpdateBook : handleAddBook}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'var(--color-warning)',
                    color: 'var(--color-text-inverse)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? '处理中...' : (editingBook ? '更新' : '添加')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
