import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen } from 'lucide-react'
import { bookListApi } from '../services/api'
import type { BookList } from '../types'
import Button from '../components/Button'
import Toast from '../components/Toast'
import styles from './BookListSquare.module.css'

export default function BookListSquare() {
  const navigate = useNavigate()
  const [lists, setLists] = useState<BookList[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => { loadLists() }, [sort])

  const loadLists = async () => {
    setLoading(true)
    try {
      const res: any = await bookListApi.getPublicLists({ page: 1, size: 50, sort })
      if (res?.code === 200) setLists(res.data || [])
    } catch (_) {
      Toast.error('加载书单失败')
    } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!title.trim()) { Toast.info('请输入书单标题'); return }
    try {
      const res: any = await bookListApi.createList({ title: title.trim(), description: desc.trim(), isPublic })
      if (res?.code === 200) {
        Toast.success('书单创建成功')
        setShowCreate(false); setTitle(''); setDesc('')
        loadLists()
      } else {
        Toast.error(res?.message || '创建失败')
      }
    } catch (_) { Toast.error('创建失败') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>书荒广场</h2>
        <Button variant="primary" size="sm" onClick={() => {
          const token = localStorage.getItem('accessToken')
          if (!token) { Toast.info('请先登录'); return }
          setShowCreate(true)
        }}>
          <Plus size={16} style={{ marginRight: 4 }} />创建书单
        </Button>
      </div>

      <div className={styles.sortBar}>
        <button className={`${styles.sortBtn} ${sort === 'newest' ? styles.sortActive : ''}`} onClick={() => setSort('newest')}>最新</button>
        <button className={`${styles.sortBtn} ${sort === 'popular' ? styles.sortActive : ''}`} onClick={() => setSort('popular')}>最热</button>
      </div>

      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : lists.length === 0 ? (
        <div className={styles.empty}>暂无书单，快来创建第一个吧</div>
      ) : (
        <div className={styles.grid}>
          {lists.map(list => (
            <div key={list.id} className={styles.card} onClick={() => navigate(`/book-lists/${list.id}`)}>
              <div className={styles.cardCover}>
                {list.cover ? <img src={list.cover} alt="" /> : <BookOpen size={32} />}
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{list.title}</h3>
                <p className={styles.cardDesc}>{list.description || '暂无简介'}</p>
                <div className={styles.cardMeta}>
                  <span>{list.bookCount || 0} 本书</span>
                  <span>{list.likeCount || 0} 赞</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>创建书单</h3>
            <input className={styles.input} placeholder="书单标题" value={title} onChange={e => setTitle(e.target.value)} maxLength={50} />
            <textarea className={styles.textarea} placeholder="书单简介（选填）" value={desc} onChange={e => setDesc(e.target.value)} maxLength={200} rows={3} />
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
              公开书单
            </label>
            <div className={styles.modalBtns}>
              <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>取消</Button>
              <Button variant="primary" size="sm" onClick={handleCreate}>创建</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
