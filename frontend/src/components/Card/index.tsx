import type { CardProps } from './types'
import styles from './styles.module.css'

export default function Card({
  variant = 'elevated',
  cover,
  title,
  children,
  onClick,
  className = '',
  style,
}: CardProps) {
  const classes = [
    styles.card,
    styles[variant],
    onClick && styles.clickable,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} onClick={onClick} style={style}>
      {cover && <div className={styles.cover}>{cover}</div>}
      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        {children}
      </div>
    </div>
  )
}
