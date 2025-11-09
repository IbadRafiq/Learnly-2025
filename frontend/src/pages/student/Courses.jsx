import { useState, useEffect } from 'react'
import { BookOpen, MessageCircle, Plus, CheckCircle, GraduationCap, Users, FileText, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../../components/Layout'
import { coursesAPI, quizAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'

const StudentCourses = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [activeTab, setActiveTab] = useState('enrolled')
  const [loading, setLoading] = useState(false)
  const [courseQuizzes, setCourseQuizzes] = useState({})
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const sidebarItems = [
    { label: 'Dashboard', path: '/student', icon: BookOpen },
    { label: 'My Courses', path: '/student/courses', icon: BookOpen },
  ]

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const [enrolledRes, availableRes] = await Promise.all([
        coursesAPI.getAll(),
        coursesAPI.getAvailableForStudent()
      ])
      setEnrolledCourses(enrolledRes.data)
      setAvailableCourses(availableRes.data)
      
      // Fetch quizzes for enrolled courses
      const quizPromises = enrolledRes.data.map(async (course) => {
        try {
          const quizRes = await quizAPI.getByCourse(course.id)
          return { courseId: course.id, quizzes: quizRes.data }
        } catch (error) {
          return { courseId: course.id, quizzes: [] }
        }
      })
      
      const quizResults = await Promise.all(quizPromises)
      const quizMap = {}
      quizResults.forEach(({ courseId, quizzes }) => {
        quizMap[courseId] = quizzes
      })
      setCourseQuizzes(quizMap)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
    try {
      await coursesAPI.enroll({ 
        course_id: courseId, 
        student_id: user.id 
      })
      // Refresh courses list
      fetchCourses()
    } catch (error) {
      console.error('Enrollment failed:', error)
      alert(error.response?.data?.detail || 'Failed to enroll in course')
    }
  }

  const CourseCard = ({ course, isEnrolled }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        {isEnrolled && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Enrolled
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{course.title}</h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{course.description}</p>
      
      {/* Semester and Degree Badges */}
      {(course.semester || course.degree_types) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {course.semester && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Semester {course.semester}
            </span>
          )}
          {course.degree_types && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full" title={course.degree_types}>
              {course.degree_types.split(',')[0]} {course.degree_types.split(',').length > 1 && `+${course.degree_types.split(',').length - 1}`}
            </span>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        {course.teacher_name && (
          <div className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            <span>{course.teacher_name}</span>
          </div>
        )}
        {course.materials && (
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{course.materials.length || 0} materials</span>
          </div>
        )}
        {isEnrolled && courseQuizzes[course.id] && (
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>{courseQuizzes[course.id].length || 0} quizzes</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-auto">
        {isEnrolled ? (
          <button
            onClick={() => navigate(`/student/course/${course.id}`)}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>View Course</span>
          </button>
        ) : (
          <button
            onClick={() => handleEnroll(course.id)}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Now</span>
          </button>
        )}
      </div>
    </motion.div>
  )

  return (
    <Layout sidebarItems={sidebarItems} title="Courses">
      {/* Tab Navigation */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`pb-3 px-1 font-medium transition-colors relative ${
            activeTab === 'enrolled'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Courses ({enrolledCourses.length})
          {activeTab === 'enrolled' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-3 px-1 font-medium transition-colors relative ${
            activeTab === 'available'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Available Courses ({availableCourses.length})
          {activeTab === 'available' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
            />
          )}
        </button>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'enrolled' ? (
            enrolledCourses.length > 0 ? (
              enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} isEnrolled={true} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Enrolled Courses</h3>
                <p className="text-gray-500 mb-4">Start learning by enrolling in available courses</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="btn-primary"
                >
                  Browse Available Courses
                </button>
              </div>
            )
          ) : (
            availableCourses.length > 0 ? (
              availableCourses.map((course) => (
                <CourseCard key={course.id} course={course} isEnrolled={false} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">All Caught Up!</h3>
                <p className="text-gray-500">You're enrolled in all available courses</p>
              </div>
            )
          )}
        </div>
      )}
    </Layout>
  )
}

export default StudentCourses
