export interface InfiniteScrollProps {
  loadMore: () => Promise<void>
  hasMore: boolean
  loading?: boolean
  children: React.ReactNode
}
