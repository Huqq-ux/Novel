import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Dialog, Toast } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { signInApi } from '../services/api'

interface SignInStatus {
  todaySigned: boolean
  continuousDays: number
  totalDays: number
  todayReward: number
  rewards: { day: number; reward: number; signed: boolean }[]
}

export default function DailySignIn() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<SignInStatus>({
    todaySigned: false,
    continuousDays: 0,
    totalDays: 0,
    todayReward: 10,
    rewards: [],
  })
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    loadSignInStatus()
  }, [])

  const loadSignInStatus = async () => {
    setLoading(true)
    try {
      const response: any = await signInApi.getStatus()
      if (response && response.code === 200) {
        setStatus(response.data)
      }
    } catch (error) {
      console.error('Failed to load sign in status:', error)
      Toast.show('加载签到状态失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (status.todaySigned) {
      Toast.show('今日已签到')
      return
    }

    if (signing) {
      return
    }

    setSigning(true)
    try {
      const response: any = await signInApi.signIn()
      if (response && response.code === 200) {
        setStatus(response.data)
        
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser)
            user.coinBalance = (user.coinBalance || 0) + response.data.todayReward
            localStorage.setItem('user', JSON.stringify(user))
          } catch (e) {
            console.error('Failed to update user balance:', e)
          }
        }
        
        Dialog.alert({
          content: `签到成功！获得 ${response.data.todayReward} 书币`,
          confirmText: '确定',
        })
      } else if (response && response.code === 400) {
        Toast.show('今日已签到')
        loadSignInStatus()
      }
    } catch (error: any) {
      console.error('Failed to sign in:', error)
      if (error.response?.data?.message) {
        Toast.show(error.response.data.message)
      } else {
        Toast.show('签到失败')
      }
    } finally {
      setSigning(false)
    }
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
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          每日签到
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      ) : (
        <>
          <Card style={{ marginBottom: '16px', textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              连续签到 {status.continuousDays} 天
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              累计签到 {status.totalDays} 天
            </div>
            <Button
              color="primary"
              size="large"
              disabled={status.todaySigned || signing}
              loading={signing}
              onClick={handleSignIn}
              style={{ width: '200px', margin: '0 auto' }}
            >
              {status.todaySigned ? '今日已签到' : signing ? '签到中...' : '立即签到'}
            </Button>
            {status.todaySigned && (
              <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '8px' }}>
                ✓ 今日已获得 {status.todayReward} 书币
              </div>
            )}
          </Card>

          <Card title="签到奖励" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              {status.rewards.map((item) => (
                <div
                  key={item.day}
                  style={{
                    textAlign: 'center',
                    opacity: item.signed ? 1 : 0.5,
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: item.signed ? '#1677ff' : '#f0f0f0',
                      color: item.signed ? '#fff' : '#999',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.signed ? '✓' : item.day}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{item.reward}币</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="签到规则">
            <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
              <p>1. 每日签到可获得书币奖励</p>
              <p>2. 连续签到天数越多，奖励越丰厚</p>
              <p>3. 连续签到7天可获得额外奖励</p>
              <p>4. 中断签到将重新计算连续天数</p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
