import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { TabBar, SpinLoading } from 'antd-mobile'
import { HomeOutlined, BookOutlined, CompassOutlined, UserOutlined } from '@ant-design/icons'
import { Home, Bookshelf, Discover, User } from './pages'
import AIFloatingAssistant from './components/AIFloatingAssistant'

// Lazy-loaded pages
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

// Lazy-loaded admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AuthorAuditNew = lazy(() => import('./pages/admin/AuthorAuditNew'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const BookManagement = lazy(() => import('./pages/admin/BookManagement'))
const DataReports = lazy(() => import('./pages/admin/DataReports'))
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'))
const PaidBookManagement = lazy(() => import('./pages/admin/PaidBookManagement'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <SpinLoading color="primary" />
  </div>
)

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = location.pathname.split('/')[1] || 'home'

  const tabs = [
    { key: 'home', title: '首页', icon: <HomeOutlined /> },
    { key: 'bookshelf', title: '书架', icon: <BookOutlined /> },
    { key: 'discover', title: '发现', icon: <CompassOutlined /> },
    { key: 'user', title: '我的', icon: <UserOutlined /> },
  ]

  const isAdminRoute = location.pathname.startsWith('/admin')
  const showTabBar = !['/read'].some(path => location.pathname.startsWith(path)) && !isAdminRoute

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
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
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
        <TabBar
          activeKey={activeTab}
          onChange={(key) => {
            navigate(`/${key}`)
          }}
          style={{ position: 'sticky', bottom: 0, left: 0, right: 0 }}
        >
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      )}
      <AIFloatingAssistant />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
