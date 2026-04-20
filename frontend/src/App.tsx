import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { HomeOutlined, BookOutlined, CompassOutlined, UserOutlined } from '@ant-design/icons'
import { Home, Bookshelf, Discover, User, BookDetail, Reader, Search, ReadingHistory, MyComments, MyFavorites, DailySignIn, Settings, HelpFeedback, CustomerService, BookComments, BecomeAuthor, Notifications, Recharge, AuthorBooks, PaidBooks } from './pages'
import { AdminLayout, AdminDashboard, AuthorAuditNew, UserManagement, BookManagement, DataReports, SystemSettings, PaidBookManagement } from './pages/admin'

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
    )
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
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
          <Route path="/customer-service" element={<CustomerService />} />
          <Route path="/become-author" element={<BecomeAuthor />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/recharge" element={<Recharge />} />
          <Route path="/author-books" element={<AuthorBooks />} />
          <Route path="/paid-books" element={<PaidBooks />} />
        </Routes>
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
