import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'

interface Stats {
  totalUsers: number
  totalAuthors: number
  activeUsers: number
  totalBooks: number
  totalChapters: number
  totalWords: number
  totalReads: number
  totalComments: number
}

export default function DataReports() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAuthors: 0,
    activeUsers: 0,
    totalBooks: 0,
    totalChapters: 0,
    totalWords: 0,
    totalReads: 0,
    totalComments: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response: any = await adminApi.getStats()
      if (response && response.code === 200) {
        setStats(prev => ({ ...prev, ...response.data }))
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const userStats = [
    { label: '总用户数', value: stats.totalUsers, color: '#1890ff', icon: '👥' },
    { label: '作者数量', value: stats.totalAuthors, color: '#52c41a', icon: '✍️' },
    { label: '活跃用户', value: stats.activeUsers, color: '#13c2c2', icon: '🔥' },
  ]

  const bookStats = [
    { label: '总书籍数', value: stats.totalBooks, color: '#722ed1', icon: '📚' },
    { label: '总章节数', value: stats.totalChapters, color: '#fa8c16', icon: '📖' },
    { label: '总字数', value: stats.totalWords, color: '#eb2f96', icon: '📝' },
  ]

  const activityStats = [
    { label: '总阅读量', value: stats.totalReads, color: '#1890ff', icon: '👁️' },
    { label: '总评论数', value: stats.totalComments, color: '#52c41a', icon: '💬' },
  ]

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '亿'
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  }

  const renderStatCard = (item: { label: string; value: number; color: string; icon: string }) => (
    <div
      key={item.label}
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'transform 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#8c8c8c', fontSize: '14px', margin: 0 }}>{item.label}</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0', color: '#262626' }}>
            {formatNumber(item.value)}
          </p>
        </div>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: `${item.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          {item.icon}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p style={{ color: '#8c8c8c', marginTop: '16px' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#262626' }}>
          用户统计
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {userStats.map(renderStatCard)}
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#262626' }}>
          内容统计
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {bookStats.map(renderStatCard)}
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#262626' }}>
          活跃度统计
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {activityStats.map(renderStatCard)}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: '#262626' }}>
          数据概览
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#e6f7ff',
              borderRadius: '12px',
              borderLeft: '4px solid #1890ff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>📊</span>
              <span style={{ fontSize: '16px', fontWeight: 500 }}>用户增长趋势</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#595959' }}>
              平台用户持续增长，作者转化率良好
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#52c41a', fontSize: '14px', fontWeight: 500 }}>↑ 12.5%</span>
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>较上月</span>
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: '#f6ffed',
              borderRadius: '12px',
              borderLeft: '4px solid #52c41a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>📚</span>
              <span style={{ fontSize: '16px', fontWeight: 500 }}>内容增长趋势</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#595959' }}>
              书籍和章节数量稳步增长
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#52c41a', fontSize: '14px', fontWeight: 500 }}>↑ 8.3%</span>
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>较上月</span>
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: '#fff7e6',
              borderRadius: '12px',
              borderLeft: '4px solid #fa8c16',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>👁️</span>
              <span style={{ fontSize: '16px', fontWeight: 500 }}>阅读活跃度</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#595959' }}>
              用户阅读时长和频率保持稳定
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#52c41a', fontSize: '14px', fontWeight: 500 }}>↑ 5.2%</span>
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>较上月</span>
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: '#f9f0ff',
              borderRadius: '12px',
              borderLeft: '4px solid #722ed1',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>💬</span>
              <span style={{ fontSize: '16px', fontWeight: 500 }}>互动数据</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#595959' }}>
              评论和收藏活跃度持续提升
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#52c41a', fontSize: '14px', fontWeight: 500 }}>↑ 15.8%</span>
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>较上月</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
