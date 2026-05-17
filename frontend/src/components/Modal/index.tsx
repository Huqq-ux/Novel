import { useEffect } from 'react'
import type { ModalProps } from './types'
import styles from './styles.module.css'

export default function Modal({
  visible, title, content, onClose, onConfirm,
  confirmText = '确认', cancelText = '取消',
  showCancel = true, danger = false,
  footer, children,
}: ModalProps) {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        {title && (
          <div className={styles.header}>
            <div className={styles.title}>{title}</div>
          </div>
        )}
        <div className={styles.body}>
          {content || children}
        </div>
        {footer !== undefined ? footer : (
          <div className={styles.footer}>
            {showCancel && (
              <button className={`${styles.footerBtn} ${styles.cancelBtn}`} onClick={onClose}>
                {cancelText}
              </button>
            )}
            <button
              className={`${styles.footerBtn} ${danger ? styles.dangerBtn : styles.confirmBtn}`}
              onClick={() => { onConfirm?.(); onClose() }}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
