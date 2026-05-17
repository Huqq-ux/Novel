import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { notificationApi } from '../services/api'
import Button from '../components/Button'
import Tag from '../components/Tag'
import Empty from '../components/Empty'
import Toast from '../components/Toast'
import styles from './Notifications.module.css'

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
    if (pageNum === 1) setLoading(true)
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
    if (!window.confirm('确定将所有通知标记为已读吗？')) return
    try {
      const response: any = await notificationApi.markAllAsRead()
      if (response && response.code === 200) {
        setNotifications(
          notifications.map((n) => ({ ...n, isRead: 1 }))
        )
        setUnreadCount(0)
        Toast.success('已全部标记为已读')
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'author':
        return <Tag color="primary">作者</Tag>
      case 'system':
        return <Tag color="default">系统</Tag>
      default:
        return <Tag color="default">其他</Tag>
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.backBtn} onClick={() => navigate('/user')}>
            <ArrowLeft size={18} color="#fff" />
          </div>
          <h2 className={styles.headerTitle}>
            消息通知
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>
                <Tag color="danger">{String(unreadCount)}</Tag>
              </span>
            )}
          </h2>
        </div>
        {unreadCount > 0 && (
          <Button variant="text" size="sm" onClick={handleMarkAllAsRead}>
            全部已读
          </Button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className={styles.loadingWrap}>加载中...</div>
      ) : notifications.length === 0 ? (
        <Empty description="暂无通知" />
      ) : (
        <>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${notification.isRead === 0 ? styles.notificationItemUnread : ''}`}
              onClick={() => {
                if (notification.isRead === 0) {
                  handleMarkAsRead(notification.id)
                }
              }}
            >
              <div className={`${styles.avatar} ${notification.isRead === 1 ? styles.avatarRead : ''}`}>
                {notification.type === 'author' ? '✍' : '📢'}
              </div>
              <div className={styles.notifContent}>
                <div className={styles.notifTitle}>
                  {getTypeBadge(notification.type)}
                  <span className={`${styles.notifTitleText} ${notification.isRead === 1 ? styles.notifTitleTextRead : ''}`}>
                    {notification.title}
                  </span>
                  {notification.isRead === 0 && <span style={{ color: 'var(--color-danger)', fontSize: '8px' }}>●</span>}
                </div>
                <div className={styles.notifBody}>{notification.content}</div>
                <div className={styles.notifTime}>
                  {new Date(notification.createTime).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className={styles.loadMore}>
              <Button variant="secondary" onClick={loadMore} loading={loading}>
                加载更多
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
