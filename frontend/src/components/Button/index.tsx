import { forwardRef } from 'react'
import type { ButtonProps } from './types'
import styles from './styles.module.css'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  danger = false,
  loading = false,
  disabled = false,
  block = false,
  children,
  onClick,
  className = '',
  style,
}, ref) => {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    danger && styles.danger,
    block && styles.block,
    loading && styles.loading,
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
