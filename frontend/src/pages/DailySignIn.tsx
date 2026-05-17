import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { signInApi } from '../services/api'
import Button from '../components/Button'
import Toast from '../components/Toast'
import styles from './DailySignIn.module.css'

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
      Toast.error('加载签到状态失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (status.todaySigned) {
      Toast.info('今日已签到')
      return
    }

    if (signing) return

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

        Toast.success(`签到成功！获得 ${response.data.todayReward} 书币`)
      } else if (response && response.code === 400) {
        Toast.info('今日已签到')
        loadSignInStatus()
      }
    } catch (error: any) {
      console.error('Failed to sign in:', error)
      if (error.response?.data?.message) {
        Toast.error(error.response.data.message)
      } else {
        Toast.error('签到失败')
      }
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.backBtn} onClick={() => navigate('/user')}>
          <ArrowLeft size={18} color="#fff" />
        </div>
        <h2 className={styles.headerTitle}>每日签到</h2>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>加载中...</div>
      ) : (
        <>
          <div className={styles.signInCard}>
            <div className={styles.signInIcon}>🎁</div>
            <div className={styles.signInStats}>连续签到 {status.continuousDays} 天</div>
            <div className={styles.signInSubStats}>累计签到 {status.totalDays} 天</div>
            <div className={styles.signInBtn}>
              <Button
                variant="primary"
                size="lg"
                disabled={status.todaySigned || signing}
                loading={signing}
                onClick={handleSignIn}
              >
                {status.todaySigned ? '今日已签到' : signing ? '签到中...' : '立即签到'}
              </Button>
            </div>
            {status.todaySigned && (
              <div className={styles.signedBadge}>✓ 今日已获得 {status.todayReward} 书币</div>
            )}
          </div>

          <div className={styles.rewardsCard}>
            <div className={styles.rewardsTitle}>签到奖励</div>
            <div className={styles.rewardsGrid}>
              {status.rewards.map((item) => (
                <div
                  key={item.day}
                  className={`${styles.rewardItem} ${item.signed ? styles.rewardItemSigned : ''}`}
                >
                  <div className={`${styles.rewardCircle} ${!item.signed ? styles.rewardCircleUnsigned : ''}`}>
                    {item.signed ? '✓' : item.day}
                  </div>
                  <div className={styles.rewardDay}>{item.reward}币</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.rulesCard}>
            <div className={styles.rulesTitle}>签到规则</div>
            <div className={styles.rulesList}>
              <p>1. 每日签到可获得书币奖励</p>
              <p>2. 连续签到天数越多，奖励越丰厚</p>
              <p>3. 连续签到7天可获得额外奖励</p>
              <p>4. 中断签到将重新计算连续天数</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
