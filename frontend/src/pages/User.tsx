import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Star, MessageSquare, Bell, Settings,
  HelpCircle, Shield, Eye, EyeOff, ChevronRight,
  Coins, CalendarCheck, PenLine, BookText, LogOut,
} from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import { userApi } from '../services/api'
import { validatePassword } from '../utils/passwordValidation'
import styles from './User.module.css'

interface UserInfo {
  id: number
  username: string
  email: string
  role?: string
  coinBalance?: number
}

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  onPasswordChange
}: {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  onPasswordChange?: (value: string) => void
}) => {
  const [visible, setVisible] = useState(false)

  const handleChange = (val: string) => {
    onChange?.(val)
    onPasswordChange?.(val)
  }

  return (
    <div className={styles.passwordWrapper}>
      <Input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? '隐藏密码' : '显示密码'}
        aria-pressed={visible}
        className={styles.passwordToggle}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

export default function User() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [formValues, setFormValues] = useState({ username: '', password: '', email: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse user data:', e)
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handlePasswordChange = (value: string) => {
    if (isRegister && value) {
      const result = validatePassword(value)
      setPasswordStrength(result.strength)
      setPasswordErrors(result.errors)
    } else {
      setPasswordStrength('weak')
      setPasswordErrors([])
    }
  }

  const resetForm = () => {
    setFormValues({ username: '', password: '', email: '' })
    setFieldErrors({})
    setPasswordStrength('weak')
    setPasswordErrors([])
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formValues.username.trim()) {
      errors.username = '请输入用户名'
    }
    if (!formValues.password) {
      errors.password = '请输入密码'
    }
    if (isRegister) {
      if (!formValues.email.trim()) {
        errors.email = '请输入邮箱'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
        errors.email = '请输入有效的邮箱'
      }
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    console.log('handleLogin called with:', formValues)
    try {
      const response: any = await userApi.login(formValues.username, formValues.password)
      console.log('login response:', response)
      if (response.code === 200) {
        localStorage.setItem('accessToken', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setUser(response.data.user)
        setShowLogin(false)
        resetForm()
        Toast.success('登录成功')
      } else {
        Toast.error(response.message || '登录失败')
      }
    } catch (error: any) {
      console.error('login error:', error)
      Toast.error(error.response?.data?.message || '登录失败')
    }
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    const passwordValidation = validatePassword(formValues.password)
    if (!passwordValidation.isValid) {
      Toast.error('密码强度不足')
      return
    }

    try {
      const response: any = await userApi.register(formValues.username, formValues.password, formValues.email)
      if (response.code === 200) {
        Toast.success('注册成功，请登录')
        setIsRegister(false)
        resetForm()
      } else {
        Toast.error(response.message || '注册失败')
      }
    } catch (error: any) {
      let errorMessage = '注册失败';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Toast.error(errorMessage)
    }
  }

  const handleLogout = () => {
    userApi.logout()
    setUser(null)
    setShowLogoutConfirm(false)
    Toast.success('已退出登录')
  }

  const openLoginModal = () => {
    resetForm()
    setShowLogin(true)
  }

  const closeLoginModal = () => {
    setShowLogin(false)
    resetForm()
  }

  const toggleMode = () => {
    setIsRegister(!isRegister)
    resetForm()
  }

  const menuItems = [
    { icon: <BookOpen size={20} />, title: '我的阅读', desc: '阅读历史', path: '/reading-history' },
    { icon: <MessageSquare size={20} />, title: '我的评论', desc: '评论记录', path: '/my-comments' },
    { icon: <Star size={20} />, title: '我的收藏', desc: '收藏的小说', path: '/my-favorites' },
    { icon: <Coins size={20} />, title: '充值中心', desc: '充值书币', path: '/recharge' },
    { icon: <CalendarCheck size={20} />, title: '每日签到', desc: '领取奖励', path: '/daily-signin' },
    { icon: <PenLine size={20} />, title: '成为作者', desc: '申请成为作者', path: '/become-author' },
    { icon: <BookText size={20} />, title: '我的作品', desc: '管理作品', path: '/author-books' },
    { icon: <Bell size={20} />, title: '消息通知', desc: '系统消息', path: '/notifications' },
    { icon: <Settings size={20} />, title: '设置', desc: '应用设置', path: '/settings' },
    { icon: <HelpCircle size={20} />, title: '帮助与反馈', desc: '常见问题', path: '/help-feedback' },
  ]

  const adminMenuItems = [
    { icon: <Shield size={20} />, title: '管理后台', desc: '进入管理后台', path: '/admin' },
  ]

  const strengthBarClass = {
    weak: styles.strengthWeak,
    medium: styles.strengthMedium,
    strong: styles.strengthStrong,
  }[passwordStrength]

  const strengthTextClass = {
    weak: styles.strengthTextWeak,
    medium: styles.strengthTextMedium,
    strong: styles.strengthTextStrong,
  }[passwordStrength]

  const strengthWidth = {
    weak: 30,
    medium: 60,
    strong: 100,
  }[passwordStrength]

  const strengthLabel = {
    weak: '弱',
    medium: '中',
    strong: '强',
  }[passwordStrength]

  return (
    <div className={styles.page}>
      {/* Profile Card */}
      <Card className={styles.profileCard}>
        <div className={styles.profileRow}>
          <img
            className={styles.avatar}
            src={user
              ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
              : 'https://placehold.co/80x80/eee/999?text=User'
            }
            alt={user ? user.username : 'User'}
          />
          <div className={styles.userInfo}>
            <div className={styles.username}>
              {user ? user.username : '游客'}
            </div>
            <div className={styles.email}>
              {user ? user.email : '点击登录'}
            </div>
            {user && (
              <div className={styles.coinBalance}>
                <Coins size={14} />
                <span>书币: {user.coinBalance || 0}</span>
              </div>
            )}
          </div>
          <div className={styles.profileActions}>
            {user ? (
              <Button
                variant="text"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={16} style={{ marginRight: 4 }} />
                退出
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={openLoginModal}
              >
                登录
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* My Services Menu */}
      <Card title="我的服务" className={styles.menuCard}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
          >
            <div className={styles.menuIcon}>
              {item.icon}
            </div>
            <div className={styles.menuText}>
              <div className={styles.menuTitle}>{item.title}</div>
              <div className={styles.menuDesc}>{item.desc}</div>
            </div>
            <ChevronRight size={18} className={styles.menuArrow} />
          </div>
        ))}
      </Card>

      {/* Admin Section */}
      {user?.role === 'admin' && (
        <Card title="管理员功能" className={styles.sectionCard}>
          {adminMenuItems.map((item, index) => (
            <div
              key={index}
              className={styles.menuItem}
              onClick={() => navigate(item.path)}
            >
              <div className={styles.menuIcon}>
                {item.icon}
              </div>
              <div className={styles.menuText}>
                <div className={styles.menuTitle}>{item.title}</div>
                <div className={styles.menuDesc}>{item.desc}</div>
              </div>
              <ChevronRight size={18} className={styles.menuArrow} />
            </div>
          ))}
        </Card>
      )}

      {/* About Section */}
      <Card title="关于" className={styles.sectionCard}>
        <div className={styles.aboutContent}>
          <div className={styles.aboutVersion}>版本: 1.0.0</div>
          <div className={styles.aboutDesc}>
            墨语小说 - 免费阅读平台
          </div>
        </div>
      </Card>

      {/* Login / Register Modal */}
      <Modal
        visible={showLogin}
        title={isRegister ? '注册' : '登录'}
        onClose={closeLoginModal}
        showCancel={false}
        footer={null}
      >
        <div className={styles.modalFormBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>用户名</label>
            <Input
              placeholder="请输入用户名"
              value={formValues.username}
              onChange={(val) => {
                setFormValues(prev => ({ ...prev, username: val }))
                if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: '' }))
              }}
              error={fieldErrors.username || undefined}
            />
            {fieldErrors.username && (
              <div className={styles.formError}>{fieldErrors.username}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>密码</label>
            <PasswordInput
              placeholder="请输入密码"
              value={formValues.password}
              onChange={(val) => {
                setFormValues(prev => ({ ...prev, password: val }))
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }))
              }}
              onPasswordChange={handlePasswordChange}
            />
            {fieldErrors.password && (
              <div className={styles.formError}>{fieldErrors.password}</div>
            )}
          </div>

          {isRegister && (
            <>
              {formValues.password && (
                <div className={styles.strengthSection}>
                  <div className={styles.strengthHeader}>
                    <span className={styles.strengthLabel}>密码强度</span>
                    <span className={strengthTextClass}>{strengthLabel}</span>
                  </div>
                  <div className={styles.strengthBarBg}>
                    <div
                      className={`${styles.strengthBarFill} ${strengthBarClass}`}
                      style={{ width: `${strengthWidth}%` }}
                    />
                  </div>
                  {passwordErrors.length > 0 && (
                    <div className={styles.strengthErrors}>
                      {passwordErrors.map((error, index) => (
                        <div key={index} className={styles.strengthErrorItem}>• {error}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>邮箱</label>
                <Input
                  type="email"
                  placeholder="请输入邮箱"
                  value={formValues.email}
                  onChange={(val) => {
                    setFormValues(prev => ({ ...prev, email: val }))
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }))
                  }}
                  error={fieldErrors.email || undefined}
                />
                {fieldErrors.email && (
                  <div className={styles.formError}>{fieldErrors.email}</div>
                )}
              </div>
            </>
          )}

          <Button
            variant="primary"
            block
            onClick={isRegister ? handleRegister : handleLogin}
          >
            {isRegister ? '注册' : '登录'}
          </Button>

          <div className={styles.formActions}>
            <Button
              variant="secondary"
              block
              onClick={closeLoginModal}
            >
              取消
            </Button>
            <Button
              variant="text"
              block
              onClick={toggleMode}
            >
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        title="退出登录"
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        confirmText="确定退出"
        cancelText="取消"
        danger
      >
        <div className={styles.confirmText}>
          确定要退出登录吗？
        </div>
      </Modal>
    </div>
  )
}
