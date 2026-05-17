import { useState, useEffect } from 'react'
import CustomToast from '../../components/Toast'
import { adminApi } from '../../services/api'

const Toast = {
  show: (msg: string) => CustomToast.show({ type: 'info', content: msg }),
}
const confirmDialog = (content: string, onConfirm: () => void) => {
  if (window.confirm(content)) onConfirm()
}

interface User {
  id: number
  username: string
  email: string
  avatar: string
  role: string
  isAuthor: number
  status: number
  coinBalance: number
  createTime: string
  lastLoginTime: string
}

interface UserListResponse {
  list: User[]
  total: number
  page: number
  pageSize: number
}

export default function UserManagement() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)

  useEffect(() => {
    loadUsers()
  }, [page, roleFilter, statusFilter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (roleFilter) params.role = roleFilter
      if (statusFilter !== undefined) params.status = statusFilter

      const response: any = await adminApi.getUsers(params)
      if (response && response.code === 200) {
        const data: UserListResponse = response.data
        setUsers(data.list)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      Toast.show('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadUsers()
  }

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 1 ? 0 : 1
    const action = newStatus === 0 ? '禁用' : '启用'

    confirmDialog(`确定要${action}用户 "${user.username}" 吗？`, async () => {
      try {
        const response: any = await adminApi.updateUserStatus(user.id, newStatus)
        if (response && response.code === 200) {
          Toast.show(`${action}成功`)
          loadUsers()
        } else {
          Toast.show(response?.message || '操作失败')
        }
      } catch (error: any) {
        Toast.show(error.response?.data?.message || '操作失败')
      }
    })
  }

  const handleUpdateRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    const action = newRole === 'admin' ? '设为管理员' : '取消管理员'

    confirmDialog(`确定要${action} "${user.username}" 吗？`, async () => {
      try {
        const response: any = await adminApi.updateUserRole(user.id, newRole)
        if (response && response.code === 200) {
          Toast.show('角色已更新')
          loadUsers()
        } else {
          Toast.show(response?.message || '操作失败')
        }
      } catch (error: any) {
        Toast.show(error.response?.data?.message || '操作失败')
      }
    })
  }

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: 'var(--color-accent-light)',
            color: 'var(--color-accent)',
          }}
        >
          正常
        </span>
      )
    }
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
        }}
      >
        已禁用
      </span>
    )
  }

  const getRoleBadge = (role: string, isAuthor: number) => {
    const badges = []
    
    if (role === 'admin') {
      badges.push(
        <span
          key="admin"
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            backgroundColor: 'var(--color-primary-dark)',
            color: 'var(--color-text-inverse)',
            marginRight: '4px',
          }}
        >
          管理员
        </span>
      )
    }
    
    if (isAuthor === 1) {
      badges.push(
        <span
          key="author"
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
          }}
        >
          作者
        </span>
      )
    }
    
    if (badges.length === 0) {
      badges.push(
        <span
          key="user"
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            backgroundColor: 'var(--color-divider)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          用户
        </span>
      )
    }
    
    return <div style={{ display: 'flex', gap: '4px' }}>{badges}</div>
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && users.length === 0) {
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
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-tertiary)"
              strokeWidth="2"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                width: '220px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <option value="">全部角色</option>
            <option value="admin">管理员</option>
            <option value="user">普通用户</option>
          </select>

          <select
            value={statusFilter === undefined ? '' : statusFilter}
            onChange={(e) => {
              const val = e.target.value
              setStatusFilter(val === '' ? undefined : Number(val))
              setPage(1)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'var(--color-card)',
            }}
          >
            <option value="">全部状态</option>
            <option value="1">正常</option>
            <option value="0">已禁用</option>
          </select>

          <button
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            搜索
          </button>
        </div>

        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
          共 {total} 个用户
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg)' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                用户信息
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                角色
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                书币余额
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                注册时间
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                状态
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid var(--color-divider)',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-inverse)',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          overflow: 'hidden',
                        }}
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>{user.username}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>{getRoleBadge(user.role, user.isAuthor)}</td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{user.coinBalance || 0}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
                    {new Date(user.createTime).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(user.status)}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: user.status === 1 ? 'var(--color-danger-light)' : 'var(--color-accent-light)',
                          color: user.status === 1 ? 'var(--color-danger)' : 'var(--color-accent)',
                          border: `1px solid ${user.status === 1 ? 'var(--color-danger)' : 'var(--color-accent)'}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {user.status === 1 ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => handleUpdateRole(user)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: user.role === 'admin' ? 'var(--color-primary-light)' : 'var(--color-primary-light)',
                          color: user.role === 'admin' ? 'var(--color-primary-dark)' : 'var(--color-primary)',
                          border: `1px solid ${user.role === 'admin' ? 'var(--color-primary-dark)' : 'var(--color-primary)'}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {user.role === 'admin' ? '取消管理员' : '设为管理员'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="1.5"
                    style={{ margin: '0 auto 16px' }}
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <p style={{ margin: 0 }}>暂无用户数据</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div
            style={{
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-divider)',
            }}
          >
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
              第 {page} / {totalPages} 页
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 12px',
                  backgroundColor: page === 1 ? 'var(--color-bg)' : 'var(--color-card)',
                  color: page === 1 ? 'var(--color-border)' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 12px',
                  backgroundColor: page === totalPages ? 'var(--color-bg)' : 'var(--color-primary)',
                  color: page === totalPages ? 'var(--color-border)' : 'var(--color-text-inverse)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
