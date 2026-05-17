import { useState, useEffect } from 'react'
import Toast from './Toast'
import { ratingApi } from '../services/api'

interface RatingStats {
  bookId: number
  averageRating: number
  totalRatings: number
  ratingDistribution: { [key: number]: number }
  ratingPercentage: { [key: number]: number }
}

interface BookRatingProps {
  bookId: number
  onRatingChange?: (rating: number) => void
}

export default function BookRating({ bookId, onRatingChange }: BookRatingProps) {
  const [userRating, setUserRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    loadRatingData()
  }, [bookId])

  const loadRatingData = async () => {
    setLoading(true)
    try {
      const [userRes, statsRes]: any[] = await Promise.all([
        ratingApi.getUserRating(bookId),
        ratingApi.getRatingStats(bookId),
      ])

      if (userRes && userRes.code === 200) {
        setIsLoggedIn(userRes.data?.isLoggedIn || false)
        if (userRes.data?.rating) {
          setUserRating(userRes.data.rating.rating)
        }
      }

      if (statsRes && statsRes.code === 200) {
        setStats(statsRes.data)
      }
    } catch (error) {
      console.error('Failed to load rating data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRating = async (rating: number) => {
    const token = localStorage.getItem('token')
    if (!token) {
      Toast.info('请先登录')
      return
    }

    setSubmitting(true)
    try {
      const response: any = await ratingApi.submitRating(bookId, rating)
      if (response && response.code === 200) {
        setUserRating(rating)
        if (response.data?.stats) {
          setStats(response.data.stats)
        }
        Toast.success('评分成功')
        onRatingChange?.(rating)
      } else {
        Toast.error(response?.message || '评分失败')
      }
    } catch (error: any) {
      Toast.error(error.response?.data?.message || '评分失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStarClick = (rating: number) => {
    if (submitting) return
    handleSubmitRating(rating)
  }

  const renderStars = (size: number = 24, interactive: boolean = false) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = interactive
            ? star <= (hoverRating || userRating)
            : star <= Math.round(stats?.averageRating || 0)
          
          return (
            <span
              key={star}
              onClick={() => interactive && handleStarClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              style={{
                fontSize: `${size}px`,
                cursor: interactive && !submitting ? 'pointer' : 'default',
                color: filled ? '#ffc107' : '#e0e0e0',
                transition: 'color 0.2s, transform 0.1s',
                transform: interactive && hoverRating === star ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              ★
            </span>
          )
        })}
      </div>
    )
  }

  const renderRatingDistribution = () => {
    if (!stats || stats.totalRatings === 0) return null

    return (
      <div style={{ marginTop: '16px' }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.ratingDistribution?.[star] || 0
          const percentage = stats.ratingPercentage?.[star] || 0

          return (
            <div
              key={star}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#666', width: '20px' }}>
                {star}星
              </span>
              <div
                style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: '#ffc107',
                    borderRadius: '4px',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <span style={{ fontSize: '12px', color: '#999', width: '40px', textAlign: 'right' }}>
                {count}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 'bold' }}>
          读者评分
        </h3>
        
        {stats && stats.totalRatings > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
              {stats.averageRating.toFixed(1)}
            </span>
            <div>
              {renderStars(16)}
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                {stats.totalRatings} 人评分
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#999', fontSize: '14px' }}>
            暂无评分
          </div>
        )}

        {renderRatingDistribution()}
      </div>

      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          marginTop: '16px',
        }}
      >
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
          {isLoggedIn ? '为这本书评分：' : '登录后即可评分'}
        </div>
        
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {renderStars(32, true)}
            {userRating > 0 && (
              <span style={{ fontSize: '14px', color: '#ffc107' }}>
                {userRating} 星
              </span>
            )}
            {submitting && (
              <span style={{ fontSize: '14px', color: '#999' }}>提交中...</span>
            )}
          </div>
        ) : (
          <div style={{ color: '#999', fontSize: '13px' }}>
            点击右上角登录后参与评分
          </div>
        )}
      </div>
    </div>
  )
}
