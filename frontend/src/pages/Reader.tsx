import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Bookmark as BookmarkIcon, List, Palette, ScrollText, Heart } from 'lucide-react'
import { bookApi, bookshelfApi, unlockApi, bookmarkApi, tipApi } from '../services/api'
import { useBookshelfStore } from '../store/bookshelf'
import type { Book, Bookmark, Chapter } from '../types'
import Button from '../components/Button'
import Toast from '../components/Toast'
import styles from './Reader.module.css'

interface ThemePreset {
  name: string
  label: string
  bg: string
  color: string
}

const THEMES: ThemePreset[] = [
  { name: 'white', label: '白', bg: '#fbf9f7', color: '#2c1f14' },
  { name: 'green', label: '护眼', bg: '#c8d6b8', color: '#2c1f14' },
  { name: 'parchment', label: '羊皮纸', bg: '#f0e6d3', color: '#2c1f14' },
  { name: 'lightGray', label: '浅灰', bg: '#d9d2c5', color: '#2c1f14' },
  { name: 'darkGray', label: '深灰', bg: '#3c3c3c', color: '#d4c8b8' },
  { name: 'black', label: '纯黑', bg: '#1a1a1a', color: '#c8c0b8' },
]

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
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize')
    if (saved) {
      const map: Record<string, number> = { small: 14, medium: 16, large: 20 }
      return map[saved] || 16
    }
    return 16
  })
  const [showToolbar, setShowToolbar] = useState(true)
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [readerTheme, setReaderTheme] = useState(() => {
    return localStorage.getItem('readerTheme') || 'white'
  })
  const [readerMode, setReaderMode] = useState<'page' | 'scroll'>(() => {
    return (localStorage.getItem('readerMode') as 'page' | 'scroll') || 'page'
  })

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [catalogTab, setCatalogTab] = useState<'chapters' | 'bookmarks'>('chapters')
  const [userBalance, setUserBalance] = useState(0)
  const [showTipModal, setShowTipModal] = useState(false)
  const [tipAmount, setTipAmount] = useState(100)
  const [tipMessage, setTipMessage] = useState('')
  const [tipping, setTipping] = useState(false)
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

  useEffect(() => {
    if (bookId) loadBookmarksFromServer()
  }, [bookId])

  const loadBookmarksFromServer = async () => {
    try {
      const res: any = await bookmarkApi.getBookmarks(Number(bookId))
      const serverBookmarks: Bookmark[] = (res?.code === 200 && res?.data) ? res.data : []

      const raw = localStorage.getItem('readerBookmarks')
      if (raw) {
        try {
          const localBookmarks: Bookmark[] = JSON.parse(raw)
          const localForThisBook = localBookmarks.filter(b => b.bookId === Number(bookId))
          if (localForThisBook.length > 0) {
            for (const lb of localForThisBook) {
              const exists = serverBookmarks.some(sb => sb.chapterId === lb.chapterId)
              if (!exists) {
                try {
                  await bookmarkApi.addBookmark({
                    bookId: lb.bookId,
                    chapterId: lb.chapterId,
                    chapterTitle: lb.chapterTitle,
                    position: lb.position || 0,
                  })
                } catch (_) {}
              }
            }
            localStorage.removeItem('readerBookmarks')
            const fresh: any = await bookmarkApi.getBookmarks(Number(bookId))
            if (fresh?.code === 200 && fresh?.data) {
              setBookmarks(fresh.data)
              return
            }
          }
        } catch (_) {}
      }
      setBookmarks(serverBookmarks)
    } catch (_) {
      setBookmarks([])
    }
  }

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
          Toast.info('章节不存在')
        }
      }
    } catch (error) {
      console.error('Failed to load book/chapter:', error)
      Toast.error('加载失败')
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
      Toast.info('请先登录')
      navigate('/user')
      return
    }

    if (userBalance < (unlockStatus?.price || 0)) {
      const goRecharge = window.confirm(
        `书币不足，当前余额 ${userBalance} 书币，需要 ${unlockStatus?.price} 书币。是否前往充值？`
      )
      if (goRecharge) {
        navigate('/recharge')
      }
      return
    }

    const confirmed = window.confirm(
      `确定花费 ${unlockStatus?.price} 书币解锁此章节吗？`
    )

    if (!confirmed) return

    setUnlocking(true)
    try {
      const response: any = await unlockApi.unlockChapter(Number(chapterId))
      if (response?.code === 200) {
        Toast.success('解锁成功')
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
        Toast.error(response?.message || '解锁失败')
      }
    } catch (error: any) {
      Toast.error(error.response?.data?.message || '解锁失败')
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
      Toast.info('已经是第一章了')
    }
  }

  const handleNextChapter = () => {
    const currentIndex = chapters.findIndex((c) => c.id === Number(chapterId))
    if (currentIndex < chapters.length - 1) {
      setUnlockStatus(null)
      navigate(`/read/${bookId}/${chapters[currentIndex + 1].id}`, { state: { from: fromPath.current } })
    } else {
      Toast.info('已经是最后一章了')
    }
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
  }

  const isBookmarked = bookmarks.some(
    b => b.bookId === Number(bookId) && b.chapterId === Number(chapterId)
  )

  const toggleBookmark = async () => {
    if (isBookmarked) {
      const existing = bookmarks.find(
        b => b.bookId === Number(bookId) && b.chapterId === Number(chapterId)
      )
      if (existing?.id) {
        await bookmarkApi.deleteBookmark(existing.id)
      }
      setBookmarks(prev => prev.filter(b => !(b.bookId === Number(bookId) && b.chapterId === Number(chapterId))))
    } else {
      try {
        const res: any = await bookmarkApi.addBookmark({
          bookId: Number(bookId),
          chapterId: Number(chapterId),
          chapterTitle: chapter?.title || '',
        })
        if (res?.code === 200 && res?.data) {
          setBookmarks(prev => [res.data, ...prev])
        } else if (res?.code === 400) {
          Toast.info('该章节已添加书签')
        }
      } catch (_) {
        Toast.error('添加书签失败')
      }
    }
  }

  const handleThemeChange = (name: string) => {
    setReaderTheme(name)
    localStorage.setItem('readerTheme', name)
    setShowThemePicker(false)
  }

  const handleModeChange = () => {
    const next = readerMode === 'page' ? 'scroll' : 'page'
    setReaderMode(next)
    localStorage.setItem('readerMode', next)
  }

  const handleTip = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { Toast.info('请先登录'); return }
    if (!book?.authorId) { Toast.error('作者信息不可用'); return }
    setTipping(true)
    try {
      const res: any = await tipApi.createTip({
        authorId: book.authorId,
        bookId: Number(bookId),
        chapterId: Number(chapterId),
        amount: tipAmount,
        message: tipMessage || undefined,
      })
      if (res?.code === 200) {
        Toast.success(`成功打赏 ${tipAmount} 书币`)
        const remain = res.data?.remainingBalance
        if (remain !== undefined) {
          setUserBalance(remain)
          const userStr = localStorage.getItem('user')
          if (userStr) {
            const user = JSON.parse(userStr)
            user.coinBalance = remain
            localStorage.setItem('user', JSON.stringify(user))
          }
        }
        setShowTipModal(false)
        setTipMessage('')
      } else {
        Toast.error(res?.message || '打赏失败')
      }
    } catch (_: any) {
      Toast.error('打赏失败')
    } finally { setTipping(false) }
  }

  const handleGoBack = () => {
    const result = window.confirm('确定要退出阅读吗？')
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

  const currentIndex = chapters.findIndex((c) => c.id === Number(chapterId))
  const progressPercent = chapters.length > 0 ? Math.round(((currentIndex + 1) / chapters.length) * 100) : 0
  const currentTheme = THEMES.find(t => t.name === readerTheme)!

  if (loading) {
    return (
      <div className={styles.pageLoading}>
        <div style={{
          width: 24, height: 24,
          border: '2px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      </div>
    )
  }

  if (unlockStatus?.needUnlock && !unlockStatus.isFree) {
    return (
      <div className={styles.unlockWall}>
        <div className={styles.unlockHeader}>
          <div onClick={handleGoBack} style={{ fontSize: '20px', cursor: 'pointer', marginRight: '12px' }}>
            <ArrowLeft size={20} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
            {book?.title}
          </div>
        </div>

        <div className={styles.unlockBody}>
          <div className={styles.unlockIcon}>🔒</div>
          <div className={styles.unlockTitle}>此章节为付费内容</div>
          <div className={styles.unlockDesc}>解锁后可阅读完整内容</div>

          <div className={styles.unlockInfo}>
            <div className={styles.unlockRow}>
              <span className={styles.unlockLabel}>章节价格</span>
              <span className={styles.unlockValue}>{unlockStatus.price} 书币</span>
            </div>
            <div className={styles.unlockRow}>
              <span className={styles.unlockLabel}>当前余额</span>
              <span style={{
                fontWeight: 'bold',
                color: userBalance >= unlockStatus.price ? 'var(--color-accent)' : 'var(--color-danger)',
              }}>
                {userBalance} 书币
              </span>
            </div>
          </div>

          <div className={styles.unlockBtn}>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={handleUnlock}
              loading={unlocking}
              disabled={unlocking}
            >
              {unlocking ? '解锁中...' : '立即解锁'}
            </Button>
          </div>

          <div className={styles.unlockBtn}>
            <Button variant="secondary" size="lg" block onClick={() => navigate('/recharge')}>
              充值书币
            </Button>
          </div>
        </div>

        <div className={styles.navFooter}>
          <Button variant="secondary" size="sm" onClick={handlePrevChapter}>
            上一章
          </Button>
          <Button variant="secondary" size="sm" onClick={handleNextChapter}>
            下一章
          </Button>
        </div>
      </div>
    )
  }

  if (!chapter) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>章节不存在</div>
  }

  return (
    <div style={{ background: currentTheme.bg, color: currentTheme.color, minHeight: '100vh', paddingBottom: readerMode === 'page' ? '130px' : 0 }}>
      <div
        style={{
          opacity: showToolbar || readerMode === 'scroll' ? 1 : 0,
          transform: showToolbar || readerMode === 'scroll' ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          position: readerMode === 'scroll' ? 'sticky' : 'static' as any,
          top: 0,
          zIndex: 10,
        }}
      >
        <div className={styles.toolbar}>
          <span onClick={handleGoBack} style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            返回
          </span>
          <span className={styles.toolbarTitle}>{chapter.title}</span>
          <span style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>⚙</span>
        </div>
      </div>

      <div className={readerMode === 'scroll' ? styles.scrollContent : styles.content} onClick={readerMode === 'page' ? toggleToolbar : undefined} style={{ fontSize: `${fontSize}px` }}>
        {chapter.content}
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>
      <div className={styles.progressText}>
        {currentIndex + 1} / {chapters.length} 章 · 已读 {progressPercent}%
      </div>

      <div className={styles.nav}>
        <button
          className={`${styles.navBtn} ${styles.prevBtn}`}
          onClick={handlePrevChapter}
          disabled={currentIndex === 0}
        >
          ← 上一章
        </button>
        <button
          className={`${styles.navBtn} ${styles.nextBtn}`}
          onClick={handleNextChapter}
          disabled={currentIndex >= chapters.length - 1}
        >
          下一章 →
        </button>
      </div>

      {showTipModal && (
        <div className={styles.drawerOverlay} onClick={() => setShowTipModal(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()} style={{ padding: 'var(--space-xl)' }}>
            <div className={styles.drawerHandle} />
            <h3 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-serif)' }}>打赏作者</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
              {[50, 100, 200, 500, 1000, 2000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTipAmount(amt)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: tipAmount === amt ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: tipAmount === amt ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    color: tipAmount === amt ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontWeight: tipAmount === amt ? 600 : 400,
                  }}
                >
                  {amt} 书币
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="写句鼓励的话（选填）"
              value={tipMessage}
              onChange={e => setTipMessage(e.target.value)}
              maxLength={200}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                marginBottom: 'var(--space-lg)',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ marginBottom: 'var(--space-sm)', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              余额: {userBalance} 书币
            </div>
            <Button variant="primary" size="lg" block onClick={handleTip} loading={tipping} disabled={tipping || userBalance < tipAmount}>
              {userBalance < tipAmount ? '余额不足' : `打赏 ${tipAmount} 书币`}
            </Button>
          </div>
        </div>
      )}

      {showThemePicker && (
        <div className={styles.themePicker}>
          {THEMES.map(t => (
            <button
              key={t.name}
              className={`${styles.themeDot} ${readerTheme === t.name ? styles.themeDotActive : ''}`}
              style={{ backgroundColor: t.bg, borderColor: t.name === 'black' ? '#555' : 'var(--color-border)' }}
              onClick={() => handleThemeChange(t.name)}
              title={t.label}
            >
              <span style={{ color: t.color }}>Aa</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.settingsBar}>
        <button className={styles.settingsBtn} onClick={() => { setShowCatalog(true); setCatalogTab('chapters') }}>
          <List size={16} />
          <span>目录</span>
        </button>
        <button className={styles.settingsBtn} onClick={() => setShowThemePicker(!showThemePicker)}>
          <Palette size={16} />
          <span>主题</span>
        </button>
        <button className={styles.settingsBtn} onClick={handleModeChange}>
          <ScrollText size={16} />
          <span>{readerMode === 'page' ? '翻页' : '滚动'}</span>
        </button>
        <div className={styles.fontSizeGroup}>
          <button
            className={styles.fontSizeBtn}
            onClick={() => handleFontSizeChange(fontSize - 2)}
            disabled={fontSize <= 12}
          >
            A⁻
          </button>
          <span style={{ fontWeight: 600 }}>Aa</span>
          <button
            className={styles.fontSizeBtn}
            onClick={() => handleFontSizeChange(fontSize + 2)}
            disabled={fontSize >= 24}
          >
            A⁺
          </button>
        </div>
        <button className={styles.settingsBtn} onClick={toggleBookmark}>
          <BookmarkIcon size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          <span>{isBookmarked ? '已存' : '书签'}</span>
        </button>
        <button className={styles.settingsBtn} onClick={() => setShowTipModal(true)}>
          <Heart size={16} />
          <span>打赏</span>
        </button>
        <button className={styles.settingsBtn} onClick={() => navigate(`/book/${bookId}/comments`)}>
          <span>💬</span>
          <span>评论</span>
        </button>
      </div>

      {showCatalog && (
        <div className={styles.drawerOverlay} onClick={() => setShowCatalog(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHandle} />
            <div className={styles.drawerTabs}>
              <button
                className={`${styles.drawerTab} ${catalogTab === 'chapters' ? styles.drawerTabActive : ''}`}
                onClick={() => setCatalogTab('chapters')}
              >
                目录
              </button>
              <button
                className={`${styles.drawerTab} ${catalogTab === 'bookmarks' ? styles.drawerTabActive : ''}`}
                onClick={() => setCatalogTab('bookmarks')}
              >
                书签
              </button>
            </div>
            <div className={styles.drawerBody}>
              {catalogTab === 'chapters' ? (
                chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className={`${styles.drawerItem} ${ch.id === Number(chapterId) ? styles.drawerItemActive : ''}`}
                    onClick={() => {
                      navigate(`/read/${bookId}/${ch.id}`, { state: { from: fromPath.current } })
                      setShowCatalog(false)
                    }}
                  >
                    <span className={styles.drawerItemTitle}>{ch.title}</span>
                    {ch.id === Number(chapterId) && <span className={styles.drawerItemTag}>当前</span>}
                  </div>
                ))
              ) : bookmarks.length === 0 ? (
                <div className={styles.drawerEmpty}>暂无书签</div>
              ) : (
                bookmarks
                  .filter(b => b.bookId === Number(bookId))
                  .map((b) => (
                    <div
                      key={`${b.bookId}-${b.chapterId}`}
                      className={`${styles.drawerItem} ${b.chapterId === Number(chapterId) ? styles.drawerItemActive : ''}`}
                      onClick={() => {
                        navigate(`/read/${b.bookId}/${b.chapterId}`, { state: { from: fromPath.current } })
                        setShowCatalog(false)
                      }}
                    >
                      <span className={styles.drawerItemTitle}>{b.chapterTitle}</span>
                      <span className={styles.drawerItemDate}>
                        {b.createTime ? new Date(b.createTime).toLocaleDateString() : (b.timestamp ? new Date(b.timestamp).toLocaleDateString() : '')}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
