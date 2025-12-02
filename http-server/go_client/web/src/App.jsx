import './App.css'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AudioBook } from './pages/book/Book'
import { AudioSection } from './pages/section/Section'
import { DubbingList } from './pages/dubbing/Dubbing'
import { BookOutlined, AudioOutlined, SettingOutlined, AppstoreOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'

const LeftMenu = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: 'novel', icon: <BookOutlined />, label: '小说', path: '/audiobook/list' },
    { key: 'dubbing', icon: <AudioOutlined />, label: '配音', path: '/dubbing/list' }
  ]

  const isActive = (path) => {
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex flex-col h-screen w-16 bg-white border-r border-gray-200">
      {/* Logo 图标 */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <Tooltip title="首页" placement="right">
          <div className="text-2xl text-blue-500 cursor-pointer hover:text-blue-600 transition-colors">
            <AppstoreOutlined />
          </div>
        </Tooltip>
      </div>

      {/* 中间菜单图标 */}
      <div className="flex-1 flex flex-col items-center py-4 gap-2">
        {menuItems.map((item) => (
          <Tooltip key={item.key} title={item.label} placement="right">
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer transition-all ${
                isActive(item.path) ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => navigate(item.path)}
            >
              <div className="text-xl">{item.icon}</div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* 设置图标 */}
      <div className="flex items-center justify-center h-16 border-t border-gray-200">
        <Tooltip title="设置" placement="right">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 cursor-pointer hover:bg-gray-100 transition-all">
            <div className="text-xl">
              <SettingOutlined />
            </div>
          </div>
        </Tooltip>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <div className="flex h-screen">
      <LeftMenu />
      <div className="flex-1 overflow-auto">
        <Routes>
          {/* Default route - redirect to audiobook/list */}
          {
            // <Route path="/" element={<Navigate to="/audiobook/list" replace />} />
            <Route path="/" element={<Navigate to="/dubbing/list" replace />} />
            // <Route path="/" element={<Navigate to="/audiobook/1/section/2" replace />} />
          }

          {/* audiobook/list route */}
          <Route path="/audiobook/list" element={<AudioBook />} />

          {/* audiobook/section route */}
          <Route path="/audiobook/:book_id/section/:section_id" element={<AudioSection />} />

          {/* dubbing/list route */}
          <Route path="/dubbing/list" element={<DubbingList />} />
        </Routes>
      </div>
    </div>
  )
}

export default App