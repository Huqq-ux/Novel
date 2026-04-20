import { useState, useEffect, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Badge } from 'antd-mobile'
import { authorApi } from '../../services/api'

interface AdminLayoutProps {
  children: ReactNode
}

interface Stats {
  pendingApplications: number
  totalUsers: number
  totalBooks: number
  totalAuthors: number
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [stats, setStats] = useState<Stats>({
    pendingApplications: 0,
    totalUsers: 0,
    totalBooks: 0,
    totalAuthors: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response: any = await authorApi.getPendingApplications()
      if (response && response.code === 200) {
        setStats(prev => ({ ...prev, pendingApplications: response.data?.length || 0 }))
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const menuItems = [
    {
      key: '/admin',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      label: '仪表盘',
      path: '/admin',
    },
    {
      key: '/admin/author-audit',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: '作者审核',
      path: '/admin/author-audit',
      badge: stats.pendingApplications,
    },
    {
      key: '/admin/users',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: '用户管理',
      path: '/admin/users',
    },
    {
      key: '/admin/paid-books',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
      label: '付费书籍',
      path: '/admin/paid-books',
    },
    {
      key: '/admin/books',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      label: '书籍管理',
      path: '/admin/books',
    },
    {
      key: '/admin/reports',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      ),
      label: '数据报表',
      path: '/admin/reports',
    },
    {
      key: '/admin/settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      label: '系统设置',
      path: '/admin/settings',
    },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <aside
        style={{
          width: collapsed ? '80px' : '240px',
          backgroundColor: '#001529',
          color: '#fff',
          transition: 'width 0.3s',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#1890ff">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          {!collapsed && (
            <span style={{ marginLeft: '12px', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
              管理后台
            </span>
          )}
        </div>

        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: collapsed ? '12px 0' : '12px 24px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                backgroundColor: isActive(item.path) ? 'rgba(24, 144, 255, 0.2)' : 'transparent',
                borderRight: isActive(item.path) ? '3px solid #1890ff' : '3px solid transparent',
                color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.65)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{ marginLeft: '12px', fontSize: '14px', flex: 1 }}>
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge && item.badge > 0 && (
                <Badge content={item.badge} style={{ '--right': '-10px' }} />
              )}
            </div>
          ))}
        </nav>

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            onClick={() => navigate('/user')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span style={{ marginLeft: '12px', fontSize: '14px' }}>返回前台</span>}
          </div>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: collapsed ? '80px' : '240px',
          transition: 'margin-left 0.3s',
          minHeight: '100vh',
        }}
      >
        <header
          style={{
            height: '64px',
            backgroundColor: '#fff',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#262626' }}>
            {menuItems.find(item => isActive(item.path))?.label || '管理后台'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              A
            </div>
          </div>
        </header>

        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
