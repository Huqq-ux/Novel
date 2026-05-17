import { useState, useEffect, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authorApi } from '../../services/api'
import styles from './AdminLayout.module.css'

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
    <div className={styles.layout}>
      <aside className={`${styles.sider} ${collapsed ? styles.siderCollapsed : styles.siderExpanded}`}>
        <div
          className={`${styles.logo} ${collapsed ? styles.logoCollapsed : styles.logoExpanded}`}
          onClick={() => setCollapsed(!collapsed)}
        >
          <svg className={styles.logoIcon} viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          {!collapsed && <span className={styles.logoText}>管理后台</span>}
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`${styles.menuItem} ${collapsed ? styles.menuItemCollapsed : styles.menuItemExpanded} ${isActive(item.path) ? styles.menuItemActive : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span className={styles.menuLabel}>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={styles.badge}>{item.badge > 99 ? '99+' : item.badge}</span>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <div
            onClick={() => navigate('/user')}
            className={`${styles.exitBtn} ${collapsed ? styles.exitBtnCollapsed : styles.exitBtnExpanded}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span className={styles.exitLabel}>返回前台</span>}
          </div>
        </div>
      </aside>

      <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : styles.mainExpanded}`}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            {menuItems.find(item => isActive(item.path))?.label || '管理后台'}
          </div>
          <div className={styles.adminAvatar}>A</div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}
