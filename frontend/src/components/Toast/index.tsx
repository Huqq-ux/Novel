import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import type { ToastOptions, ToastType } from './types'
import styles from './styles.module.css'

function ToastItem({ type = 'info', content, onDone }: ToastOptions & { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, type === 'loading' ? 10000 : 2000)
    return () => clearTimeout(timer)
  }, [onDone, type])

  const icons: Record<ToastType, string> = {
    success: '✓', error: '✕', info: 'ℹ', loading: '',
  }

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>{type === 'loading' ? '' : icons[type]}</span>
      {content}
    </div>
  )
}

let toastRoot: ReturnType<typeof createRoot> | null = null
let toastContainer: HTMLDivElement | null = null

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = styles.container
    document.body.appendChild(toastContainer)
    toastRoot = createRoot(toastContainer)
  }
  return toastRoot!
}

const Toast = {
  show(options: ToastOptions) {
    const root = getContainer()
    root.render(<ToastItem {...options} onDone={() => root.render(null)} />)
  },
  success(content: string) { this.show({ type: 'success', content }) },
  error(content: string) { this.show({ type: 'error', content }) },
  info(content: string) { this.show({ type: 'info', content }) },
  loading(content: string) { this.show({ type: 'loading', content }) },
  hide() { toastRoot?.render(null) },
}

export default Toast
