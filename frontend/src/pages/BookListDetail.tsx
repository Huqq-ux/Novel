import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { bookListApi } from '../services/api'
import type { BookList, BookListItem } from '../types'
import BookCover from '../components/BookCover'
import Toast from '../components/Toast'
import styles from './BookListDetail.module.css'

export default function BookListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [list, setList] = useState<BookList | null>(null)
  const [items, setItems] = useState<BookListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) loadData() }, [id])

  const loadData = async () => {
    try {
      const [listRes, itemsRes]: any[] = await Promise.all([
        bookListApi.getList(Number(id)),
        bookListApi.getItems(Number(id)),
      ])
      if (listRes?.code === 200) setList(listRes.data)
      if (itemsRes?.code === 200) setItems(itemsRes.data)
    } catch (_) { Toast.error('加载书单失败') }
    finally { setLoading(false) }
  }

  const handleRemove = async (itemId: number) => {
    if (!window.confirm('确定移除这本书吗？')) return
    try {
      await bookListApi.removeItem(Number(id), itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
      Toast.success('已移除')
    } catch (_) { Toast.error('移除失败') }
  }

  if (loading) return <div className={styles.loading}>加载中...</div>
  if (!list) return <div className={styles.loading}>书单不存在</div>

  const isOwner = list.userId === Number(localStorage.getItem('userId'))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </span>
        <h2 className={styles.title}>{list.title}</h2>
        <span style={{ width: 20 }} />
      </div>
      {list.description && <p className={styles.desc}>{list.description}</p>}
      <div className={styles.meta}>
        <span>{list.bookCount || 0} 本书</span>
        <span>{list.likeCount || 0} 赞</span>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>书单还是空的</div>
      ) : (
        <div className={styles.itemList}>
          {items.map(item => (
            <div key={item.id} className={styles.item} onClick={() => navigate(`/book/${item.bookId}`)}>
              <BookCover src={item.book?.cover} title={item.book?.title} size="sm" />
              <div className={styles.itemInfo}>
                <span className={styles.itemTitle}>{item.book?.title || '未知书籍'}</span>
                <span className={styles.itemAuthor}>{item.book?.author}</span>
              </div>
              {isOwner && (
                <button className={styles.removeBtn} onClick={e => { e.stopPropagation(); handleRemove(item.id!) }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
