import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { List, Empty, Button, Toast } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'

interface Favorite {
  id: number
  bookId: number
  bookTitle: string
  bookCover: string
  author: string
  category: string
  addTime: string
}

export default function MyFavorites() {
  const navigate = useNavigate()
  const location = useLocation()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(false)
    setFavorites([
      { id: 1, bookId: 1, bookTitle: '斗破苍穹', bookCover: '', author: '天蚕土豆', category: '玄幻', addTime: '2024-01-15' },
      { id: 2, bookId: 2, bookTitle: '完美世界', bookCover: '', author: '辰东', category: '玄幻', addTime: '2024-01-10' },
      { id: 3, bookId: 3, bookTitle: '遮天', bookCover: '', author: '辰东', category: '玄幻', addTime: '2024-01-05' },
    ])
  }

  const handleRemove = (id: number) => {
    setFavorites(favorites.filter(f => f.id !== id))
    Toast.show('已取消收藏')
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div
          onClick={() => navigate('/user')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: '12px',
          }}
        >
          <LeftOutline fontSize={18} color="#fff" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          我的收藏
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      ) : favorites.length === 0 ? (
        <Empty description="暂无收藏" />
      ) : (
        <List>
          {favorites.map((item) => (
            <List.Item
              key={item.id}
              onClick={() => navigate(`/book/${item.bookId}`, { state: { from: location.pathname } })}
              style={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <img
                  src={item.bookCover || 'https://placehold.co/60x80/eee/999?text=Book'}
                  alt={item.bookTitle}
                  style={{
                    width: '50px',
                    height: '70px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {item.bookTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {item.author} · {item.category}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                    收藏于 {item.addTime}
                  </div>
                  <Button size="mini" fill="outline" onClick={(e) => { e.stopPropagation(); handleRemove(item.id) }}>
                    取消收藏
                  </Button>
                </div>
              </div>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  )
}
