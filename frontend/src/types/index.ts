export interface Book {
  id: number
  title: string
  author: string
  cover: string
  description: string
  category: string
  status: string
  wordCount: number
  chapterCount: number
  rating: number
  updateTime: string
  isFinished: boolean
}

export interface Chapter {
  id: number
  bookId: number
  title: string
  content: string
  order: number
  wordCount: number
}

export interface BookshelfItem {
  id: number
  bookId: number
  book: Book
  lastChapterId: number
  lastReadTime: string
  progress: number
}

export interface User {
  id: number
  username: string
  avatar: string
  email: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResponse<T> {
  list: T[]
  total: number
}
