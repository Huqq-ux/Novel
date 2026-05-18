import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import styles from './Settings.module.css'

function getInitialDarkMode(): boolean {
  const saved = localStorage.getItem('theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getInitialFontSize(): string {
  return localStorage.getItem('fontSize') || 'medium'
}

export default function Settings() {
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(getInitialDarkMode)
  const [fontSize, setFontSize] = useState(getInitialFontSize)
  const [autoDownload, setAutoDownload] = useState(true)
  const [wifiOnly, setWifiOnly] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light'
    localStorage.setItem('theme', theme)
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [darkMode])

  const fontSizeOptions = [
    { label: '小', value: 'small', demoSize: 12 },
    { label: '中', value: 'medium', demoSize: 14 },
    { label: '大', value: 'large', demoSize: 16 },
  ]

  const handleFontSizeChange = (value: string) => {
    setFontSize(value)
    localStorage.setItem('fontSize', value)
    if (value === 'medium') {
      document.documentElement.removeAttribute('data-font-size')
    } else {
      document.documentElement.setAttribute('data-font-size', value)
    }
    setShowPicker(false)
    Toast.success('字体大小已设置为' + fontSizeOptions.find(o => o.value === value)?.label)
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
              className={`${styles.toggle} ${darkMode ? styles.toggleChecked : ''}`}
              onClick={() => setDarkMode(!darkMode)}
              aria-label="切换深色模式"
            />
          </div>
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>自动下载章节</span>
            <button
              className={`${styles.toggle} ${autoDownload ? styles.toggleChecked : ''}`}
              onClick={() => setAutoDownload(!autoDownload)}
              aria-label="切换自动下载章节"
            />
          </div>
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>仅WiFi下载</span>
            <button
              className={`${styles.toggle} ${wifiOnly ? styles.toggleChecked : ''}`}
              onClick={() => setWifiOnly(!wifiOnly)}
              aria-label="切换仅WiFi下载"
            />
          </div>
          <div
            className={`${styles.settingRow} ${styles.rowClickable}`}
            onClick={() => setShowPicker(true)}
          >
            <span className={styles.rowLabel}>字体大小</span>
            <span className={styles.rowExtra}>
              {fontSizeOptions.find(o => o.value === fontSize)?.label}
              <ChevronRight size={14} />
            </span>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <Card variant="elevated" title="存储管理">
          <div className={styles.settingRow}>
            <span className={styles.rowLabel}>缓存大小</span>
            <span className={styles.rowExtra}>50MB</span>
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
            <span className={styles.rowExtra}>墨语小说团队</span>
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
                className={`${styles.pickerOption} ${fontSize === option.value ? styles.pickerOptionActive : ''}`}
                onClick={() => handleFontSizeChange(option.value)}
              >
                <span style={{ fontSize: option.demoSize, fontWeight: 500 }}>Aa</span>
                <span style={{ fontSize: 'var(--font-size-base)', marginTop: 4 }}>{option.label}</span>
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
