import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import styles from './Settings.module.css'

/**
 * 设置页面
 * 功能描述：提供阅读偏好设置、存储管理和应用信息查看
 * 实现逻辑：通过本地 state 管理各项设置开关，字体大小通过 Modal 选择器切换
 */
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
  const [showClearDialog, setShowClearDialog] = useState(false)

  const fontSizeOptions = [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' },
  ]

  const handleFontSizeChange = (value: string) => {
    setSettings({ ...settings, fontSize: value })
    setShowPicker(false)
    Toast.success('设置已保存')
  }

  const handleClearCache = () => {
    setShowClearDialog(true)
  }

  const confirmClearCache = () => {
    setShowClearDialog(false)
    Toast.success('缓存已清除')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="返回"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.headerTitle}>设置</h2>
      </div>

      <div className={styles.section}>
        <Card variant="elevated" title="阅读设置">
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>深色模式</span>
            <button
              className={`${styles.toggle} ${settings.darkMode ? styles.toggleChecked : ''}`}
              onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
              aria-label="切换深色模式"
            />
          </div>
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>自动下载章节</span>
            <button
              className={`${styles.toggle} ${settings.autoDownload ? styles.toggleChecked : ''}`}
              onClick={() => setSettings({ ...settings, autoDownload: !settings.autoDownload })}
              aria-label="切换自动下载章节"
            />
          </div>
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>仅WiFi下载</span>
            <button
              className={`${styles.toggle} ${settings.wifiOnly ? styles.toggleChecked : ''}`}
              onClick={() => setSettings({ ...settings, wifiOnly: !settings.wifiOnly })}
              aria-label="切换仅WiFi下载"
            />
          </div>
          <div
            className={`${styles.settingRow} ${styles.rowClickable}`}
            onClick={() => setShowPicker(true)}
          >
            <span className={styles.rowLabel}>阅读字体大小</span>
            <span className={styles.rowExtra}>
              {fontSizeOptions.find(o => o.value === settings.fontSize)?.label}
              <ChevronRight size={14} />
            </span>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <Card variant="elevated" title="存储管理">
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>缓存大小</span>
            <span className={styles.rowExtra}>{settings.cacheSize}</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>清除缓存</span>
            <button className={styles.rowAction} onClick={handleClearCache}>
              清除缓存
            </button>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <Card variant="elevated" title="关于">
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>版本号</span>
            <span className={styles.rowExtra}>1.0.0</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>开发者</span>
            <span className={styles.rowExtra}>番茄小说团队</span>
          </div>
        </Card>
      </div>

      <Modal
        visible={showPicker}
        title="选择字体大小"
        onClose={() => setShowPicker(false)}
        showCancel={false}
        content={
          <div className={styles.pickerOptions}>
            {fontSizeOptions.map((option) => (
              <button
                key={option.value}
                className={`${styles.pickerOption} ${settings.fontSize === option.value ? styles.pickerOptionActive : ''}`}
                onClick={() => handleFontSizeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      <Modal
        visible={showClearDialog}
        title="清除缓存"
        content="确定要清除缓存吗？"
        onClose={() => setShowClearDialog(false)}
        onConfirm={confirmClearCache}
        confirmText="确定"
      />
    </div>
  )
}
