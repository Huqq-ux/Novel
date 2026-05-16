import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button, Toast, Dialog } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { bookApi, bookshelfApi, unlockApi } from '../services/api'
import { useBookshelfStore } from '../store/bookshelf'
import type { Book, Chapter } from '../types'

interface UnlockStatus {
  needUnlock: boolean
  isFree: boolean
  price: number
  unlocked: boolean
}

export default function Reader() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = useRef<string>(location.state?.from || '/')
  const [book, setBook] = useState<Book | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(16)
  const [showToolbar, setShowToolbar] = useState(true)
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const { updateProgress, isInBookshelf, addToBookshelf } = useBookshelfStore()

  useEffect(() => {
    if (bookId && chapterId) {
      loadBookAndChapter()
      loadChapters()
    }
  }, [bookId, chapterId])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserBalance(user.coinBalance || 0)
    }
  }, [])

  const loadBookAndChapter = async () => {
    setLoading(true)
    try {
      const bookResponse: any = await bookApi.getBookDetail(Number(bookId))
      if (bookResponse && bookResponse.code === 200) {
        const bookData = bookResponse.data
        setBook(bookData)

        if (bookData.priceType === 1) {
          const unlockResponse: any = await unlockApi.getStatus(Number(bookId), Number(chapterId))
          if (unlockResponse?.code === 200) {
            const status = unlockResponse.data
            setUnlockStatus(status)
            
            if (status.needUnlock && !status.isFree) {
              setLoading(false)
              return
            }
          }
        }

        const chapterResponse: any = await bookApi.getChapterContent(Number(bookId), Number(chapterId))
        if (chapterResponse && chapterResponse.code === 200 && chapterResponse.data) {
          setChapter(chapterResponse.data)
          
          if (!isInBookshelf(Number(bookId))) {
            addToBookshelf({
              id: Date.now(),
              bookId: Number(bookId),
              book: bookData,
              lastChapterId: Number(chapterId),
              lastReadTime: new Date().toISOString(),
              progress: 0,
            })
          } else {
            updateProgress(Number(bookId), Number(chapterId))
          }
          
          try {
            await bookshelfApi.updateProgress(Number(bookId), Number(chapterId))
          } catch (apiError) {
            console.error('Failed to sync progress to server:', apiError)
          }
        } else {
          Toast.show('章节不存在')
        }
      }
    } catch (error) {
      console.error('Failed to load book/chapter:', error)
      Toast.show('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadChapters = async () => {
    try {
      const response: any = await bookApi.getChapters(Number(bookId))
      if (response && response.code === 200) {
        setChapters(response.data)
      }
    } catch (error) {
      console.error('Failed to load chapters:', error)
    }
  }

  const handleUnlock = async () => {
    if (!chapterId) return
    
    const token = localStorage.getItem('accessToken')
    if (!token) {
      Toast.show('请先登录')
      navigate('/user')
      return
    }

    if (userBalance < (unlockStatus?.price || 0)) {
      const goRecharge = await Dialog.confirm({
        content: `书币不足，当前余额 ${userBalance} 书币，需要 ${unlockStatus?.price} 书币。是否前往充值？`,
        confirmText: '去充值',
        cancelText: '取消',
      })
      if (goRecharge) {
        navigate('/recharge')
      }
      return
    }

    const confirmed = await Dialog.confirm({
      content: `确定花费 ${unlockStatus?.price} 书币解锁此章节吗？`,
      confirmText: '确定解锁',
      cancelText: '取消',
    })
    
    if (!confirmed) return

    setUnlocking(true)
    try {
      const response: any = await unlockApi.unlockChapter(Number(chapterId))
      if (response?.code === 200) {
        Toast.show('解锁成功')
        const newBalance = response.data?.remainingBalance || userBalance - (unlockStatus?.price || 0)
        setUserBalance(newBalance)
        
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          user.coinBalance = newBalance
          localStorage.setItem('user', JSON.stringify(user))
        }
        
        setUnlockStatus({ needUnlock: false, isFree: unlockStatus!.isFree, price: unlockStatus!.price, unlocked: true })
        loadBookAndChapter()
      } else {
        Toast.show(response?.message || '解锁失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '解锁失败')
    } finally {
      setUnlocking(false)
    }
  }

  const handlePrevChapter = () => {
    const currentIndex = chapters.findIndex((c) => c.id === Number(chapterId))
    if (currentIndex > 0) {
      setUnlockStatus(null)
      navigate(`/read/${bookId}/${chapters[currentIndex - 1].id}`, { state: { from: fromPath.current } })
    } else {
      Toast.show('已经是第一章了')
    }
  }

  const handleNextChapter = () => {
    const currentIndex = chapters.findIndex((c) => c.id === Number(chapterId))
    if (currentIndex < chapters.length - 1) {
      setUnlockStatus(null)
      navigate(`/read/${bookId}/${chapters[currentIndex + 1].id}`, { state: { from: fromPath.current } })
    } else {
      Toast.show('已经是最后一章了')
    }
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
  }

  const handleGoBack = async () => {
    const result = await Dialog.confirm({
      content: '确定要退出阅读吗？',
      confirmText: '确定',
      cancelText: '取消',
    })
    
    if (result) {
      if (bookId && chapterId) {
        updateProgress(Number(bookId), Number(chapterId))
        bookshelfApi.updateProgress(Number(bookId), Number(chapterId))
      }
      navigate(`/book/${bookId}`, { state: { from: fromPath.current } })
    }
  }

  const toggleToolbar = () => {
    setShowToolbar((prev) => !prev)
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>
  }

  if (unlockStatus?.needUnlock && !unlockStatus.isFree) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: '#fff',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #eee',
            zIndex: 100,
          }}
        >
          <div
            onClick={handleGoBack}
            style={{ fontSize: '24px', marginRight: '12px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {book?.title}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            此章节为付费内容
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '24px', textAlign: 'center' }}>
            解锁后可阅读完整内容
          </div>

          <div
            style={{
              background: '#f5f5f5',
              borderRadius: '12px',
              padding: '20px',
              width: '100%',
              maxWidth: '300px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#666' }}>章节价格</span>
              <span style={{ fontWeight: 'bold' }}>{unlockStatus.price} 书币</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>当前余额</span>
              <span style={{ fontWeight: 'bold', color: userBalance >= unlockStatus.price ? '#52c41a' : '#ff4d4f' }}>
                {userBalance} 书币
              </span>
            </div>
          </div>

          <Button
            color="primary"
            size="large"
            style={{ width: '100%', maxWidth: '300px', marginBottom: '12px', borderRadius: '24px' }}
            onClick={handleUnlock}
            loading={unlocking}
            disabled={unlocking}
          >
            {unlocking ? '解锁中...' : '立即解锁'}
          </Button>

          <Button
            size="large"
            style={{ width: '100%', maxWidth: '300px', borderRadius: '24px' }}
            onClick={() => navigate('/recharge')}
          >
            充值书币
          </Button>
        </div>

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Button size="small" onClick={handlePrevChapter}>
            上一章
          </Button>
          <Button size="small" onClick={handleNextChapter}>
            下一章
          </Button>
        </div>
      </div>
    )
  }

  if (!chapter) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>章节不存在</div>
  }

  return (
    <div
      style={{
        padding: '16px',
        paddingBottom: '80px',
        backgroundColor: '#fff',
        minHeight: '100vh',
        position: 'relative',
      }}
      onClick={toggleToolbar}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          handleGoBack()
        }}
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          opacity: showToolbar ? 1 : 0,
          transform: showToolbar ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <LeftOutline fontSize={20} color="#fff" />
      </div>

      <div
        style={{
          marginBottom: '16px',
          paddingTop: '20px',
          opacity: showToolbar ? 1 : 0,
          transform: showToolbar ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
          {chapter.title}
        </h1>
        <div style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
          {book?.title}
        </div>
      </div>

      <div
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1.8',
          color: '#333',
          whiteSpace: 'pre-wrap',
        }}
      >
        {chapter.content}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          backgroundColor: '#fff',
          borderTop: '1px solid #eee',
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          opacity: showToolbar ? 1 : 0,
          transform: showToolbar ? 'translateY(0)' : 'translateY(100%)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <Button size="small" onClick={handlePrevChapter}>
          上一章
        </Button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            onClick={() => handleFontSizeChange(fontSize - 2)}
            disabled={fontSize <= 12}
          >
            A-
          </Button>
          <Button
            size="small"
            onClick={() => handleFontSizeChange(fontSize + 2)}
            disabled={fontSize >= 24}
          >
            A+
          </Button>
        </div>
        <Button size="small" onClick={handleNextChapter}>
          下一章
        </Button>
      </div>
    </div>
  )
}