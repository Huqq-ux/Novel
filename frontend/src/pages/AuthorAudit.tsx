import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Tabs, List, Tag, Dialog, TextArea, Toast, Empty } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { authorApi } from '../services/api'

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
      Toast.show('加载失败')
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
      Toast.show('加载详情失败')
    }
  }

  const handleApprove = async (id: number) => {
    Dialog.confirm({
      content: '确定通过该申请吗？',
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

  const getStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="primary">待审核</Tag>
      case 1:
        return <Tag color="success">已通过</Tag>
      case 2:
        return <Tag color="danger">已拒绝</Tag>
      default:
        return <Tag>未知</Tag>
    }
  }

  const renderApplicationItem = (app: Application) => (
    <List.Item
      key={app.id}
      onClick={() => handleViewDetail(app.id)}
      arrow
      prefix={
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1677ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '16px',
          }}
        >
          {app.penName?.charAt(0) || app.username?.charAt(0) || '?'}
        </div>
      }
      description={
        <div>
          <div style={{ marginBottom: '4px' }}>{app.specialty || '未填写擅长类型'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {new Date(app.createTime).toLocaleString()}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{app.penName || app.username}</span>
        {getStatusTag(app.status)}
      </div>
    </List.Item>
  )

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', paddingTop: '100px' }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div
          onClick={() => navigate('/admin')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: '12px',
          }}
        >
          <LeftOutline fontSize={18} color="#fff" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>作者申请审核</h2>
      </div>

      {selectedApplication ? (
        <Card
          title="申请详情"
          extra={
            <Button size="small" onClick={() => setSelectedApplication(null)}>
              返回列表
            </Button>
          }
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>申请人：</span>
              <span>{selectedApplication.penName || selectedApplication.username}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>真实姓名：</span>
              <span>{selectedApplication.realName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>联系电话：</span>
              <span>{selectedApplication.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>联系邮箱：</span>
              <span>{selectedApplication.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>笔名：</span>
              <span>{selectedApplication.penName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>擅长类型：</span>
              <span>{selectedApplication.specialty}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>个人简介：</div>
              <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                {selectedApplication.introduction}
              </div>
            </div>
            {selectedApplication.workSamples && selectedApplication.workSamples.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#666', marginBottom: '4px' }}>作品示例：</div>
                <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {selectedApplication.workSamples.map((sample, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <a href={sample} target="_blank" rel="noopener noreferrer" style={{ color: '#1677ff' }}>
                        {sample}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>申请时间：</span>
              <span>{new Date(selectedApplication.createTime).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>状态：</span>
              {getStatusTag(selectedApplication.status)}
            </div>
            {selectedApplication.status !== 0 && selectedApplication.auditComment && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#666', marginBottom: '4px' }}>审核意见：</div>
                <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {selectedApplication.auditComment}
                </div>
              </div>
            )}
          </div>

          {selectedApplication.status === 0 && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: '#666', marginBottom: '8px' }}>审核意见：</div>
                <TextArea
                  placeholder="请输入审核意见（拒绝时必填）"
                  value={auditComment}
                  onChange={setAuditComment}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  color="primary"
                  style={{ flex: 1 }}
                  loading={processing}
                  onClick={() => handleApprove(selectedApplication.id)}
                >
                  通过
                </Button>
                <Button
                  color="danger"
                  style={{ flex: 1 }}
                  loading={processing}
                  onClick={() => handleReject(selectedApplication.id)}
                >
                  拒绝
                </Button>
              </div>
            </>
          )}
        </Card>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
        >
          <Tabs.Tab title={`待审核 (${pendingApplications.length})`} key="pending">
            {pendingApplications.length > 0 ? (
              <List>{pendingApplications.map(renderApplicationItem)}</List>
            ) : (
              <Empty description="暂无待审核申请" />
            )}
          </Tabs.Tab>
          <Tabs.Tab title={`全部 (${applications.length})`} key="all">
            {applications.length > 0 ? (
              <List>{applications.map(renderApplicationItem)}</List>
            ) : (
              <Empty description="暂无申请记录" />
            )}
          </Tabs.Tab>
        </Tabs>
      )}
    </div>
  )
}
