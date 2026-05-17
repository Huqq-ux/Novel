import { useState } from 'react'
import CustomToast from '../../components/Toast'

const Toast = {
  show: (msg: string) => CustomToast.show({ type: 'info', content: msg }),
}

interface SystemSettings {
  siteName: string
  siteDescription: string
  allowRegister: boolean
  allowComment: boolean
  maintenanceMode: boolean
  dailySignInReward: number
  maxUploadSize: number
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: '墨语小说',
    siteDescription: '免费阅读平台',
    allowRegister: true,
    allowComment: true,
    maintenanceMode: false,
    dailySignInReward: 10,
    maxUploadSize: 5,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      Toast.show('设置已保存')
    } catch (error) {
      Toast.show('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({
      siteName: '墨语小说',
      siteDescription: '免费阅读平台',
      allowRegister: true,
      allowComment: true,
      maintenanceMode: false,
      dailySignInReward: 10,
      maxUploadSize: 5,
    })
    Toast.show('已重置为默认设置')
  }

  return (
    <div>
      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>基础设置</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              网站名称
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                outline: 'none',
                maxWidth: '400px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              网站描述
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                maxWidth: '400px',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>功能开关</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>开放注册</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>允许新用户注册账号</p>
            </div>
            <div
              onClick={() => setSettings({ ...settings, allowRegister: !settings.allowRegister })}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: settings.allowRegister ? 'var(--color-primary)' : 'var(--color-border)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.3s',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-card)',
                  position: 'absolute',
                  top: '2px',
                  left: settings.allowRegister ? '26px' : '2px',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>评论功能</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>允许用户发表评论</p>
            </div>
            <div
              onClick={() => setSettings({ ...settings, allowComment: !settings.allowComment })}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: settings.allowComment ? 'var(--color-primary)' : 'var(--color-border)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.3s',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-card)',
                  position: 'absolute',
                  top: '2px',
                  left: settings.allowComment ? '26px' : '2px',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>维护模式</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>开启后普通用户无法访问</p>
            </div>
            <div
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: settings.maintenanceMode ? 'var(--color-danger)' : 'var(--color-border)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.3s',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-card)',
                  position: 'absolute',
                  top: '2px',
                  left: settings.maintenanceMode ? '26px' : '2px',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>奖励设置</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              每日签到奖励（书币）
            </label>
            <input
              type="number"
              value={settings.dailySignInReward}
              onChange={(e) => setSettings({ ...settings, dailySignInReward: Number(e.target.value) })}
              min={0}
              style={{
                width: '200px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              用户每日签到可获得的奖励书币数量
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>上传设置</h3>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            最大上传大小（MB）
          </label>
          <input
            type="number"
            value={settings.maxUploadSize}
            onChange={(e) => setSettings({ ...settings, maxUploadSize: Number(e.target.value) })}
            min={1}
            max={100}
            style={{
              width: '200px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            用户上传文件的最大限制
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 32px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '12px 32px',
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          重置默认
        </button>
      </div>
    </div>
  )
}
