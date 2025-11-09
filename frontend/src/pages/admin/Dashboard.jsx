import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, BarChart3, Shield, TrendingUp, AlertTriangle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../../components/Layout'
import { usersAPI, coursesAPI, analyticsAPI } from '../../utils/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    activeUsers: 0,
    avgScore: 0
  })
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const sidebarItems = [
    { label: 'Dashboard', path: '/admin', icon: BarChart3 },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Courses', path: '/admin/courses', icon: BookOpen },
    { label: 'Moderation', path: '/admin/moderation', icon: Shield },
    { label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [userStats, systemAnalytics] = await Promise.all([
        usersAPI.getStats(),
        analyticsAPI.getSystemAnalytics()
      ])
      
      setStats({
        users: userStats.data.total_users,
        courses: systemAnalytics.data.total_courses,
        activeUsers: userStats.data.active_users,
        avgScore: systemAnalytics.data.average_platform_score
      })
      
      setAnalytics(systemAnalytics.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Users', value: stats.users, icon: Users, color: 'blue', trend: '+12%' },
    { title: 'Total Courses', value: stats.courses, icon: BookOpen, color: 'green', trend: '+5%' },
    { title: 'Active Users', value: stats.activeUsers, icon: TrendingUp, color: 'purple', trend: '+8%' },
    { title: 'Avg Score', value: `${stats.avgScore.toFixed(1)}%`, icon: BarChart3, color: 'orange', trend: '+3%' },
  ]

  return (
    <Layout sidebarItems={sidebarItems} title="Admin Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-glass"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm text-green-600 mt-2">{stat.trend} from last month</p>
              </div>
              <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-glass"
        >
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.user_growth ? Object.entries(analytics.user_growth).map(([date, count]) => ({ date, count })) : []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Course Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-glass"
        >
          <h3 className="text-lg font-semibold mb-4">Course Enrollments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.course_activity ? Object.entries(analytics.course_activity).map(([name, value]) => ({ name, value })) : []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Moderation Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Content Moderation</h3>
          <Shield className="w-5 h-5 text-gray-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Pass Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {analytics?.moderation_stats ? (analytics.moderation_stats.pass_rate * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Checked</p>
            <p className="text-2xl font-bold text-blue-600">
              {analytics?.moderation_stats?.total_checked || 0}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Flagged</p>
            <p className="text-2xl font-bold text-red-600">
              {analytics?.moderation_stats?.total_flagged || 0}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 card-glass"
      >
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Manage Users</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <BookOpen className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Add Course</p>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Moderation</p>
          </button>
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
            <BarChart3 className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium">View Reports</p>
          </button>
        </div>
      </motion.div>
    </Layout>
  )
}

export default AdminDashboard
