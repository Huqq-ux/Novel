import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react'
import { commentApi, bookApi } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import Empty from '../components/Empty'
import Toast from '../components/Toast'
import styles from './BookComments.module.css'

interface BookComment {
  id: number
  userId: number
  bookId: number
  parentId?: number
  bookTitle?: string
  userName: string
  content: string
  likes: number
  createTime: string
  isLiked?: boolean
  replies?: BookComment[]
}

interface Book {
  id: number
  title: string
  author: string
  cover: string
}

export default function BookComments() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [comments, setComments] = useState<BookComment[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [likingComments, setLikingComments] = useState<Set<number>>(new Set())
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  useEffect(() => {
    if (id) {
      loadBookDetail()
      loadComments()
    }
  }, [id])

  const loadBookDetail = async () => {
    try {
      const response: any = await bookApi.getBookDetail(Number(id))
      if (response && response.code === 200) {
        setBook(response.data)
      }
    } catch (error) {
      console.error('Failed to load book detail:', error)
    }
  }

  const loadComments = async () => {
    setLoading(true)
    try {
      const response: any = await commentApi.getBookComments(Number(id))
      if (response && response.code === 200) {
        const allComments = response.data || []
        const organizedComments = organizeComments(allComments)
        setComments(organizedComments)
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const organizeComments = (allComments: BookComment[]): BookComment[] => {
    const rootComments: BookComment[] = []
    const repliesMap: Map<number, BookComment[]> = new Map()

    allComments.forEach(comment => {
      if (comment.parentId) {
        if (!repliesMap.has(comment.parentId)) {
          repliesMap.set(comment.parentId, [])
        }
        repliesMap.get(comment.parentId)!.push(comment)
      } else {
        rootComments.push(comment)
      }
    })

    rootComments.forEach(comment => {
      comment.replies = repliesMap.get(comment.id) || []
    })

    return rootComments
  }

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      Toast.show({ type: 'info', content: '请输入评论内容' })
      return
    }
    if (commentContent.length > 500) {
      Toast.show({ type: 'info', content: '评论内容不能超过500字' })
      return
    }

    setSubmitting(true)
    try {
      const response: any = await commentApi.addComment(Number(id), commentContent.trim())
      if (response && response.code === 200) {
        Toast.success('评论成功')
        setCommentContent('')
        loadComments()
      } else if (response && response.code === 401) {
        Toast.show({ type: 'info', content: '请先登录' })
      } else {
        Toast.show({ type: 'error', content: response?.message || '评论失败' })
      }
    } catch (error: any) {
      console.error('Failed to submit comment:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.show({ type: 'info', content: '请先登录' })
      } else {
        Toast.error('评论失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplyClick = (commentId: number) => {
    if (replyingTo === commentId) {
      setReplyingTo(null)
      setReplyContent('')
    } else {
      setReplyingTo(commentId)
      setReplyContent('')
    }
  }

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      Toast.show({ type: 'info', content: '请输入回复内容' })
      return
    }
    if (replyContent.length > 500) {
      Toast.show({ type: 'info', content: '回复内容不能超过500字' })
      return
    }

    setSubmittingReply(true)
    try {
      const response: any = await commentApi.addComment(Number(id), replyContent.trim(), parentId)
      if (response && response.code === 200) {
        Toast.success('回复成功')
        setReplyContent('')
        setReplyingTo(null)
        loadComments()
      } else if (response && response.code === 401) {
        Toast.show({ type: 'info', content: '请先登录' })
      } else {
        Toast.show({ type: 'error', content: response?.message || '回复失败' })
      }
    } catch (error: any) {
      console.error('Failed to submit reply:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.show({ type: 'info', content: '请先登录' })
      } else {
        Toast.error('回复失败')
      }
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setReplyContent('')
  }

  const handleToggleLike = async (commentId: number) => {
    if (likingComments.has(commentId)) return

    const token = localStorage.getItem('accessToken')
    if (!token) {
      Toast.show({ type: 'info', content: '请先登录' })
      return
    }

    setLikingComments(prev => new Set(prev).add(commentId))

    const updateCommentLikes = (comments: BookComment[]): BookComment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const newIsLiked = !comment.isLiked
          return {
            ...comment,
            isLiked: newIsLiked,
            likes: newIsLiked ? comment.likes + 1 : Math.max(0, comment.likes - 1)
          }
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentLikes(comment.replies)
          }
        }
        return comment
      })
    }

    setComments(prevComments => updateCommentLikes(prevComments))

    try {
      const response: any = await commentApi.toggleLike(commentId)
      if (response && response.code === 401) {
        Toast.show({ type: 'info', content: '请先登录' })
        loadComments()
      } else if (response && response.code === 200) {
        const updateWithServerData = (comments: BookComment[]): BookComment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: response.data.isLiked,
                likes: response.data.likeCount
              }
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateWithServerData(comment.replies)
              }
            }
            return comment
          })
        }
        setComments(prevComments => updateWithServerData(prevComments))
      }
    } catch (error: any) {
      console.error('Failed to toggle like:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.show({ type: 'info', content: '请先登录' })
      }
      loadComments()
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    } catch {
      return dateStr
    }
  }

  const renderComment = (comment: BookComment, isReply: boolean = false) => {
    const itemClass = isReply ? styles.replyItem : styles.commentItem
    const avatarClass = isReply ? styles.avatarSm : styles.avatar
    const bodyClass = isReply ? `${styles.commentBody} ${styles.replyBody}` : styles.commentBody
    const actionRowClass = isReply ? `${styles.actionRow} ${styles.replyActionRow}` : styles.actionRow

    const likeBtnClasses = [
      styles.actionBtn,
      comment.isLiked && styles.likeBtnLiked,
      likingComments.has(comment.id) && styles.actionBtnDisabled,
    ].filter(Boolean).join(' ')

    const replyBtnClasses = [
      styles.actionBtn,
      replyingTo === comment.id && styles.replyBtnActive,
    ].filter(Boolean).join(' ')

    return (
      <div key={comment.id} className={itemClass}>
        <div className={styles.commentHeader}>
          <div className={styles.authorInfo}>
            <div className={avatarClass}>
              {(comment.userName || '用户').charAt(0).toUpperCase()}
            </div>
            <span className={styles.authorName}>
              {comment.userName || '匿名用户'}
            </span>
          </div>
          <span className={styles.commentTime}>
            {formatDate(comment.createTime)}
          </span>
        </div>

        <div className={bodyClass}>
          {comment.content}
        </div>

        <div className={actionRowClass}>
          <button
            onClick={() => handleToggleLike(comment.id)}
            disabled={likingComments.has(comment.id)}
            className={likeBtnClasses}
          >
            <Heart
              size={14}
              fill={comment.isLiked ? 'var(--color-danger)' : 'none'}
              color={comment.isLiked ? 'var(--color-danger)' : 'var(--color-text-tertiary)'}
            />
            <span>{comment.likes || 0}</span>
          </button>

          {!isReply && (
            <button
              onClick={() => handleReplyClick(comment.id)}
              className={replyBtnClasses}
            >
              <MessageCircle size={14} /> 回复
            </button>
          )}
        </div>

        {!isReply && replyingTo === comment.id && (
          <div className={styles.replyArea}>
            <Input
              placeholder={`回复 ${comment.userName}...`}
              value={replyContent}
              onChange={setReplyContent}
              rows={2}
              maxLength={500}
            />
            <div className={styles.replyActions}>
              <Button variant="secondary" size="sm" onClick={handleCancelReply}>
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                loading={submittingReply}
                disabled={!replyContent.trim()}
              >
                发送回复
              </Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0)
  }, 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.headerTitle}>
          {book ? `《${book.title}》的评论` : '书籍评论'}
        </h2>
      </div>

      <Card className={styles.commentInputCard}>
        <div className={styles.inputArea}>
          <Input
            placeholder="写下你的评论..."
            value={commentContent}
            onChange={setCommentContent}
            rows={3}
            maxLength={500}
          />
          <div className={styles.inputActions}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitComment}
              loading={submitting}
              disabled={!commentContent.trim()}
            >
              发表评论
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : comments.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty icon="💬" description="暂无评论，快来抢沙发吧~" />
        </div>
      ) : (
        <Card title={`全部评论 (${totalComments})`} className={styles.commentsCard}>
          <div className={styles.commentList}>
            {comments.map((comment) => renderComment(comment))}
          </div>
        </Card>
      )}
    </div>
  )
}
