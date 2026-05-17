import { useState, useRef } from 'react'
import type { InputProps } from './types'
import styles from './styles.module.css'

export default function Input({
  prefix, suffix, placeholder, value, defaultValue, clearable,
  error, maxLength, rows = 3, type = 'text',
  onChange, onEnterPress, onFocus, className = '', style,
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const [innerValue, setInnerValue] = useState(defaultValue || '')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : innerValue
  const isTextArea = !!rows && rows > 1

  const wrapperClasses = [
    styles.wrapper,
    focused && styles.focused,
    error && styles.error,
    className,
  ].filter(Boolean).join(' ')

  const inputClasses = [
    styles.input,
    isTextArea && styles.textarea,
  ].filter(Boolean).join(' ')

  const handleChange = (val: string) => {
    if (maxLength && val.length > maxLength) return
    if (!isControlled) setInnerValue(val)
    onChange?.(val)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnterPress) {
      onEnterPress()
    }
  }

  const sharedProps = {
    ref: inputRef as any,
    className: inputClasses,
    placeholder,
    value: currentValue,
    onChange: (e: any) => handleChange(e.target.value),
    onKeyDown: handleKeyDown,
    onFocus: () => { setFocused(true); onFocus?.() },
    onBlur: () => setFocused(false),
  }

  return (
    <div>
      <div className={wrapperClasses} style={style}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        {isTextArea
          ? <textarea {...sharedProps} rows={rows} />
          : <input {...sharedProps} type={type} />
        }
        {clearable && currentValue && (
          <span className={styles.clear} onClick={() => handleChange('')}>&#10005;</span>
        )}
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {error && typeof error === 'string' && <div className={styles.errorText}>{error}</div>}
      {maxLength && <div className={styles.count}>{currentValue.length}/{maxLength}</div>}
    </div>
  )
}
