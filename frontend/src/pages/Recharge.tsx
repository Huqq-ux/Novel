import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Toast, Dialog } from 'antd-mobile'
import { coinApi } from '../services/api'

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
      Toast.show('请选择充值套餐')
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

        Dialog.alert({
          content: `充值成功！获得 ${response.data?.amount || pkg.coins + pkg.bonus} 书币`,
          confirmText: '确定',
        })

        loadData()
        setSelectedPackage(null)
      } else {
        Toast.show(response?.message || '充值失败')
      }
    } catch (error: any) {
      console.error('Failed to recharge:', error)
      Toast.show(error.response?.data?.message || '充值失败')
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          zIndex: 100,
        }}
      >
        <div
          onClick={() => navigate(-1)}
          style={{ fontSize: '24px', marginRight: '12px', cursor: 'pointer' }}
        >
          ←
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>充值中心</div>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px 16px',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>
          当前书币余额
        </div>
        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
          {balance.toLocaleString()}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          background: '#fff',
          borderBottom: '1px solid #eee',
        }}
      >
        <div
          onClick={() => setActiveTab('packages')}
          style={{
            flex: 1,
            padding: '12px',
            textAlign: 'center',
            borderBottom:
              activeTab === 'packages' ? '2px solid #667eea' : 'none',
            color: activeTab === 'packages' ? '#667eea' : '#666',
            fontWeight: activeTab === 'packages' ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          充值套餐
        </div>
        <div
          onClick={() => setActiveTab('records')}
          style={{
            flex: 1,
            padding: '12px',
            textAlign: 'center',
            borderBottom:
              activeTab === 'records' ? '2px solid #667eea' : 'none',
            color: activeTab === 'records' ? '#667eea' : '#666',
            fontWeight: activeTab === 'records' ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          充值记录
        </div>
      </div>

      {activeTab === 'packages' && (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
          >
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                style={{
                  background:
                    selectedPackage === pkg.id ? '#e8f4ff' : '#fff',
                  border:
                    selectedPackage === pkg.id
                      ? '2px solid #667eea'
                      : '1px solid #eee',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                  {pkg.coins}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  书币
                </div>
                {pkg.bonus > 0 && (
                  <div
                    style={{
                      background: '#ff6b6b',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      display: 'inline-block',
                      marginTop: '6px',
                    }}
                  >
                    送 {pkg.bonus} 书币
                  </div>
                )}
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ff6b6b',
                    marginTop: '8px',
                  }}
                >
                  ¥{pkg.price}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: '#fff9e6',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#996600',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>温馨提示</div>
            <div>• 书币可用于解锁付费章节</div>
            <div>• 充值后书币立即到账</div>
            <div>• 书币一经充值，不支持退款</div>
          </div>

          <Button
            block
            color="primary"
            size="large"
            style={{ marginTop: '24px', borderRadius: '24px' }}
            onClick={handleRecharge}
            loading={loading}
            disabled={!selectedPackage || loading}
          >
            {selectedPackage ? '立即充值' : '请选择套餐'}
          </Button>
        </div>
      )}

      {activeTab === 'records' && (
        <div style={{ padding: '16px' }}>
          {records.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#999',
              }}
            >
              暂无充值记录
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '12px' }}>
              {records.map((record, index) => (
                <div
                  key={record.id}
                  style={{
                    padding: '16px',
                    borderBottom:
                      index < records.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>
                        充值 {record.amount} 书币
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {formatDate(record.createTime)}
                      </div>
                    </div>
                    <div
                      style={{
                        background: record.status === 1 ? '#e6f7e6' : '#fee',
                        color: record.status === 1 ? '#52c41a' : '#ff4d4f',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    >
                      {record.status === 1 ? '成功' : '失败'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
