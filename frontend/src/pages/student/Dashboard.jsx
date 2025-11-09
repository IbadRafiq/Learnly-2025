import { useState, useEffect } from 'react'
import { BookOpen, Trophy, Award, TrendingUp, MessageCircle, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import CourseCard from '../../components/CourseCard'
import { coursesAPI, quizAPI } from '../../utils/api'

const StudentDashboard = () => {
  const [courses, setCourses] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const sidebarItems = [
    { label: 'Dashboard', path: '/student', icon: TrendingUp },
    { label: 'My Courses', path: '/student/courses', icon: BookOpen },
    { label: 'Progress', path: '/student/progress', icon: Award },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesRes, attemptsRes] = await Promise.all([
        coursesAPI.getAll(),
        quizAPI.getMyAttempts()
      ])
      setCourses(coursesRes.data)
      setAttempts(attemptsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const avgScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
    : 0

  const stats = [
    { 
      icon: BookOpen, 
      value: courses.length, 
      label: 'Enrolled Courses', 
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: Trophy, 
      value: attempts.length, 
      label: 'Quizzes Taken', 
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500'
    },
    { 
      icon: TrendingUp, 
      value: `${avgScore.toFixed(1)}%`, 
      label: 'Average Score', 
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      icon: Award, 
      value: '85%', 
      label: 'Goal Progress', 
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    },
  ]

  return (
    <Layout sidebarItems={sidebarItems} title="Dashboard">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl"
      >
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Welcome back!</h2>
        </div>
        <p className="text-blue-100">Continue your learning journey with AI-powered assistance</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Courses Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">My Courses</h3>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => navigate(`/student/ai-chat/${course.id}`)}
                showActions={true}
                actions={
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/student/ai-chat/${course.id}`)
                    }}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Ask AI</span>
                  </button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="card-glass text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No courses enrolled yet</p>
            <button
              onClick={() => navigate('/student/courses')}
              className="btn-primary"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default StudentDashboard
