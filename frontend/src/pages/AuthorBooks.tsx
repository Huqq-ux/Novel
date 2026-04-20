import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Toast, Dialog, Tabs } from 'antd-mobile'
import { authorBookApi } from '../services/api'
import ImageUploader from '../components/ImageUploader'

interface Book {
  id: number
  title: string
  cover: string
  category: string
  status: number
  priceType: number
  chapterCount: number
  totalWords: number
  clickCount: number
  collectCount: number
  isFinished: boolean
  createTime: string
  updateTime: string
}

interface Chapter {
  id: number
  title: string
  orderNum: number
  wordCount: number
  price: number
  isFree: number
  createTime: string
}

const categories = [
  '玄幻', '仙侠', '都市', '历史', '科幻', '游戏', '悬疑', '言情', '其他'
]

export default function AuthorBooks() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    category: '玄幻',
    description: '',
    cover: '',
    priceType: 0,
    freeChapterCount: 0,
  })

  const [chapterForm, setChapterForm] = useState({
    title: '',
    content: '',
    price: 10,
    isFree: 1,
  })

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    setLoading(true)
    try {
      const response: any = await authorBookApi.getMyBooks()
      if (response?.code === 200) {
        setBooks(response.data?.list || [])
      }
    } catch (error) {
      console.error('Failed to load books:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadChapters = async (bookId: number) => {
    try {
      const response: any = await authorBookApi.getChapters(bookId)
      if (response?.code === 200) {
        setChapters(response.data?.list || [])
      }
    } catch (error) {
      console.error('Failed to load chapters:', error)
    }
  }

  const handleCreateBook = async () => {
    if (!formData.title.trim()) {
      Toast.show('请输入书名')
      return
    }

    setLoading(true)
    try {
      const response: any = await authorBookApi.createBook(formData)
      if (response?.code === 200) {
        Toast.show('创建成功')
        setShowCreateModal(false)
        setFormData({
          title: '',
          category: '玄幻',
          description: '',
          cover: '',
          priceType: 0,
          freeChapterCount: 0,
        })
        loadBooks()
      } else {
        Toast.show(response?.message || '创建失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBook = async (bookId: number, data: Partial<Book>) => {
    try {
      const response: any = await authorBookApi.updateBook(bookId, data)
      if (response?.code === 200) {
        Toast.show('更新成功')
        loadBooks()
      } else {
        Toast.show(response?.message || '更新失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '更新失败')
    }
  }

  const handleAddChapter = async () => {
    if (!currentBook) return
    if (!chapterForm.title.trim()) {
      Toast.show('请输入章节标题')
      return
    }
    if (!chapterForm.content.trim()) {
      Toast.show('请输入章节内容')
      return
    }

    setLoading(true)
    try {
      const response: any = await authorBookApi.addChapter(currentBook.id, chapterForm)
      if (response?.code === 200) {
        Toast.show('添加成功')
        setShowAddChapter(false)
        setChapterForm({ title: '', content: '', price: 10, isFree: 1 })
        loadChapters(currentBook.id)
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

  const handleUpdateChapter = async () => {
    if (!currentBook || !editingChapter) return

    setLoading(true)
    try {
      const response: any = await authorBookApi.updateChapter(
        currentBook.id,
        editingChapter.id,
        chapterForm
      )
      if (response?.code === 200) {
        Toast.show('更新成功')
        setEditingChapter(null)
        setChapterForm({ title: '', content: '', price: 10, isFree: 1 })
        loadChapters(currentBook.id)
      } else {
        Toast.show(response?.message || '更新失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChapter = async (chapterId: number) => {
    if (!currentBook) return

    const confirmed = await Dialog.confirm({
      content: '确定要删除这个章节吗？',
    })
    if (!confirmed) return

    try {
      const response: any = await authorBookApi.deleteChapter(currentBook.id, chapterId)
      if (response?.code === 200) {
        Toast.show('删除成功')
        loadChapters(currentBook.id)
        loadBooks()
      } else {
        Toast.show(response?.message || '删除失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '删除失败')
    }
  }

  const openChapterModal = (book: Book) => {
    setCurrentBook(book)
    loadChapters(book.id)
    setShowChapterModal(true)
  }

  const openEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setChapterForm({
      title: chapter.title,
      content: '',
      price: chapter.price || 10,
      isFree: chapter.isFree,
    })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #eee',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            onClick={() => navigate(-1)}
            style={{ fontSize: '24px', marginRight: '12px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>我的作品</div>
        </div>
        <Button
          size="small"
          color="primary"
          onClick={() => setShowCreateModal(true)}
        >
          新建作品
        </Button>
      </div>

      {books.length === 0 && !loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <div>暂无作品，点击右上角创建</div>
        </div>
      ) : (
        <div style={{ padding: '12px' }}>
          {books.map((book) => (
            <div
              key={book.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <img
                  src={book.cover || 'https://placehold.co/80x112/eee/999?text=封面'}
                  alt={book.title}
                  style={{
                    width: '80px',
                    height: '112px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '4px',
                    }}
                  >
                    {book.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    {book.category} · {book.chapterCount}章 · {book.totalWords || 0}字
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                    点击 {book.clickCount || 0} · 收藏 {book.collectCount || 0}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: book.priceType === 1 ? '#fff3e0' : '#e8f5e9',
                        color: book.priceType === 1 ? '#ff9800' : '#4caf50',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {book.priceType === 1 ? '付费' : '免费'}
                    </span>
                    <span
                      style={{
                        background: book.isFinished ? '#e3f2fd' : '#fce4ec',
                        color: book.isFinished ? '#2196f3' : '#e91e63',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {book.isFinished ? '已完结' : '连载中'}
                    </span>
                    <span
                      style={{
                        background: book.status === 1 ? '#e8f5e9' : '#ffebee',
                        color: book.status === 1 ? '#4caf50' : '#f44336',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {book.status === 1 ? '已上架' : '已下架'}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                <Button
                  size="small"
                  onClick={() => openChapterModal(book)}
                >
                  管理章节
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const newPriceType = book.priceType === 0 ? 1 : 0
                    handleUpdateBook(book.id, { priceType: newPriceType })
                  }}
                >
                  {book.priceType === 0 ? '设为付费' : '设为免费'}
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    handleUpdateBook(book.id, { isFinished: !book.isFinished })
                  }}
                >
                  {book.isFinished ? '设为连载' : '设为完结'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #eee',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              创建新作品
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  书名 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入书名"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  简介
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入简介"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  封面图片
                </label>
                <ImageUploader
                  value={formData.cover}
                  onChange={(url) => setFormData({ ...formData, cover: url })}
                  placeholder="点击上传封面图片"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  付费类型
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      checked={formData.priceType === 0}
                      onChange={() => setFormData({ ...formData, priceType: 0 })}
                    />
                    免费
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      checked={formData.priceType === 1}
                      onChange={() => setFormData({ ...formData, priceType: 1 })}
                    />
                    付费
                  </label>
                </div>
              </div>

              {formData.priceType === 1 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    免费章节数
                  </label>
                  <input
                    type="number"
                    value={formData.freeChapterCount}
                    onChange={(e) =>
                      setFormData({ ...formData, freeChapterCount: parseInt(e.target.value) || 0 })
                    }
                    placeholder="前几章免费"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  block
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </Button>
                <Button
                  block
                  color="primary"
                  onClick={handleCreateBook}
                  loading={loading}
                >
                  创建
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChapterModal && currentBook && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f5f5f5',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#fff',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #eee',
              zIndex: 100,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                onClick={() => {
                  setShowChapterModal(false)
                  setChapters([])
                  setCurrentBook(null)
                }}
                style={{ fontSize: '24px', marginRight: '12px', cursor: 'pointer' }}
              >
                ←
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {currentBook.title} - 章节管理
              </div>
            </div>
            <Button
              size="small"
              color="primary"
              onClick={() => setShowAddChapter(true)}
            >
              添加章节
            </Button>
          </div>

          {chapters.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#999',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <div>暂无章节，点击右上角添加</div>
            </div>
          ) : (
            <div style={{ padding: '12px' }}>
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      第{chapter.orderNum}章 {chapter.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {chapter.wordCount || 0}字
                      {currentBook.priceType === 1 && (
                        <span style={{ marginLeft: '8px' }}>
                          · {chapter.isFree === 1 ? '免费' : `${chapter.price || 10}书币`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      size="mini"
                      onClick={() => openEditChapter(chapter)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="mini"
                      color="danger"
                      onClick={() => handleDeleteChapter(chapter.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(showAddChapter || editingChapter) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#fff',
            zIndex: 1001,
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#fff',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #eee',
              zIndex: 100,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                onClick={() => {
                  setShowAddChapter(false)
                  setEditingChapter(null)
                  setChapterForm({ title: '', content: '', price: 10, isFree: 1 })
                }}
                style={{ fontSize: '24px', marginRight: '12px', cursor: 'pointer' }}
              >
                ←
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {editingChapter ? '编辑章节' : '添加章节'}
              </div>
            </div>
            <Button
              size="small"
              color="primary"
              onClick={editingChapter ? handleUpdateChapter : handleAddChapter}
              loading={loading}
            >
              保存
            </Button>
          </div>

          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                章节标题 *
              </label>
              <input
                type="text"
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                placeholder="请输入章节标题"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                章节内容 *
              </label>
              <textarea
                value={chapterForm.content}
                onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                placeholder="请输入章节内容"
                rows={15}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {currentBook?.priceType === 1 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    是否免费
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="radio"
                        checked={chapterForm.isFree === 1}
                        onChange={() => setChapterForm({ ...chapterForm, isFree: 1 })}
                      />
                      免费
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="radio"
                        checked={chapterForm.isFree === 0}
                        onChange={() => setChapterForm({ ...chapterForm, isFree: 0 })}
                      />
                      付费
                    </label>
                  </div>
                </div>

                {chapterForm.isFree === 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      章节价格（书币）
                    </label>
                    <input
                      type="number"
                      value={chapterForm.price}
                      onChange={(e) =>
                        setChapterForm({ ...chapterForm, price: parseInt(e.target.value) || 10 })
                      }
                      min="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
