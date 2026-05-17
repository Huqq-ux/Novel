import type { ReactNode } from 'react'

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}
