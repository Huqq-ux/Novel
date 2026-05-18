import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BookshelfItem } from '../types'

interface BookshelfStore {
  bookshelf: BookshelfItem[]
  setBookshelf: (items: BookshelfItem[]) => void
  addToBookshelf: (item: BookshelfItem) => void
  removeFromBookshelf: (bookId: number) => void
  updateProgress: (bookId: number, chapterId: number) => void
  isInBookshelf: (bookId: number) => boolean
  getLastChapterId: (bookId: number) => number | null
  getBookshelfItem: (bookId: number) => BookshelfItem | undefined
  clearBookshelf: () => void
}

export const useBookshelfStore = create<BookshelfStore>()(
  persist(
    (set, get) => ({
      bookshelf: [],
      /**
       * 设置书架列表
       * @param items - 书架项数组
       */
      setBookshelf: (items) => {
        set({ bookshelf: items })
      },
      /**
       * 添加书籍到书架
       * 如果书籍已在书架中则不重复添加
       * @param item - 书架项
       */
      addToBookshelf: (item) => {
        set((state) => {
          if (state.bookshelf.find((b) => b.bookId === item.bookId)) {
            return state
          }
          return { bookshelf: [...state.bookshelf, item] }
        })
      },
      /**
       * 从书架移除书籍
       * @param bookId - 书籍ID
       */
      removeFromBookshelf: (bookId) => {
        set((state) => ({
          bookshelf: state.bookshelf.filter((b) => b.bookId !== bookId),
        }))
      },
      /**
       * 更新阅读进度
       * @param bookId - 书籍ID
       * @param chapterId - 章节ID
       */
      updateProgress: (bookId, chapterId) => {
        set((state) => ({
          bookshelf: state.bookshelf.map((b) =>
            b.bookId === bookId
              ? { ...b, lastChapterId: chapterId, lastReadTime: new Date().toISOString() }
              : b
          ),
        }))
      },
      /**
       * 检查书籍是否在书架中
       * @param bookId - 书籍ID
       * @returns 书籍是否在书架中
       */
      isInBookshelf: (bookId) => {
        return get().bookshelf.some((b) => b.bookId === bookId)
      },
      /**
       * 获取书籍的最后阅读章节ID
       * @param bookId - 书籍ID
       * @returns 最后阅读章节ID，如果书籍不在书架中则返回null
       */
      getLastChapterId: (bookId) => {
        const item = get().bookshelf.find((b) => b.bookId === bookId)
        return item?.lastChapterId || null
      },
      /**
       * 获取书架项
       * @param bookId - 书籍ID
       * @returns 书架项，如果不存在则返回undefined
       */
      getBookshelfItem: (bookId) => {
        return get().bookshelf.find((b) => b.bookId === bookId)
      },
      clearBookshelf: () => {
        set({ bookshelf: [] })
        localStorage.removeItem('bookshelf-storage')
      },
    }),
    {
      name: 'bookshelf-storage',
    }
  )
)