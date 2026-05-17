import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { authorApi } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import Tag from '../components/Tag'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import styles from './BecomeAuthor.module.css'

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
  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Form fields for step 1 (application)
  const [realName, setRealName] = useState('')
  const [phone, setPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [penName, setPenName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [workSamples, setWorkSamples] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Modal state for verification code dialog
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [codeModalContent, setCodeModalContent] = useState('')

  // Modal state for success dialog
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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
      Toast.show({ content: '请输入邮箱地址' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.show({ content: '请输入有效的邮箱地址' })
      return
    }

    setSendingCode(true)
    try {
      const response: any = await authorApi.sendVerifyCode(email)
      if (response && response.code === 200) {
        const code = response.data?.code
        if (code) {
          setCodeModalContent(`验证码已生成（开发模式）\n\n验证码: ${code}\n\n请复制此验证码进行验证`)
          setShowCodeModal(true)
          setVerifyCode(code)
        }
        setCodeSent(true)
        setCountdown(60)
      } else {
        Toast.show({ content: response?.message || '发送失败' })
      }
    } catch (error: any) {
      Toast.show({ content: error.response?.data?.message || '发送失败' })
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!verifyCode) {
      Toast.show({ content: '请输入验证码' })
      return
    }

    try {
      const response: any = await authorApi.verifyEmail(verifyCode)
      if (response && response.code === 200) {
        Toast.success('邮箱验证成功')
        setCurrentStep(1)
      } else {
        Toast.show({ content: response?.message || '验证失败' })
      }
    } catch (error: any) {
      Toast.show({ content: error.response?.data?.message || '验证失败' })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!realName.trim()) {
      errors.realName = '请输入真实姓名'
    }
    if (!phone.trim()) {
      errors.phone = '请输入联系电话'
    }
    if (!formEmail.trim()) {
      errors.formEmail = '请输入联系邮箱'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      errors.formEmail = '请输入有效的邮箱地址'
    }
    if (!penName.trim()) {
      errors.penName = '请输入笔名'
    }
    if (!specialty.trim()) {
      errors.specialty = '请输入擅长类型'
    }
    if (!introduction.trim()) {
      errors.introduction = '请输入个人简介'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const response: any = await authorApi.apply({
        realName,
        phone,
        email: formEmail,
        penName,
        specialty,
        workSamples: workSamples ? workSamples.split('\n').filter((s: string) => s.trim()) : [],
        introduction,
      })

      if (response && response.code === 200) {
        setShowSuccessModal(true)
      } else {
        Toast.show({ content: response?.message || '提交失败' })
      }
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      Toast.show({ content: error.response?.data?.message || '提交失败' })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusText = (statusCode: number) => {
    switch (statusCode) {
      case 0:
        return { text: '待审核', color: 'warning' as const }
      case 1:
        return { text: '已通过', color: 'accent' as const }
      case 2:
        return { text: '已拒绝', color: 'danger' as const }
      default:
        return { text: '未知', color: 'default' as const }
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        加载中...
      </div>
    )
  }

  if (status?.isAuthor) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/user')}>
            <ArrowLeft size={18} />
          </button>
          <h2 className={styles.title}>成为作者</h2>
        </div>

        <Card variant="elevated" className={styles.statusCard}>
          <div className={styles.statusIcon}>
            <CheckCircle size={64} color="var(--color-accent)" />
          </div>
          <div className={styles.statusTitle}>
            您已经是作者了
          </div>
          <div className={styles.statusMeta}>
            您可以开始发布您的作品了
          </div>
          <div className={styles.statusAction}>
            <Button variant="primary" onClick={() => navigate('/author/works')}>
              发布作品
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (status?.hasPendingApplication && status.latestApplication) {
    const statusInfo = getStatusText(status.latestApplication.status)
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/user')}>
            <ArrowLeft size={18} />
          </button>
          <h2 className={styles.title}>成为作者</h2>
        </div>

        <Card variant="elevated" className={styles.statusCard}>
          <div className={styles.statusIcon}>
            <Clock size={64} color="var(--color-warning)" />
          </div>
          <div className={styles.statusTitle}>
            申请已提交
          </div>
          <div className={styles.statusTag}>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </div>
          <div className={styles.statusMeta}>
            提交时间：{new Date(status.latestApplication.createTime).toLocaleString()}
          </div>
          {status.latestApplication.status === 0 && (
            <div className={styles.statusHint}>
              请耐心等待管理员审核
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/user')}>
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.title}>成为作者</h2>
      </div>

      <div className={styles.steps}>
        <div className={`${styles.step} ${currentStep >= 0 ? styles.stepActive : ''} ${currentStep > 0 ? styles.stepDone : ''}`}>
          <div className={styles.stepDot}>
            {currentStep > 0 ? <CheckCircle size={14} /> : '1'}
          </div>
          <div className={styles.stepLabel}>验证邮箱</div>
        </div>
        <div className={`${styles.step} ${currentStep >= 1 ? styles.stepActive : ''} ${currentStep > 1 ? styles.stepDone : ''}`}>
          <div className={styles.stepDot}>
            {currentStep > 1 ? <CheckCircle size={14} /> : '2'}
          </div>
          <div className={styles.stepLabel}>填写资料</div>
        </div>
        <div className={`${styles.step} ${currentStep >= 2 ? styles.stepActive : ''}`}>
          <div className={styles.stepDot}>3</div>
          <div className={styles.stepLabel}>等待审核</div>
        </div>
      </div>

      {currentStep === 0 && (
        <Card title="验证邮箱" variant="elevated" className={styles.verifySection}>
          <div className={styles.verifyHint}>
            请先验证您的邮箱地址，以确保身份真实性
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>邮箱</label>
            <Input
              placeholder="请输入邮箱地址"
              value={email}
              onChange={setEmail}
              type="email"
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>验证码</label>
            <div className={styles.codeRow}>
              <Input
                placeholder="请输入验证码"
                value={verifyCode}
                onChange={setVerifyCode}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSendCode}
                loading={sendingCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </Button>
            </div>
          </div>
          <div className={styles.verifyBtn}>
            <Button
              variant="primary"
              block
              onClick={handleVerifyEmail}
              disabled={!codeSent}
            >
              验证邮箱
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card title="填写申请资料" variant="elevated" className={styles.formSection}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>真实姓名 *</label>
            <Input
              placeholder="请输入真实姓名"
              value={realName}
              onChange={(v) => { setRealName(v); setFormErrors(prev => ({ ...prev, realName: '' })) }}
              error={formErrors.realName}
            />
            {formErrors.realName && (
              <div className={styles.formHelp} style={{ color: 'var(--color-danger)' }}>{formErrors.realName}</div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>联系电话 *</label>
            <Input
              placeholder="请输入联系电话"
              value={phone}
              onChange={(v) => { setPhone(v); setFormErrors(prev => ({ ...prev, phone: '' })) }}
              error={formErrors.phone}
            />
            {formErrors.phone && (
              <div className={styles.formHelp} style={{ color: 'var(--color-danger)' }}>{formErrors.phone}</div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>联系邮箱 *</label>
            <Input
              placeholder="请输入联系邮箱"
              value={formEmail || email}
              onChange={(v) => { setFormEmail(v); setFormErrors(prev => ({ ...prev, formEmail: '' })) }}
              type="email"
              error={formErrors.formEmail}
            />
            {formErrors.formEmail && (
              <div className={styles.formHelp} style={{ color: 'var(--color-danger)' }}>{formErrors.formEmail}</div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>笔名 *</label>
            <Input
              placeholder="请输入笔名"
              value={penName}
              onChange={(v) => { setPenName(v); setFormErrors(prev => ({ ...prev, penName: '' })) }}
              error={formErrors.penName}
            />
            {formErrors.penName && (
              <div className={styles.formHelp} style={{ color: 'var(--color-danger)' }}>{formErrors.penName}</div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>擅长类型 *</label>
            <Input
              placeholder="如：玄幻、都市、言情等"
              value={specialty}
              onChange={(v) => { setSpecialty(v); setFormErrors(prev => ({ ...prev, specialty: '' })) }}
              error={formErrors.specialty}
            />
            {formErrors.specialty && (
              <div className={styles.formHelp} style={{ color: 'var(--color-danger)' }}>{formErrors.specialty}</div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>作品示例</label>
            <Input
              placeholder="请输入作品链接，每行一个"
              value={workSamples}
              onChange={setWorkSamples}
              rows={3}
            />
            <div className={styles.formHelp}>请输入作品链接，每行一个</div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>个人简介 *</label>
            <Input
              placeholder="请简单介绍您的写作经历和风格"
              value={introduction}
              onChange={(v) => { setIntroduction(v); setFormErrors(prev => ({ ...prev, introduction: '' })) }}
              rows={4}
              maxLength={500}
              error={formErrors.introduction}
            />
            {formErrors.introduction && (
              <div className={styles.formHelp} style={{ color: 'var(--color-danger)' }}>{formErrors.introduction}</div>
            )}
          </div>
          <div className={styles.submitBtn}>
            <Button
              variant="primary"
              block
              loading={submitting}
              onClick={handleSubmit}
            >
              提交申请
            </Button>
          </div>
        </Card>
      )}

      <Card title="申请须知" variant="elevated">
        <div className={styles.noticeCard}>
          <p>1. 请确保填写的信息真实有效</p>
          <p>2. 作品示例可以是您在其他平台发布过的作品链接</p>
          <p>3. 审核通过后，您将获得作者身份，可以发布作品</p>
          <p>4. 如有疑问，请联系客服</p>
        </div>
      </Card>

      <Modal
        visible={showCodeModal}
        title="验证码"
        content={<div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{codeModalContent}</div>}
        onClose={() => setShowCodeModal(false)}
        showCancel={false}
        confirmText="确定"
      />

      <Modal
        visible={showSuccessModal}
        title="提示"
        content="申请已提交，请等待管理员审核"
        onClose={() => { setShowSuccessModal(false); navigate('/user') }}
        onConfirm={() => { setShowSuccessModal(false); navigate('/user') }}
        showCancel={false}
        confirmText="确定"
      />
    </div>
  )
}
