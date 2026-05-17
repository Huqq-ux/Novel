import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ThumbsUp, Trash2 } from 'lucide-react'
import { commentApi } from '../services/api'
import Button from '../components/Button'
import Empty from '../components/Empty'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import styles from './MyComments.module.css'

interface Comment {
  id: number
  bookId: number
  bookTitle: string
  content: string
  createTime: string
  likes: number
}

export default function MyComments() {
  const navigate = useNavigate()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  useEffect(() => {
    loadComments()
  }, [])

  const loadComments = async () => {
    setLoading(true)
    try {
      const response: any = await commentApi.getMyComments()
      if (response && response.code === 200) {
        setComments(response.data || [])
      } else if (response && response.code === 401) {
        Toast.show({ content: '请先登录' })
        setComments([])
      } else {
        setComments([])
      }
    } catch (error: any) {
      console.error('Failed to load comments:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.show({ content: '请先登录' })
      }
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteTargetId === null) return

    try {
      const response: any = await commentApi.deleteComment(deleteTargetId)
      if (response && response.code === 200) {
        setComments(prev => prev.filter(c => c.id !== deleteTargetId))
        Toast.success('删除成功')
      } else {
        Toast.show({ content: response?.message || '删除失败' })
      }
    } catch (error: any) {
      console.error('Failed to delete comment:', error)
      Toast.show({ content: '删除失败' })
    } finally {
      setDeleteTargetId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.title}>
          我的评论
        </h2>
      </div>

      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : comments.length === 0 ? (
        <Empty
          description="暂无评论记录"
        />
      ) : (
        <div className={styles.list}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.commentCard}>
              <div className={styles.commentHeader}>
                <span
                  className={styles.commentBookTitle}
                  onClick={() => navigate(`/book/${comment.bookId}`)}
                >
                  {comment.bookTitle}
                </span>
                <span className={styles.commentDate}>
                  {formatDate(comment.createTime)}
                </span>
              </div>
              <div className={styles.commentContent}>
                {comment.content}
              </div>
              <div className={styles.commentFooter}>
                <span className={styles.commentLikes}>
                  <ThumbsUp size={14} className={styles.commentLikesIcon} />
                  {comment.likes || 0} 赞
                </span>
                <Button
                  size="sm"
                  variant="text"
                  danger
                  onClick={() => setDeleteTargetId(comment.id)}
                >
                  <Trash2 size={14} style={{ marginRight: 4 }} />
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        visible={deleteTargetId !== null}
        title="确认删除"
        content="确定要删除这条评论吗？"
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        confirmText="确定"
        danger
      />
    </div>
  )
}
