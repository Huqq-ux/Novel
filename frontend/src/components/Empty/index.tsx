import type { EmptyProps } from './types'
import styles from './styles.module.css'

export default function Empty({ icon = '📚', description = '暂无数据', action }: EmptyProps) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.description}>{description}</div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
