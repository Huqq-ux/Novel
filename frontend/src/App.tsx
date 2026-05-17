import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Home, Book as BookIcon, Compass, User as UserIcon } from 'lucide-react'
import { Home as HomePage, Bookshelf, Discover, User } from './pages'
import AIFloatingAssistant from './components/AIFloatingAssistant'
import TabBar from './components/TabBar'
import type { TabItem } from './components/TabBar/types'

const BookDetail = lazy(() => import('./pages/BookDetail'))
const Reader = lazy(() => import('./pages/Reader'))
const Search = lazy(() => import('./pages/Search'))
const ReadingHistory = lazy(() => import('./pages/ReadingHistory'))
const MyComments = lazy(() => import('./pages/MyComments'))
const MyFavorites = lazy(() => import('./pages/MyFavorites'))
const DailySignIn = lazy(() => import('./pages/DailySignIn'))
const Settings = lazy(() => import('./pages/Settings'))
const HelpFeedback = lazy(() => import('./pages/HelpFeedback'))
const BookComments = lazy(() => import('./pages/BookComments'))
const BecomeAuthor = lazy(() => import('./pages/BecomeAuthor'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Recharge = lazy(() => import('./pages/Recharge'))
const AuthorBooks = lazy(() => import('./pages/AuthorBooks'))
const PaidBooks = lazy(() => import('./pages/PaidBooks'))
const AuthorAudit = lazy(() => import('./pages/AuthorAudit'))

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AuthorAuditNew = lazy(() => import('./pages/admin/AuthorAuditNew'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const BookManagement = lazy(() => import('./pages/admin/BookManagement'))
const DataReports = lazy(() => import('./pages/admin/DataReports'))
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'))
const PaidBookManagement = lazy(() => import('./pages/admin/PaidBookManagement'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{
        width: 24, height: 24,
        border: '2px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }} />
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = location.pathname.split('/')[1] || 'home'

  const tabs: TabItem[] = [
    { key: 'home', title: '首页', icon: <Home size={20} /> },
    { key: 'bookshelf', title: '书架', icon: <BookIcon size={20} /> },
    { key: 'discover', title: '发现', icon: <Compass size={20} /> },
    { key: 'user', title: '我的', icon: <UserIcon size={20} /> },
  ]

  const isAdminRoute = location.pathname.startsWith('/admin')
  const showTabBar = !location.pathname.startsWith('/read') && !isAdminRoute

  if (isAdminRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminLayout>
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/author-audit" element={<AuthorAuditNew />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/paid-books" element={<PaidBookManagement />} />
            <Route path="/admin/books" element={<BookManagement />} />
            <Route path="/admin/reports" element={<DataReports />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
          </Routes>
        </AdminLayout>
      </Suspense>
    )
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/bookshelf" element={<Bookshelf />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/user" element={<User />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/book/:id/comments" element={<BookComments />} />
            <Route path="/read/:bookId/:chapterId" element={<Reader />} />
            <Route path="/search" element={<Search />} />
            <Route path="/reading-history" element={<ReadingHistory />} />
            <Route path="/my-comments" element={<MyComments />} />
            <Route path="/my-favorites" element={<MyFavorites />} />
            <Route path="/daily-signin" element={<DailySignIn />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help-feedback" element={<HelpFeedback />} />
            <Route path="/become-author" element={<BecomeAuthor />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/recharge" element={<Recharge />} />
            <Route path="/author-books" element={<AuthorBooks />} />
            <Route path="/paid-books" element={<PaidBooks />} />
            <Route path="/author-audit" element={<AuthorAudit />} />
          </Routes>
        </Suspense>
      </div>
      {showTabBar && (
        <TabBar items={tabs} activeKey={activeTab} onChange={key => navigate(`/${key}`)} />
      )}
      <AIFloatingAssistant />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
