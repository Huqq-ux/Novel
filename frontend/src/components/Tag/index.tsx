import type { TagProps } from './types'
import styles from './styles.module.css'

export default function Tag({ color = 'default', children, className = '', style }: TagProps) {
  return (
    <span className={`${styles.tag} ${styles[color]} ${className}`} style={style}>
      {children}
    </span>
  )
}
