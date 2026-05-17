import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { coinApi } from '../services/api'
import Button from '../components/Button'
import Toast from '../components/Toast'
import styles from './Recharge.module.css'

interface RechargePackage {
  id: number
  coins: number
  price: number
  bonus: number
  sortOrder: number
}

interface RechargeRecord {
  id: number
  amount: number
  paymentMethod: string
  transactionId: string
  status: number
  createTime: string
}

export default function Recharge() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState<RechargePackage[]>([])
  const [balance, setBalance] = useState(0)
  const [records, setRecords] = useState<RechargeRecord[]>([])
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'packages' | 'records'>('packages')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [packagesRes, balanceRes, recordsRes]: any = await Promise.all([
        coinApi.getPackages(),
        coinApi.getBalance(),
        coinApi.getRecords(),
      ])

      if (packagesRes?.code === 200) {
        setPackages(packagesRes.data || [])
      }
      if (balanceRes?.code === 200) {
        setBalance(balanceRes.data?.balance || 0)
      }
      if (recordsRes?.code === 200) {
        setRecords(recordsRes.data || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleRecharge = async () => {
    if (!selectedPackage) {
      Toast.info('请选择充值套餐')
      return
    }

    const pkg = packages.find((p) => p.id === selectedPackage)
    if (!pkg) return

    setLoading(true)
    try {
      const response: any = await coinApi.recharge(selectedPackage)
      if (response?.code === 200) {
        const newBalance = response.data?.newBalance || balance + pkg.coins + pkg.bonus
        setBalance(newBalance)

        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          user.coinBalance = newBalance
          localStorage.setItem('user', JSON.stringify(user))
        }

        Toast.success(`充值成功！获得 ${response.data?.amount || pkg.coins + pkg.bonus} 书币`)
        loadData()
        setSelectedPackage(null)
      } else {
        Toast.error(response?.message || '充值失败')
      }
    } catch (error: any) {
      console.error('Failed to recharge:', error)
      Toast.error(error.response?.data?.message || '充值失败')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.backBtn} onClick={() => navigate(-1)}>←</div>
        <div className={styles.headerTitle}>充值中心</div>
      </div>

      <div className={styles.balanceBanner}>
        <div className={styles.balanceLabel}>当前书币余额</div>
        <div className={styles.balanceValue}>{balance.toLocaleString()}</div>
      </div>

      <div className={styles.tabBar}>
        <div
          className={`${styles.tabItem} ${activeTab === 'packages' ? styles.tabItemActive : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          充值套餐
        </div>
        <div
          className={`${styles.tabItem} ${activeTab === 'records' ? styles.tabItemActive : ''}`}
          onClick={() => setActiveTab('records')}
        >
          充值记录
        </div>
      </div>

      {activeTab === 'packages' && (
        <div style={{ padding: 'var(--space-lg)' }}>
          <div className={styles.packagesGrid}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`${styles.packageCard} ${selectedPackage === pkg.id ? styles.packageCardSelected : ''}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <div className={styles.packageCoins}>{pkg.coins}</div>
                <div className={styles.packageLabel}>书币</div>
                {pkg.bonus > 0 && (
                  <div className={styles.packageBonus}>送 {pkg.bonus} 书币</div>
                )}
                <div className={styles.packagePrice}>¥{pkg.price}</div>
              </div>
            ))}
          </div>

          <div className={styles.tipsCard}>
            <div className={styles.tipsTitle}>温馨提示</div>
            <p>• 书币可用于解锁付费章节</p>
            <p>• 充值后书币立即到账</p>
            <p>• 书币一经充值，不支持退款</p>
          </div>

          <div className={styles.submitBtn}>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={handleRecharge}
              loading={loading}
              disabled={!selectedPackage || loading}
            >
              {selectedPackage ? '立即充值' : '请选择套餐'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className={styles.records}>
          {records.length === 0 ? (
            <div className={styles.recordsEmpty}>暂无充值记录</div>
          ) : (
            records.map((record) => (
              <div key={record.id} className={styles.recordItem}>
                <div>
                  <div className={styles.recordAmount}>充值 {record.amount} 书币</div>
                  <div className={styles.recordTime}>{formatDate(record.createTime)}</div>
                </div>
                <div className={`${styles.recordStatus} ${record.status === 1 ? styles.recordStatusSuccess : styles.recordStatusFail}`}>
                  {record.status === 1 ? '成功' : '失败'}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
