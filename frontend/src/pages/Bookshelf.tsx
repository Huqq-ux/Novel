import { useEffect } from 'react'
import { List, Card, Button, Empty } from 'antd-mobile'
import { useBookshelfStore } from '../store/bookshelf'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookshelfApi } from '../services/api'

export default function Bookshelf() {
  const { bookshelf, removeFromBookshelf, setBookshelf } = useBookshelfStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    loadBookshelf()
  }, [])

  /**
   * 加载书架数据
   * 通过API获取用户的书架列表，并与本地数据合并
   */
  const loadBookshelf = async () => {
    try {
      const response: any = await bookshelfApi.getBookshelf()
      if (response && response.code === 200 && Array.isArray(response.data)) {
        const serverData = response.data
        setBookshelf(serverData.map((item: any) => ({
          ...item,
          progress: item.progress || 0,
          lastChapterId: item.lastChapterId || 0,
          lastReadTime: item.lastReadTime || new Date().toISOString(),
        })))
      }
    } catch (error) {
      console.error('Failed to load bookshelf:', error)
    }
  }

  /**
   * 从书架移除书籍
   * 根据书籍ID从后端API和本地状态中移除书籍
   * @param bookId - 要移除的书籍ID
   */
  const handleRemove = async (bookId: number) => {
    try {
      await bookshelfApi.removeFromBookshelf(bookId)
      removeFromBookshelf(bookId)
    } catch (error) {
      console.error('Failed to remove from bookshelf:', error)
    }
  }

  const formatProgress = (progress: number) => {
    if (!progress || progress <= 0) {
      return '0%'
    }
    return `${Math.min(progress, 100)}%`
  }

  /**
   * 格式化日期显示
   * 将ISO格式的日期字符串转换为中文本地化日期格式
   * @param dateString - ISO格式的日期字符串
   * @returns 中文本地化的日期字符串，如"2023/12/15"
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  // @ts-ignore
  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
          我的书架
        </h2>
      </div>
      {bookshelf.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Empty
            description="书架空空如也"
            style={{ paddingBottom: '20px' }}
          />
          <Button
            color="primary"
            size="small"
            onClick={() => navigate('/home')}
          >
            去选书
          </Button>
        </div>
      ) : (
        <List>
          {bookshelf.map((item) => (
            <List.Item
              key={item.id}
              onClick={() => navigate(`/book/${item.bookId}`, { state: { from: location.pathname } })}
              style={{ padding: '12px 0' }}
            >
              <Card
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  padding: '8px',
                  gap: '12px',
                }}
              >
                <img
                  src={item.book?.cover || 'https://placehold.co/80x100/eee/999?text=Book'}
                  alt={item.book?.title}
                  style={{
                    width: '80px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {item.book?.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    {item.book?.author}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    阅读进度: {formatProgress(item.progress)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {item.lastReadTime ? formatDate(item.lastReadTime) : '未阅读'}
                  </div>
                </div>
                <Button
                  size="mini"
                  color="danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(item.bookId)
                  }}
                >
                  移除
                </Button>
              </Card>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  )
}