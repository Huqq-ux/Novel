import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, List, Toast, TextArea, Empty } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { commentApi, bookApi } from '../services/api'

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
      Toast.show('请输入评论内容')
      return
    }
    if (commentContent.length > 500) {
      Toast.show('评论内容不能超过500字')
      return
    }

    setSubmitting(true)
    try {
      const response: any = await commentApi.addComment(Number(id), commentContent.trim())
      if (response && response.code === 200) {
        Toast.show('评论成功')
        setCommentContent('')
        loadComments()
      } else if (response && response.code === 401) {
        Toast.show('请先登录')
      } else {
        Toast.show(response?.message || '评论失败')
      }
    } catch (error: any) {
      console.error('Failed to submit comment:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.show('请先登录')
      } else {
        Toast.show('评论失败')
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
      Toast.show('请输入回复内容')
      return
    }
    if (replyContent.length > 500) {
      Toast.show('回复内容不能超过500字')
      return
    }

    setSubmittingReply(true)
    try {
      const response: any = await commentApi.addComment(Number(id), replyContent.trim(), parentId)
      if (response && response.code === 200) {
        Toast.show('回复成功')
        setReplyContent('')
        setReplyingTo(null)
        loadComments()
      } else if (response && response.code === 401) {
        Toast.show('请先登录')
      } else {
        Toast.show(response?.message || '回复失败')
      }
    } catch (error: any) {
      console.error('Failed to submit reply:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.show('请先登录')
      } else {
        Toast.show('回复失败')
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
      Toast.show('请先登录')
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
        Toast.show('请先登录')
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
        Toast.show('请先登录')
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

  const renderComment = (comment: BookComment, isReply: boolean = false) => (
    <div 
      key={comment.id} 
      style={{ 
        width: '100%',
        marginLeft: isReply ? '40px' : '0',
        marginTop: isReply ? '12px' : '0',
        padding: isReply ? '12px' : '0',
        backgroundColor: isReply ? '#f9f9f9' : 'transparent',
        borderRadius: isReply ? '8px' : '0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              width: isReply ? '28px' : '32px', 
              height: isReply ? '28px' : '32px', 
              borderRadius: '50%', 
              backgroundColor: isReply ? '#52c41a' : '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: isReply ? '12px' : '14px',
              fontWeight: 'bold',
            }}
          >
            {(comment.userName || '用户').charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {comment.userName || '匿名用户'}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#999' }}>
          {formatDate(comment.createTime)}
        </span>
      </div>
      <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', paddingLeft: isReply ? '36px' : '40px' }}>
        {comment.content}
      </div>
      <div style={{ paddingLeft: isReply ? '36px' : '40px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => handleToggleLike(comment.id)}
          disabled={likingComments.has(comment.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 12px',
            border: 'none',
            borderRadius: '16px',
            backgroundColor: comment.isLiked ? '#fff1f0' : '#f5f5f5',
            color: comment.isLiked ? '#ff4d4f' : '#666',
            fontSize: '13px',
            cursor: likingComments.has(comment.id) ? 'wait' : 'pointer',
            transition: 'all 0.3s ease',
            outline: 'none',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: '16px',
              transition: 'transform 0.3s ease',
              transform: comment.isLiked ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            {comment.isLiked ? '❤️' : '🤍'}
          </span>
          <span>{comment.likes || 0}</span>
        </button>
        {!isReply && (
          <button
            onClick={() => handleReplyClick(comment.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 12px',
              border: 'none',
              borderRadius: '16px',
              backgroundColor: replyingTo === comment.id ? '#e6f7ff' : '#f5f5f5',
              color: replyingTo === comment.id ? '#1890ff' : '#666',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
          >
            💬 回复
          </button>
        )}
      </div>

      {!isReply && replyingTo === comment.id && (
        <div style={{ paddingLeft: '40px', marginTop: '12px' }}>
          <TextArea
            placeholder={`回复 ${comment.userName}...`}
            value={replyContent}
            onChange={setReplyContent}
            rows={2}
            maxLength={500}
            showCount
            style={{ 
              border: '1px solid #1890ff', 
              borderRadius: '8px', 
              padding: '8px',
              fontSize: '14px',
              backgroundColor: '#fff',
            }}
          />
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button 
              size="small" 
              onClick={handleCancelReply}
            >
              取消
            </Button>
            <Button 
              color="primary" 
              size="small" 
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
        <div style={{ marginTop: '12px' }}>
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0)
  }, 0)

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: '12px',
          }}
        >
          <LeftOutline fontSize={18} color="#fff" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          {book ? `《${book.title}》的评论` : '书籍评论'}
        </h2>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <TextArea
            placeholder="写下你的评论..."
            value={commentContent}
            onChange={setCommentContent}
            rows={3}
            maxLength={500}
            showCount
            style={{ 
              border: '1px solid #e5e5e5', 
              borderRadius: '8px', 
              padding: '8px',
              fontSize: '14px',
            }}
          />
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              color="primary" 
              size="small" 
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
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      ) : comments.length === 0 ? (
        <Empty description="暂无评论，快来抢沙发吧~" style={{ padding: '40px 0' }} />
      ) : (
        <Card title={`全部评论 (${totalComments})`}>
          <List>
            {comments.map((comment) => (
              <List.Item key={comment.id} style={{ padding: '12px 0' }}>
                {renderComment(comment)}
              </List.Item>
            ))}
          </List>
        </Card>
      )}
    </div>
  )
}
