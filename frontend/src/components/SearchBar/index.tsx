import { useState } from 'react'
import type { SearchBarProps } from './types'
import { Search } from 'lucide-react'
import styles from './styles.module.css'

export default function SearchBar({ placeholder = '搜索书名或作者', onSearch, onFocus }: SearchBarProps) {
  const [value, setValue] = useState('')

  return (
    <div className={styles.wrapper}>
      <Search size={16} className={styles.icon} />
      <input
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={onFocus}
        onKeyDown={e => {
          if (e.key === 'Enter') onSearch?.(value)
        }}
      />
    </div>
  )
}
