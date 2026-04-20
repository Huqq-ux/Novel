import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Empty, Button, Dialog, Toast } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { commentApi } from '../services/api'

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
        Toast.show('请先登录')
        setComments([])
      } else {
        setComments([])
      }
    } catch (error: any) {
      console.error('Failed to load comments:', error)
      if (error.response?.status === 401 || error.response?.data?.code === 401) {
        Toast.show('请先登录')
      }
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    const result = await Dialog.confirm({
      content: '确定要删除这条评论吗？',
    })
    if (result) {
      try {
        const response: any = await commentApi.deleteComment(id)
        if (response && response.code === 200) {
          setComments(prev => prev.filter(c => c.id !== id))
          Toast.show('删除成功')
        } else {
          Toast.show(response?.message || '删除失败')
        }
      } catch (error: any) {
        console.error('Failed to delete comment:', error)
        Toast.show('删除失败')
      }
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
          我的评论
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      ) : comments.length === 0 ? (
        <Empty description="暂无评论记录" />
      ) : (
        <List>
          {comments.map((comment) => (
            <List.Item
              key={comment.id}
              style={{ padding: '12px' }}
            >
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{comment.bookTitle}</span>
                <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                  {formatDate(comment.createTime)}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginBottom: '8px' }}>
                {comment.content}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>👍 {comment.likes || 0} 赞</span>
                <Button size="mini" fill="none" onClick={() => handleDelete(comment.id)}>
                  删除
                </Button>
              </div>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  )
}
