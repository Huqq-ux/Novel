import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Button, Empty, Tag, Dialog } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { notificationApi } from '../services/api'

interface Notification {
  id: number
  userId: number
  title: string
  content: string
  type: string
  isRead: number
  createTime: string
}

export default function Notifications() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async (pageNum: number = 1) => {
    if (pageNum === 1) {
      setLoading(true)
    }
    try {
      const response: any = await notificationApi.getNotifications(pageNum, 20)
      if (response && response.code === 200) {
        if (pageNum === 1) {
          setNotifications(response.data.list)
        } else {
          setNotifications([...notifications, ...response.data.list])
        }
        setUnreadCount(response.data.unreadCount)
        setHasMore(response.data.list.length === 20)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      const response: any = await notificationApi.markAsRead(id)
      if (response && response.code === 200) {
        setNotifications(
          notifications.map((n) =>
            n.id === id ? { ...n, isRead: 1 } : n
          )
        )
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    Dialog.confirm({
      content: '确定将所有通知标记为已读吗？',
      onConfirm: async () => {
        try {
          const response: any = await notificationApi.markAllAsRead()
          if (response && response.code === 200) {
            setNotifications(
              notifications.map((n) => ({ ...n, isRead: 1 }))
            )
            setUnreadCount(0)
          }
        } catch (error) {
          console.error('Failed to mark all as read:', error)
        }
      },
    })
  }

  const getTypeTag = (type: string) => {
    switch (type) {
      case 'author':
        return <Tag color="primary">作者</Tag>
      case 'system':
        return <Tag color="default">系统</Tag>
      default:
        return <Tag>其他</Tag>
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1)
    }
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            onClick={() => navigate('/user')}
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
            消息通知
            {unreadCount > 0 && (
              <Tag color="danger" style={{ marginLeft: '8px' }}>
                {unreadCount}
              </Tag>
            )}
          </h2>
        </div>
        {unreadCount > 0 && (
          <Button size="small" onClick={handleMarkAllAsRead}>
            全部已读
          </Button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      ) : notifications.length === 0 ? (
        <Empty description="暂无通知" />
      ) : (
        <>
          <List>
            {notifications.map((notification) => (
              <List.Item
                key={notification.id}
                onClick={() => {
                  if (notification.isRead === 0) {
                    handleMarkAsRead(notification.id)
                  }
                }}
                style={{
                  backgroundColor: notification.isRead === 0 ? '#f0f7ff' : '#fff',
                }}
                arrow={notification.isRead === 0}
                prefix={
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: notification.isRead === 0 ? '#1677ff' : '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '16px',
                    }}
                  >
                    {notification.type === 'author' ? '✍️' : '📢'}
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: '4px' }}>{notification.content}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(notification.createTime).toLocaleString()}
                    </div>
                  </div>
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getTypeTag(notification.type)}
                  <span style={{ fontWeight: notification.isRead === 0 ? 'bold' : 'normal' }}>
                    {notification.title}
                  </span>
                </div>
              </List.Item>
            ))}
          </List>
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Button onClick={loadMore} loading={loading}>
                加载更多
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
