import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { authorApi } from '../services/api'
import Button from '../components/Button'
import Tag from '../components/Tag'
import Input from '../components/Input'
import Toast from '../components/Toast'
import Empty from '../components/Empty'
import styles from './AuthorAudit.module.css'

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

export default function AuthorAudit() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [pendingApplications, setPendingApplications] = useState<Application[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [auditComment, setAuditComment] = useState('')
  const [processing, setProcessing] = useState(false)

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

      if (pendingRes && pendingRes.code === 200) {
        setPendingApplications(pendingRes.data)
      }
      if (allRes && allRes.code === 200) {
        setApplications(allRes.data)
      }
    } catch (error) {
      console.error('Failed to load applications:', error)
      Toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (id: number) => {
    try {
      const response: any = await authorApi.getApplicationDetail(id)
      if (response && response.code === 200) {
        setSelectedApplication(response.data)
        setAuditComment('')
      }
    } catch (error) {
      Toast.error('加载详情失败')
    }
  }

  const handleApprove = async (id: number) => {
    if (!window.confirm('确定通过该申请吗？')) return
    setProcessing(true)
    try {
      const response: any = await authorApi.approveApplication(id, auditComment)
      if (response && response.code === 200) {
        Toast.success('审核通过')
        setSelectedApplication(null)
        loadData()
      } else {
        Toast.error(response?.message || '操作失败')
      }
    } catch (error: any) {
      Toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (id: number) => {
    if (!auditComment.trim()) {
      Toast.info('请填写拒绝原因')
      return
    }
    if (!window.confirm('确定拒绝该申请吗？')) return
    setProcessing(true)
    try {
      const response: any = await authorApi.rejectApplication(id, auditComment)
      if (response && response.code === 200) {
        Toast.success('已拒绝申请')
        setSelectedApplication(null)
        loadData()
      } else {
        Toast.error(response?.message || '操作失败')
      }
    } catch (error: any) {
      Toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="primary">待审核</Tag>
      case 1:
        return <Tag color="accent">已通过</Tag>
      case 2:
        return <Tag color="danger">已拒绝</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const renderApplicationItem = (app: Application) => (
    <div key={app.id} className={styles.appItem} onClick={() => handleViewDetail(app.id)}>
      <div className={styles.appAvatar}>
        {app.penName?.charAt(0) || app.username?.charAt(0) || '?'}
      </div>
      <div className={styles.appContent}>
        <div className={styles.appName}>
          <span>{app.penName || app.username}</span>
          {getStatusTag(app.status)}
        </div>
        <div className={styles.appMeta}>{app.specialty || '未填写擅长类型'}</div>
        <div className={styles.appTime}>{new Date(app.createTime).toLocaleString()}</div>
      </div>
      <span style={{ color: 'var(--color-text-tertiary)' }}>&gt;</span>
    </div>
  )

  if (loading) {
    return <div className={styles.loadingWrap}>加载中...</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.backBtn} onClick={() => navigate('/admin')}>
          <ArrowLeft size={18} color="#fff" />
        </div>
        <h2 className={styles.headerTitle}>作者申请审核</h2>
      </div>

      {selectedApplication ? (
        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <span className={styles.detailTitle}>申请详情</span>
            <Button variant="text" size="sm" onClick={() => setSelectedApplication(null)}>
              返回列表
            </Button>
          </div>

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>申请人</span>
              <span className={styles.detailValue}>{selectedApplication.penName || selectedApplication.username}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>真实姓名</span>
              <span className={styles.detailValue}>{selectedApplication.realName}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>联系电话</span>
              <span className={styles.detailValue}>{selectedApplication.phone}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>联系邮箱</span>
              <span className={styles.detailValue}>{selectedApplication.email}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>笔名</span>
              <span className={styles.detailValue}>{selectedApplication.penName}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>擅长类型</span>
              <span className={styles.detailValue}>{selectedApplication.specialty}</span>
            </div>
            <div className={styles.detailBlock}>
              <div className={styles.detailBlockLabel}>个人简介</div>
              <div className={styles.detailBlockContent}>{selectedApplication.introduction}</div>
            </div>
            {selectedApplication.workSamples && selectedApplication.workSamples.length > 0 && (
              <div className={styles.detailBlock}>
                <div className={styles.detailBlockLabel}>作品示例</div>
                <div className={styles.detailBlockContent}>
                  {selectedApplication.workSamples.map((sample, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <a href={sample} target="_blank" rel="noopener noreferrer" className={styles.detailLink}>
                        {sample}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>申请时间</span>
              <span className={styles.detailValue}>{new Date(selectedApplication.createTime).toLocaleString()}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>状态</span>
              {getStatusTag(selectedApplication.status)}
            </div>
            {selectedApplication.status !== 0 && selectedApplication.auditComment && (
              <div className={styles.detailBlock}>
                <div className={styles.detailBlockLabel}>审核意见</div>
                <div className={styles.detailBlockContent}>{selectedApplication.auditComment}</div>
              </div>
            )}
          </div>

          {selectedApplication.status === 0 && (
            <>
              <div className={styles.auditSection}>
                <div className={styles.auditLabel}>审核意见</div>
                <Input
                  placeholder="请输入审核意见（拒绝时必填）"
                  value={auditComment}
                  onChange={setAuditComment}
                  rows={3}
                />
              </div>
              <div className={styles.auditActions}>
                <Button
                  variant="primary"
                  block
                  loading={processing}
                  onClick={() => handleApprove(selectedApplication.id)}
                >
                  通过
                </Button>
                <Button
                  variant="primary"
                  danger
                  block
                  loading={processing}
                  onClick={() => handleReject(selectedApplication.id)}
                >
                  拒绝
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className={styles.tabBar}>
            <div
              className={`${styles.tabItem} ${activeTab === 'pending' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              待审核 ({pendingApplications.length})
            </div>
            <div
              className={`${styles.tabItem} ${activeTab === 'all' ? styles.tabItemActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              全部 ({applications.length})
            </div>
          </div>

          {activeTab === 'pending' && (
            pendingApplications.length > 0
              ? pendingApplications.map(renderApplicationItem)
              : <Empty description="暂无待审核申请" />
          )}
          {activeTab === 'all' && (
            applications.length > 0
              ? applications.map(renderApplicationItem)
              : <Empty description="暂无申请记录" />
          )}
        </>
      )}
    </div>
  )
}
