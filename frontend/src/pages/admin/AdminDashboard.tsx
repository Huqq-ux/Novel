import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authorApi } from '../../services/api'

interface StatCard {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
  trend?: { value: number; isUp: boolean }
}

interface RecentApplication {
  id: number
  penName: string
  status: number
  createTime: string
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  })
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pendingRes, allRes]: any[] = await Promise.all([
        authorApi.getPendingApplications(),
        authorApi.getAllApplications(),
      ])

      const pendingData = pendingRes?.data || []
      const allData = allRes?.data || []

      setStats({
        pendingApplications: pendingData.length,
        totalApplications: allData.length,
        approvedApplications: allData.filter((a: any) => a.status === 1).length,
        rejectedApplications: allData.filter((a: any) => a.status === 2).length,
      })

      setRecentApplications(allData.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards: StatCard[] = [
    {
      title: '待审核申请',
      value: stats.pendingApplications,
      color: 'var(--color-primary)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: '总申请数',
      value: stats.totalApplications,
      color: 'var(--color-accent)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      title: '已通过',
      value: stats.approvedApplications,
      color: 'var(--color-info)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      title: '已拒绝',
      value: stats.rejectedApplications,
      color: 'var(--color-danger)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  ]

  const getStatusBadge = (status: number) => {
    const styles: Record<number, { bg: string; color: string; text: string }> = {
      0: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)', text: '待审核' },
      1: { bg: 'var(--color-accent-light)', color: 'var(--color-accent)', text: '已通过' },
      2: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', text: '已拒绝' },
    }
    const style = styles[status] || styles[0]
    return (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {style.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--color-text-tertiary)', marginTop: '16px' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {statCards.map((card, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer',
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
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', margin: 0 }}>{card.title}</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0', color: 'var(--color-text-primary)' }}>
                  {card.value}
                </p>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: `${card.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>最近申请</h3>
            <span
              onClick={() => navigate('/admin/author-audit')}
              style={{ color: 'var(--color-primary)', cursor: 'pointer', fontSize: '14px' }}
            >
              查看全部 →
            </span>
          </div>
          {recentApplications.length > 0 ? (
            <div>
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--color-divider)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {app.penName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{app.penName}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                        {new Date(app.createTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)' }}>
              暂无申请记录
            </div>
          )}
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <h3 style={{ margin: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>审核统计</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>待审核</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {stats.pendingApplications} / {stats.totalApplications || 1}
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: 'var(--color-divider)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(stats.pendingApplications / (stats.totalApplications || 1)) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '4px',
                    transition: 'width 0.5s',
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>已通过</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {stats.approvedApplications} / {stats.totalApplications || 1}
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: 'var(--color-divider)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(stats.approvedApplications / (stats.totalApplications || 1)) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: '4px',
                    transition: 'width 0.5s',
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>已拒绝</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {stats.rejectedApplications} / {stats.totalApplications || 1}
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: 'var(--color-divider)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(stats.rejectedApplications / (stats.totalApplications || 1)) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-danger)',
                    borderRadius: '4px',
                    transition: 'width 0.5s',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'var(--color-accent-light)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-primary)' }}>审核通过率</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                {stats.totalApplications > 0
                  ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
                  : 0}
                % 的申请已通过审核
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginTop: '24px',
        }}
      >
        <h3 style={{ margin: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>快捷操作</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div
            onClick={() => navigate('/admin/author-audit')}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '20px',
              backgroundColor: 'var(--color-primary-light)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-primary)' }}>审核作者申请</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  {stats.pendingApplications} 条待处理
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '20px',
              backgroundColor: 'var(--color-accent-light)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-primary)' }}>内容管理</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>管理书籍和章节</p>
              </div>
            </div>
          </div>
          <div
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '20px',
              backgroundColor: 'var(--color-warning-light)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2">
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-primary)' }}>数据报表</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>查看详细统计</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
