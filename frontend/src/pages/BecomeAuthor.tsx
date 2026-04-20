import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Form, Input, TextArea, Dialog, Toast, Steps, Tag } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { authorApi } from '../services/api'

interface AuthorStatus {
  isAuthor: boolean
  hasPendingApplication: boolean
  latestApplication?: {
    id: number
    status: number
    createTime: string
  }
}

export default function BecomeAuthor() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<AuthorStatus | null>(null)
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    loadStatus()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const response: any = await authorApi.getStatus()
      if (response && response.code === 200) {
        setStatus(response.data)
      }
    } catch (error) {
      console.error('Failed to load author status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCode = async () => {
    if (!email) {
      Toast.show('请输入邮箱地址')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.show('请输入有效的邮箱地址')
      return
    }

    setSendingCode(true)
    try {
      const response: any = await authorApi.sendVerifyCode(email)
      if (response && response.code === 200) {
        const code = response.data?.code
        if (code) {
          Dialog.alert({
            content: `验证码已生成（开发模式）\n\n验证码: ${code}\n\n请复制此验证码进行验证`,
            confirmText: '确定',
          })
          setVerifyCode(code)
        }
        setCodeSent(true)
        setCountdown(60)
      } else {
        Toast.show(response?.message || '发送失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '发送失败')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!verifyCode) {
      Toast.show('请输入验证码')
      return
    }

    try {
      const response: any = await authorApi.verifyEmail(verifyCode)
      if (response && response.code === 200) {
        Toast.show('邮箱验证成功')
        setCurrentStep(1)
      } else {
        Toast.show(response?.message || '验证失败')
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || '验证失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const response: any = await authorApi.apply({
        ...values,
        workSamples: values.workSamples ? values.workSamples.split('\n').filter((s: string) => s.trim()) : [],
      })

      if (response && response.code === 200) {
        Dialog.alert({
          content: '申请已提交，请等待管理员审核',
          confirmText: '确定',
          onConfirm: () => navigate('/user'),
        })
      } else {
        Toast.show(response?.message || '提交失败')
      }
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      Toast.show(error.response?.data?.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusText = (statusCode: number) => {
    switch (statusCode) {
      case 0:
        return { text: '待审核', color: 'primary' }
      case 1:
        return { text: '已通过', color: 'success' }
      case 2:
        return { text: '已拒绝', color: 'danger' }
      default:
        return { text: '未知', color: 'default' }
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '100px 12px 12px 12px', textAlign: 'center' }}>
        加载中...
      </div>
    )
  }

  if (status?.isAuthor) {
    return (
      <div style={{ padding: '12px', paddingBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div
            onClick={() => navigate('/user')}
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
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>成为作者</h2>
        </div>

        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            您已经是作者了
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            您可以开始发布您的作品了
          </div>
          <Button color="primary" onClick={() => navigate('/author/works')}>
            发布作品
          </Button>
        </Card>
      </div>
    )
  }

  if (status?.hasPendingApplication && status.latestApplication) {
    const statusInfo = getStatusText(status.latestApplication.status)
    return (
      <div style={{ padding: '12px', paddingBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div
            onClick={() => navigate('/user')}
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
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>成为作者</h2>
        </div>

        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            申请已提交
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            提交时间：{new Date(status.latestApplication.createTime).toLocaleString()}
          </div>
          {status.latestApplication.status === 0 && (
            <div style={{ fontSize: '14px', color: '#999', marginTop: '16px' }}>
              请耐心等待管理员审核
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div
          onClick={() => navigate('/user')}
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
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>成为作者</h2>
      </div>

      <Steps current={currentStep} style={{ marginBottom: '24px' }}>
        <Steps.Step title="验证邮箱" />
        <Steps.Step title="填写资料" />
        <Steps.Step title="等待审核" />
      </Steps>

      {currentStep === 0 && (
        <Card title="验证邮箱" style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
            请先验证您的邮箱地址，以确保身份真实性
          </div>
          <Form layout="horizontal">
            <Form.Item label="邮箱">
              <Input
                placeholder="请输入邮箱地址"
                value={email}
                onChange={setEmail}
                type="email"
              />
            </Form.Item>
            <Form.Item label="验证码">
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  placeholder="请输入验证码"
                  value={verifyCode}
                  onChange={setVerifyCode}
                  style={{ flex: 1 }}
                />
                <Button
                  size="small"
                  onClick={handleSendCode}
                  loading={sendingCode}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s` : '发送验证码'}
                </Button>
              </div>
            </Form.Item>
          </Form>
          <Button
            color="primary"
            block
            onClick={handleVerifyEmail}
            disabled={!codeSent}
            style={{ marginTop: '16px' }}
          >
            验证邮箱
          </Button>
        </Card>
      )}

      {currentStep === 1 && (
        <Card title="填写申请资料" style={{ marginBottom: '16px' }}>
          <Form form={form} layout="horizontal">
            <Form.Item
              name="realName"
              label="真实姓名"
              rules={[{ required: true, message: '请输入真实姓名' }]}
            >
              <Input placeholder="请输入真实姓名" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="请输入联系电话" type="tel" />
            </Form.Item>
            <Form.Item
              name="email"
              label="联系邮箱"
              initialValue={email}
              rules={[
                { required: true, message: '请输入联系邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入联系邮箱" type="email" />
            </Form.Item>
            <Form.Item
              name="penName"
              label="笔名"
              rules={[{ required: true, message: '请输入笔名' }]}
            >
              <Input placeholder="请输入笔名" />
            </Form.Item>
            <Form.Item
              name="specialty"
              label="擅长类型"
              rules={[{ required: true, message: '请输入擅长类型' }]}
            >
              <Input placeholder="如：玄幻、都市、言情等" />
            </Form.Item>
            <Form.Item
              name="workSamples"
              label="作品示例"
              help="请输入作品链接，每行一个"
            >
              <TextArea
                placeholder="请输入作品链接，每行一个"
                rows={3}
              />
            </Form.Item>
            <Form.Item
              name="introduction"
              label="个人简介"
              rules={[{ required: true, message: '请输入个人简介' }]}
            >
              <TextArea
                placeholder="请简单介绍您的写作经历和风格"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
          <Button
            color="primary"
            block
            loading={submitting}
            onClick={handleSubmit}
            style={{ marginTop: '16px' }}
          >
            提交申请
          </Button>
        </Card>
      )}

      <Card title="申请须知">
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
          <p>1. 请确保填写的信息真实有效</p>
          <p>2. 作品示例可以是您在其他平台发布过的作品链接</p>
          <p>3. 审核通过后，您将获得作者身份，可以发布作品</p>
          <p>4. 如有疑问，请联系客服</p>
        </div>
      </Card>
    </div>
  )
}
