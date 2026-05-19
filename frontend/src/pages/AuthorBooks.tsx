import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, Sparkles } from 'lucide-react'
import { authorBookApi, aiApi, uploadApi } from '../services/api'
import ImageUploader from '../components/ImageUploader'
import BookCover from '../components/BookCover'
import Button from '../components/Button'
import Tag from '../components/Tag'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import styles from './AuthorBooks.module.css'

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

  // Delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null)

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

  const [generating, setGenerating] = useState(false)
  const aiCoverBlobRef = useRef<Blob | null>(null)

  const handleGenerateCover = async () => {
    if (!formData.title.trim()) {
      Toast.info('请先输入书名')
      return
    }
    setGenerating(true)
    try {
      const blob = await aiApi.generateCover({
        title: formData.title,
        category: formData.category,
        description: formData.description,
      })
      aiCoverBlobRef.current = blob
      const file = new File([blob], `ai-cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const response: any = await uploadApi.uploadCover(file)
      if (response?.code === 200 && response?.data?.url) {
        setFormData(prev => ({ ...prev, cover: response.data.url }))
        Toast.success('AI 封面已生成并应用')
      } else {
        Toast.error('封面上传失败')
      }
    } catch (e: any) {
      Toast.error('封面生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

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
      Toast.show({ content: '请输入书名' })
      return
    }

    setLoading(true)
    try {
      const response: any = await authorBookApi.createBook(formData)
      if (response?.code === 200) {
        Toast.success('创建成功')
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
        Toast.show({ content: response?.message || '创建失败' })
      }
    } catch (error: any) {
      Toast.show({ content: error.response?.data?.message || '创建失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBook = async (bookId: number, data: Partial<Book>) => {
    try {
      const response: any = await authorBookApi.updateBook(bookId, data)
      if (response?.code === 200) {
        Toast.success('更新成功')
        loadBooks()
      } else {
        Toast.show({ content: response?.message || '更新失败' })
      }
    } catch (error: any) {
      Toast.show({ content: error.response?.data?.message || '更新失败' })
    }
  }

  const handleAddChapter = async () => {
    if (!currentBook) return
    if (!chapterForm.title.trim()) {
      Toast.show({ content: '请输入章节标题' })
      return
    }
    if (!chapterForm.content.trim()) {
      Toast.show({ content: '请输入章节内容' })
      return
    }

    setLoading(true)
    try {
      const response: any = await authorBookApi.addChapter(currentBook.id, chapterForm)
      if (response?.code === 200) {
        Toast.success('添加成功')
        setShowAddChapter(false)
        setChapterForm({ title: '', content: '', price: 10, isFree: 1 })
        loadChapters(currentBook.id)
        loadBooks()
      } else {
        Toast.show({ content: response?.message || '添加失败' })
      }
    } catch (error: any) {
      Toast.show({ content: error.response?.data?.message || '添加失败' })
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
        Toast.success('更新成功')
        setEditingChapter(null)
        setChapterForm({ title: '', content: '', price: 10, isFree: 1 })
        loadChapters(currentBook.id)
      } else {
        Toast.show({ content: response?.message || '更新失败' })
      }
    } catch (error: any) {
      Toast.show({ content: error.response?.data?.message || '更新失败' })
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteBook = async () => {
    if (deleteBookId === null) return

    try {
      const response: any = await authorBookApi.deleteBook(deleteBookId)
      if (response?.code === 200) {
        Toast.success('删除成功')
        loadBooks()
      } else {
        Toast.show({ content: response?.message || '删除失败' })
      }
    } catch (error: any) {
      Toast.show({ content: error.response?.data?.message || '删除失败' })
    } finally {
      setDeleteBookId(null)
    }
  }

  const confirmDeleteChapter = async () => {
    if (!currentBook || deleteTargetId === null) return

    try {
      const response: any = await authorBookApi.deleteChapter(currentBook.id, deleteTargetId)
      if (response?.code === 200) {
        Toast.success('删除成功')
        loadChapters(currentBook.id)
        loadBooks()
      } else {
        Toast.show({ content: response?.message || '删除失败' })
      }
    } catch (error: any) {
      Toast.show({ content: error.response?.data?.message || '删除失败' })
    } finally {
      setDeleteTargetId(null)
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

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className={styles.headerTitle}>我的作品</div>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          新建作品
        </Button>
      </div>

      {books.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <BookOpen size={48} />
          </div>
          <div className={styles.emptyText}>暂无作品，点击右上角创建</div>
        </div>
      ) : (
        <div className={styles.list}>
          {books.map((book) => (
            <div key={book.id} className={styles.bookCard}>
              <div className={styles.bookCardInner}>
                <BookCover src={book.cover} alt={book.title} width={80} height={112} title={book.title} />
                <div className={styles.bookInfo}>
                  <div className={styles.bookTitle}>
                    {book.title}
                  </div>
                  <div className={styles.bookMeta}>
                    {book.category} - {book.chapterCount}章 - {book.totalWords || 0}字
                  </div>
                  <div className={styles.bookStats}>
                    点击 {book.clickCount || 0} - 收藏 {book.collectCount || 0}
                  </div>
                  <div className={styles.tags}>
                    <Tag color={book.priceType === 1 ? 'warning' : 'accent'}>
                      {book.priceType === 1 ? '付费' : '免费'}
                    </Tag>
                    <Tag color={book.isFinished ? 'accent' : 'warning'}>
                      {book.isFinished ? '已完结' : '连载中'}
                    </Tag>
                    <Tag color={book.status === 1 ? 'accent' : 'danger'}>
                      {book.status === 1 ? '已上架' : '已下架'}
                    </Tag>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openChapterModal(book)}
                >
                  管理章节
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const newPriceType = book.priceType === 0 ? 1 : 0
                    handleUpdateBook(book.id, { priceType: newPriceType } as any)
                  }}
                >
                  {book.priceType === 0 ? '设为付费' : '设为免费'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    handleUpdateBook(book.id, { isFinished: !book.isFinished } as any)
                  }}
                >
                  {book.isFinished ? '设为连载' : '设为完结'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  danger
                  onClick={() => setDeleteBookId(book.id)}
                >
                  删除作品
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create book modal */}
      {showCreateModal && (
        <div className={styles.overlay} onClick={() => {
          setShowCreateModal(false)
        }}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              创建新作品
            </div>
            <div className={styles.dialogBody}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>书名 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入书名"
                  className={styles.formNative}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`${styles.formNative} ${styles.select}`}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>简介</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入简介"
                  rows={4}
                  className={`${styles.formNative} ${styles.textarea}`}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>封面图片</label>
                <ImageUploader
                  value={formData.cover}
                  onChange={(url) => setFormData({ ...formData, cover: url })}
                  placeholder="点击上传封面图片"
                />
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={generating}
                    onClick={handleGenerateCover}
                  >
                    <Sparkles size={14} style={{ marginRight: '4px' }} />
                    AI 生成封面
                  </Button>
                  {generating && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginLeft: '8px' }}>
                      生成中...
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>付费类型</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={formData.priceType === 0}
                      onChange={() => setFormData({ ...formData, priceType: 0 })}
                    />
                    免费
                  </label>
                  <label className={styles.radioLabel}>
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
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>免费章节数</label>
                  <input
                    type="number"
                    value={formData.freeChapterCount}
                    onChange={(e) =>
                      setFormData({ ...formData, freeChapterCount: parseInt(e.target.value) || 0 })
                    }
                    placeholder="前几章免费"
                    min="0"
                    className={styles.formNative}
                  />
                </div>
              )}

              <div className={styles.formActions}>
                <Button
                  block
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                  }}
                >
                  取消
                </Button>
                <Button
                  block
                  variant="primary"
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

      {/* Chapter management modal (fullscreen) */}
      {showChapterModal && currentBook && (
        <div className={styles.overlayFull}>
          <div className={styles.headerBar}>
            <div className={styles.headerLeft}>
              <button
                className={styles.backBtn}
                onClick={() => {
                  setShowChapterModal(false)
                  setChapters([])
                  setCurrentBook(null)
                }}
              >
                <ArrowLeft size={24} />
              </button>
              <div className={styles.headerTitle}>
                {currentBook.title} - 章节管理
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowAddChapter(true)}
            >
              添加章节
            </Button>
          </div>

          {chapters.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <FileText size={48} />
              </div>
              <div className={styles.emptyText}>暂无章节，点击右上角添加</div>
            </div>
          ) : (
            <div className={styles.chapterList}>
              {chapters.map((chapter) => (
                <div key={chapter.id} className={styles.chapterItem}>
                  <div className={styles.chapterInfo}>
                    <div className={styles.chapterTitle}>
                      第{chapter.orderNum}章 {chapter.title}
                    </div>
                    <div className={styles.chapterMeta}>
                      {chapter.wordCount || 0}字
                      {currentBook.priceType === 1 && (
                        <span className={styles.chapterMetaSep}>
                          - {chapter.isFree === 1 ? '免费' : `${chapter.price || 10}书币`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.chapterActions}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditChapter(chapter)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      danger
                      onClick={() => setDeleteTargetId(chapter.id)}
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

      {/* Add / Edit chapter page (fullscreen) */}
      {(showAddChapter || editingChapter) && (
        <div className={styles.editPage}>
          <div className={styles.headerBar}>
            <div className={styles.headerLeft}>
              <button
                className={styles.backBtn}
                onClick={() => {
                  setShowAddChapter(false)
                  setEditingChapter(null)
                  setChapterForm({ title: '', content: '', price: 10, isFree: 1 })
                }}
              >
                <ArrowLeft size={24} />
              </button>
              <div className={styles.headerTitle}>
                {editingChapter ? '编辑章节' : '添加章节'}
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={editingChapter ? handleUpdateChapter : handleAddChapter}
              loading={loading}
            >
              保存
            </Button>
          </div>

          <div className={styles.editBody}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>章节标题 *</label>
              <input
                type="text"
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                placeholder="请输入章节标题"
                className={styles.formNative}
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>章节内容 *</label>
              <textarea
                value={chapterForm.content}
                onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                placeholder="请输入章节内容"
                rows={15}
                className={`${styles.formNative} ${styles.textarea}`}
              />
            </div>

            {currentBook?.priceType === 1 && (
              <>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>是否免费</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        checked={chapterForm.isFree === 1}
                        onChange={() => setChapterForm({ ...chapterForm, isFree: 1 })}
                      />
                      免费
                    </label>
                    <label className={styles.radioLabel}>
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
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>章节价格（书币）</label>
                    <input
                      type="number"
                      value={chapterForm.price}
                      onChange={(e) =>
                        setChapterForm({ ...chapterForm, price: parseInt(e.target.value) || 10 })
                      }
                      min="1"
                      className={styles.formNative}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete chapter confirmation modal */}
      <Modal
        visible={deleteTargetId !== null}
        title="确认删除"
        content="确定要删除这个章节吗？"
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteChapter}
        confirmText="确定"
        danger
      />

      {/* Delete book confirmation modal */}
      <Modal
        visible={deleteBookId !== null}
        title="确认删除作品"
        content="确定要删除这个作品吗？作品下的所有章节也会一并删除，此操作不可恢复。"
        onClose={() => setDeleteBookId(null)}
        onConfirm={confirmDeleteBook}
        confirmText="确定删除"
        danger
      />
    </div>
  )
}
