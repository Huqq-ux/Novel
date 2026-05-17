import type { ReactNode } from 'react'

export interface TabItem {
  key: string
  title: string
  icon: ReactNode
  badge?: number | string
}

export interface TabBarProps {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}
