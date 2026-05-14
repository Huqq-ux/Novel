import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Card, Avatar, Button, Input, Form, Dialog, Toast } from 'antd-mobile'
import { userApi } from '../services/api'
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '../utils/passwordValidation'

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
    <div style={{ position: 'relative' }}>
      <Input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        style={{ paddingRight: '40px' }}
        aria-label={placeholder}
        aria-describedby={visible ? 'password-visible' : 'password-hidden'}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? '隐藏密码' : '显示密码'}
        aria-pressed={visible}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          color: '#999',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#1677ff'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
          </svg>
        )}
      </button>
      <span id={visible ? 'password-visible' : 'password-hidden'} style={{ display: 'none' }}>
        {visible ? '密码已显示为明文' : '密码已隐藏'}
      </span>
    </div>
  )
}

export default function User() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [form] = Form.useForm()
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

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

  const handleLogin = async (values: { username: string; password: string }) => {
    console.log('handleLogin called with:', values)
    try {
      const response: any = await userApi.login(values.username, values.password)
      console.log('login response:', response)
      if (response.code === 200) {
        localStorage.setItem('accessToken', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setUser(response.data.user)
        setShowLogin(false)
        Toast.show({ icon: 'success', content: '登录成功' })
      } else {
        Toast.show({ icon: 'fail', content: response.message || '登录失败' })
      }
    } catch (error: any) {
      console.error('login error:', error)
      Toast.show({ icon: 'fail', content: error.response?.data?.message || '登录失败' })
    }
  }

  const handleRegister = async (values: { username: string; password: string; email: string }) => {
    const passwordValidation = validatePassword(values.password)
    if (!passwordValidation.isValid) {
      Toast.show({ icon: 'fail', content: '密码强度不足' })
      return
    }

    try {
      const response: any = await userApi.register(values.username, values.password, values.email)
      if (response.code === 200) {
        Toast.show({ icon: 'success', content: '注册成功，请登录' })
        setIsRegister(false)
        form.resetFields()
        setPasswordStrength('weak')
        setPasswordErrors([])
      } else {
        Toast.show({ icon: 'fail', content: response.message || '注册失败' })
      }
    } catch (error: any) {
      let errorMessage = '注册失败';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Toast.show({ icon: 'fail', content: errorMessage })
    }
  }

  const handleLogout = () => {
    Dialog.confirm({
      content: '确定要退出登录吗？',
      onConfirm: () => {
        userApi.logout()
        setUser(null)
        Toast.show({ icon: 'success', content: '已退出登录' })
      },
    })
  }

  const menuItems = [
    { icon: '📖', title: '我的阅读', desc: '阅读历史', path: '/reading-history' },
    { icon: '💬', title: '我的评论', desc: '评论记录', path: '/my-comments' },
    { icon: '❤️', title: '我的收藏', desc: '收藏的小说', path: '/my-favorites' },
    { icon: '💰', title: '充值中心', desc: '充值书币', path: '/recharge' },
    { icon: '🎁', title: '每日签到', desc: '领取奖励', path: '/daily-signin' },
    { icon: '✍️', title: '成为作者', desc: '申请成为作者', path: '/become-author' },
    { icon: '📚', title: '我的作品', desc: '管理作品', path: '/author-books' },
    { icon: '🔔', title: '消息通知', desc: '系统消息', path: '/notifications' },
    { icon: '⚙️', title: '设置', desc: '应用设置', path: '/settings' },
    { icon: '❓', title: '帮助与反馈', desc: '常见问题', path: '/help-feedback' },
  ]

  const adminMenuItems = [
    { icon: '👑', title: '管理后台', desc: '进入管理后台', path: '/admin' },
  ]

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar
            src={user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` : 'https://placehold.co/80x80/eee/999?text=User'}
            style={{ '--size': '64px' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
              {user ? user.username : '游客'}
            </div>
            <div style={{ fontSize: '14px', color: '#999' }}>
              {user ? user.email : '点击登录'}
            </div>
            {user && (
              <div style={{ fontSize: '14px', color: '#ff9500', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>💰</span>
                <span>书币: {user.coinBalance || 0}</span>
              </div>
            )}
          </div>
          {user ? (
            <Button size='small' onClick={handleLogout}>
              退出
            </Button>
          ) : (
            <Button size='small' color='primary' onClick={() => setShowLogin(true)}>
              登录
            </Button>
          )}
        </div>
      </Card>

      <Card title="我的服务" style={{ marginBottom: '16px' }}>
        <List>
          {menuItems.map((item, index) => (
            <List.Item
              key={index}
              onClick={() => navigate(item.path)}
              style={{ padding: '12px 0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{item.desc}</div>
                </div>
                <span style={{ color: '#999' }}>→</span>
              </div>
            </List.Item>
          ))}
        </List>
      </Card>

      {user?.role === 'admin' && (
        <Card title="管理员功能" style={{ marginBottom: '16px' }}>
          <List>
            {adminMenuItems.map((item, index) => (
              <List.Item
                key={index}
                onClick={() => navigate(item.path)}
                style={{ padding: '12px 0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{item.desc}</div>
                  </div>
                  <span style={{ color: '#999' }}>→</span>
                </div>
              </List.Item>
            ))}
          </List>
        </Card>
      )}

      <Card title="关于">
        <List>
          <List.Item style={{ padding: '12px 0' }}>
            <div style={{ fontSize: '14px' }}>
              <div>版本: 1.0.0</div>
              <div style={{ color: '#999', marginTop: '4px' }}>
                番茄小说 - 免费阅读平台
              </div>
            </div>
          </List.Item>
        </List>
      </Card>

      <Dialog
        visible={showLogin}
        title={isRegister ? '注册' : '登录'}
        content={
          <div>
            <Form
              form={form}
              layout='vertical'
              onFinish={isRegister ? handleRegister : handleLogin}
            >
              <Form.Item
                name='username'
                label='用户名'
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder='请输入用户名' aria-label='用户名' />
              </Form.Item>
              <Form.Item
                name='password'
                label='密码'
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <PasswordInput 
                  placeholder='请输入密码'
                  onPasswordChange={handlePasswordChange}
                />
              </Form.Item>
              {isRegister && (
                <>
                  {form.getFieldValue('password') && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>密码强度</span>
                        <span style={{ color: getPasswordStrengthColor(passwordStrength) }}>
                          {getPasswordStrengthText(passwordStrength)}
                        </span>
                      </div>
                      <div style={{ 
                        height: '6px', 
                        backgroundColor: '#eee', 
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${passwordStrength === 'strong' ? 100 : passwordStrength === 'medium' ? 60 : 30}%`,
                          height: '100%',
                          backgroundColor: getPasswordStrengthColor(passwordStrength),
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      {passwordErrors.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                          {passwordErrors.map((error, index) => (
                            <div key={index}>• {error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <Form.Item
                    name='email'
                    label='邮箱'
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱' },
                    ]}
                  >
                    <Input placeholder='请输入邮箱' aria-label='邮箱' />
                  </Form.Item>
                </>
              )}
              <Button 
                block 
                color='primary'
                onClick={() => form.submit()}
              >
                {isRegister ? '注册' : '登录'}
              </Button>
            </Form>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <Button
                fill='none'
                style={{ flex: 1 }}
                onClick={() => {
                  setShowLogin(false)
                  form.resetFields()
                  setPasswordStrength('weak')
                  setPasswordErrors([])
                }}
              >
                取消
              </Button>
              <Button
                fill='none'
                style={{ flex: 1 }}
                onClick={() => {
                  setIsRegister(!isRegister)
                  form.resetFields()
                  setPasswordStrength('weak')
                  setPasswordErrors([])
                }}
              >
                {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
              </Button>
            </div>
          </div>
        }
        onClose={() => setShowLogin(false)}
      />
    </div>
  )
}
