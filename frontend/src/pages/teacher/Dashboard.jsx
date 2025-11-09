import { useState, useEffect } from 'react'
import { BookOpen, Users, ClipboardList, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import CourseCard from '../../components/CourseCard'
import { coursesAPI, quizAPI } from '../../utils/api'

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState({ totalStudents: 0, totalQuizzes: 0 })
  const navigate = useNavigate()

  const sidebarItems = [
    { label: 'Dashboard', path: '/teacher', icon: BarChart3 },
    { label: 'My Courses', path: '/teacher/courses', icon: BookOpen },
    { label: 'Analytics', path: '/teacher/analytics', icon: BarChart3 },
  ]

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll()
      const coursesData = response.data
      
      // Fetch enrollment count and quiz count for each course
      let totalStudents = 0
      let totalQuizzes = 0
      
      const coursesWithStats = await Promise.all(
        coursesData.map(async (course) => {
          try {
            // Get students enrolled in this course
            const studentsRes = await coursesAPI.getStudents(course.id)
            course.student_count = studentsRes.data.length || 0
            totalStudents += course.student_count
            
            // Get quizzes for this course
            const quizzesRes = await quizAPI.getByCourse(course.id)
            course.quiz_count = quizzesRes.data.length || 0
            totalQuizzes += course.quiz_count
          } catch (error) {
            course.student_count = 0
            course.quiz_count = 0
          }
          return course
        })
      )
      
      setCourses(coursesWithStats)
      setStats({ totalStudents, totalQuizzes })
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  return (
    <Layout sidebarItems={sidebarItems} title="Teacher Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-glass">
          <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="text-2xl font-bold">{courses.length}</h3>
          <p className="text-gray-600">My Courses</p>
        </div>
        <div className="card-glass">
          <Users className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
          <p className="text-gray-600">Total Students</p>
        </div>
        <div className="card-glass">
          <ClipboardList className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="text-2xl font-bold">{stats.totalQuizzes}</h3>
          <p className="text-gray-600">Quizzes Created</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">My Courses</h3>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => navigate(`/teacher/courses`)}
              />
            ))}
          </div>
        ) : (
          <div className="card-glass text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No courses assigned yet</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default TeacherDashboard
