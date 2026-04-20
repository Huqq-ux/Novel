import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Switch, Dialog, Toast, Picker } from 'antd-mobile'
import type { PickerValue } from 'antd-mobile/es/components/picker-view'
import { LeftOutline } from 'antd-mobile-icons'

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    darkMode: false,
    autoDownload: true,
    wifiOnly: true,
    fontSize: 'medium',
    cacheSize: '50MB',
  })
  const [showPicker, setShowPicker] = useState(false)

  const fontSizeOptions = [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' },
  ]

  const handleFontSizeChange = (value: PickerValue[]) => {
    if (value[0]) {
      setSettings({ ...settings, fontSize: String(value[0]) })
      setShowPicker(false)
      Toast.show('设置已保存')
    }
  }

  const handleClearCache = () => {
    Dialog.confirm({
      content: '确定要清除缓存吗？',
      onConfirm: () => {
        Toast.show('缓存已清除')
      },
    })
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div
          onClick={() => navigate(-1)}
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
          设置
        </h2>
      </div>

      <Card title="阅读设置" style={{ marginBottom: '16px' }}>
        <List>
          <List.Item
            extra={<Switch checked={settings.darkMode} onChange={(v) => setSettings({ ...settings, darkMode: v })} />}
          >
            深色模式
          </List.Item>
          <List.Item
            extra={<Switch checked={settings.autoDownload} onChange={(v) => setSettings({ ...settings, autoDownload: v })} />}
          >
            自动下载章节
          </List.Item>
          <List.Item
            extra={<Switch checked={settings.wifiOnly} onChange={(v) => setSettings({ ...settings, wifiOnly: v })} />}
          >
            仅WiFi下载
          </List.Item>
          <List.Item
            extra={fontSizeOptions.find(o => o.value === settings.fontSize)?.label}
            onClick={() => setShowPicker(true)}
          >
            阅读字体大小
          </List.Item>
        </List>
      </Card>

      <Card title="存储管理" style={{ marginBottom: '16px' }}>
        <List>
          <List.Item extra={settings.cacheSize}>
            缓存大小
          </List.Item>
          <List.Item onClick={handleClearCache}>
            <span style={{ color: '#1677ff' }}>清除缓存</span>
          </List.Item>
        </List>
      </Card>

      <Card title="关于" style={{ marginBottom: '16px' }}>
        <List>
          <List.Item extra="1.0.0">版本号</List.Item>
          <List.Item extra="番茄小说团队">开发者</List.Item>
        </List>
      </Card>

      <Picker
        columns={[fontSizeOptions]}
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={handleFontSizeChange}
      />
    </div>
  )
}
