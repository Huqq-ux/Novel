import { useState, useEffect } from 'react'
import { Dialog, Toast } from 'antd-mobile'
import { authorApi } from '../../services/api'

interface Application {
  id: number
  userId: number
  username: string
  realName: string
  phone: string
  email: string
  penName: string
  specialty: string
  workSamples: string[]
  introduction: string
  status: number
  verified: number
  createTime: string
  updateTime: string
  auditComment?: string
  auditorName?: string
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected'

export default function AuthorAuditNew() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [auditComment, setAuditComment] = useState('')
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, activeFilter, searchQuery])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pendingRes, allRes]: any[] = await Promise.all([
        authorApi.getPendingApplications(),
        authorApi.getAllApplications(),
      ])

      const allData = allRes?.data || []
      setApplications(allData)
    } catch (error) {
      console.error('Failed to load applications:', error)
      Toast.show('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    if (activeFilter !== 'all') {
      const statusMap = { pending: 0, approved: 1, rejected: 2 }
      filtered = filtered.filter((app) => app.status === statusMap[activeFilter])
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.penName?.toLowerCase().includes(query) ||
          app.realName?.toLowerCase().includes(query) ||
          app.email?.toLowerCase().includes(query)
      )
    }

    setFilteredApplications(filtered)
  }

  const handleViewDetail = async (id: number) => {
    try {
      const response: any = await authorApi.getApplicationDetail(id)
      if (response && response.code === 200) {
        setSelectedApplication(response.data)
        setAuditComment('')
      }
    } catch (error) {
      Toast.show('加载详情失败')
    }
  }

  const handleApprove = async (id: number) => {
    Dialog.confirm({
      content: '确定通过该申请吗？',
      confirmText: '确定',
      cancelText: '取消',
      onConfirm: async () => {
        setProcessing(true)
        try {
          const response: any = await authorApi.approveApplication(id, auditComment)
          if (response && response.code === 200) {
            Toast.show('审核通过')
            setSelectedApplication(null)
            loadData()
          } else {
            Toast.show(response?.message || '操作失败')
          }
        } catch (error: any) {
          Toast.show(error.response?.data?.message || '操作失败')
        } finally {
          setProcessing(false)
        }
      },
    })
  }

  const handleReject = async (id: number) => {
    if (!auditComment.trim()) {
      Toast.show('请填写拒绝原因')
      return
    }

    Dialog.confirm({
      content: '确定拒绝该申请吗？',
      confirmText: '确定',
      cancelText: '取消',
      onConfirm: async () => {
        setProcessing(true)
        try {
          const response: any = await authorApi.rejectApplication(id, auditComment)
          if (response && response.code === 200) {
            Toast.show('已拒绝申请')
            setSelectedApplication(null)
            loadData()
          } else {
            Toast.show(response?.message || '操作失败')
          }
        } catch (error: any) {
          Toast.show(error.response?.data?.message || '操作失败')
        } finally {
          setProcessing(false)
        }
      },
    })
  }

  const getStatusBadge = (status: number) => {
    const styles: Record<number, { bg: string; color: string; text: string }> = {
      0: { bg: '#e6f7ff', color: '#1890ff', text: '待审核' },
      1: { bg: '#f6ffed', color: '#52c41a', text: '已通过' },
      2: { bg: '#fff2f0', color: '#ff4d4f', text: '已拒绝' },
    }
    const style = styles[status] || styles[0]
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {style.text}
      </span>
    )
  }

  const getFilterCount = (filter: FilterType) => {
    if (filter === 'all') return applications.length
    const statusMap = { pending: 0, approved: 1, rejected: 2 }
    return applications.filter((app) => app.status === statusMap[filter]).length
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'all', label: '全部' },
  ]

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

  if (selectedApplication) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setSelectedApplication(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#1890ff',
              fontSize: '14px',
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回列表
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>申请详情</h2>
              {getStatusBadge(selectedApplication.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                  笔名
                </label>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>{selectedApplication.penName || '-'}</p>
              </div>
              <div>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                  真实姓名
                </label>
                <p style={{ margin: 0, fontSize: '16px' }}>{selectedApplication.realName || '-'}</p>
              </div>
              <div>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                  联系电话
                </label>
                <p style={{ margin: 0, fontSize: '16px' }}>{selectedApplication.phone || '-'}</p>
              </div>
              <div>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                  联系邮箱
                </label>
                <p style={{ margin: 0, fontSize: '16px' }}>{selectedApplication.email || '-'}</p>
              </div>
              <div>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                  擅长类型
                </label>
                <p style={{ margin: 0, fontSize: '16px' }}>{selectedApplication.specialty || '-'}</p>
              </div>
              <div>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                  申请时间
                </label>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  {new Date(selectedApplication.createTime).toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '8px' }}>
                个人简介
              </label>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}
              >
                {selectedApplication.introduction || '暂无简介'}
              </div>
            </div>

            {selectedApplication.workSamples && selectedApplication.workSamples.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '8px' }}>
                  作品示例
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedApplication.workSamples.map((sample, index) => (
                    <a
                      key={index}
                      href={sample}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f0f2f5',
                        borderRadius: '8px',
                        color: '#1890ff',
                        textDecoration: 'none',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      {sample}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedApplication.auditComment && (
              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '8px' }}>
                  审核意见
                </label>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: selectedApplication.status === 1 ? '#f6ffed' : '#fff2f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                  }}
                >
                  {selectedApplication.auditComment}
                </div>
              </div>
            )}
          </div>

          {selectedApplication.status === 0 && (
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                height: 'fit-content',
              }}
            >
              <h3 style={{ margin: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>审核操作</h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '8px' }}>
                  审核意见
                </label>
                <textarea
                  value={auditComment}
                  onChange={(e) => setAuditComment(e.target.value)}
                  placeholder="请输入审核意见（拒绝时必填）"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d9d9d9',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '100px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1890ff'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d9d9d9'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => handleApprove(selectedApplication.id)}
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    backgroundColor: '#52c41a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: processing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  通过申请
                </button>
                <button
                  onClick={() => handleReject(selectedApplication.id)}
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    backgroundColor: '#fff',
                    color: '#ff4d4f',
                    border: '1px solid #ff4d4f',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: processing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  拒绝申请
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          backgroundColor: '#fff',
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
        <div style={{ display: 'flex', gap: '8px' }}>
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeFilter === filter.key ? '#1890ff' : '#f0f2f5',
                color: activeFilter === filter.key ? '#fff' : '#595959',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {filter.label} ({getFilterCount(filter.key)})
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8c8c8c"
            strokeWidth="2"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="搜索笔名、姓名或邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              borderRadius: '20px',
              border: '1px solid #d9d9d9',
              fontSize: '14px',
              width: '280px',
              outline: 'none',
              transition: 'border-color 0.3s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#1890ff'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d9d9d9'
            }}
          />
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>
                申请人
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>
                真实姓名
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>
                擅长类型
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>
                申请时间
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>
                状态
              </th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: '#8c8c8c' }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => (
                <tr
                  key={app.id}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa'
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
                          borderRadius: '8px',
                          backgroundColor: '#1890ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}
                      >
                        {app.penName?.charAt(0) || app.username?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>{app.penName || app.username}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c' }}>{app.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{app.realName || '-'}</td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{app.specialty || '-'}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#8c8c8c' }}>
                    {new Date(app.createTime).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(app.status)}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleViewDetail(app.id)}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#e6f7ff',
                        color: '#1890ff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#bae7ff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e6f7ff'
                      }}
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#8c8c8c' }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d9d9d9"
                    strokeWidth="1.5"
                    style={{ margin: '0 auto 16px' }}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p style={{ margin: 0 }}>暂无申请记录</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
