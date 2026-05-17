import type { TabBarProps } from './types'
import styles from './styles.module.css'

export default function TabBar({ items, activeKey, onChange }: TabBarProps) {
  return (
    <div className={styles.tabBar}>
      {items.map(item => {
        const isActive = item.key === activeKey
        return (
          <div
            key={item.key}
            className={`${styles.tabItem} ${isActive ? styles.active : styles.inactive}`}
            onClick={() => onChange(item.key)}
          >
            <div className={styles.icon}>
              {item.icon}
              {item.badge != null && (
                <span className={styles.badge}>
                  {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className={styles.label}>{item.title}</span>
          </div>
        )
      })}
    </div>
  )
}
