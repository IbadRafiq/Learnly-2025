import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const Layout = ({ children, sidebarItems, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed left-0 top-0 h-full w-64 glass border-r border-white/40 z-40 shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100/50">
          <h1 className="text-2xl font-bold gradient-text">
            LEARNLY
          </h1>
          <p className="text-sm text-gray-600 mt-1.5 capitalize font-medium">{user?.role} Portal</p>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {sidebarItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
              <item.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors relative z-10" />
              <span className="text-gray-700 group-hover:text-gray-900 font-medium relative z-10">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100/50 bg-gradient-to-t from-white/50 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 py-2">
            <Link to="/profile" className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-1 group">
              {user?.avatar ? (
                <img 
                  src={`http://localhost:8000/${user.avatar}`} 
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200 group-hover:ring-blue-300 transition-all"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 hover:bg-red-50 rounded-xl transition-all hover:shadow-md ml-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-600 hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-2xl border-b border-gray-100/50 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:shadow-md"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
              </button>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default Layout
