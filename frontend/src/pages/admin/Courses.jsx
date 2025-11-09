import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Edit, Trash2, Users } from 'lucide-react'
import Layout from '../../components/Layout'
import { coursesAPI, usersAPI } from '../../utils/api'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teacher_id: '',
    semester: '',
    degree_types: []
  })

  const sidebarItems = [
    { label: 'Dashboard', path: '/admin', icon: BookOpen },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Courses', path: '/admin/courses', icon: BookOpen },
  ]

  useEffect(() => {
    fetchCourses()
    fetchTeachers()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll()
      setCourses(response.data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await usersAPI.getAll({ role: 'teacher' })
      setTeachers(response.data)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const courseData = {
        ...formData,
        degree_types: formData.degree_types.join(',') // Convert array to comma-separated string
      }
      await coursesAPI.create(courseData)
      setShowModal(false)
      setFormData({ title: '', description: '', teacher_id: '', semester: '', degree_types: [] })
      fetchCourses()
    } catch (error) {
      console.error('Failed to create course:', error)
      alert('Failed to create course: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDelete = async (courseId) => {
    console.log('Delete button clicked for course:', courseId)
    
    if (!window.confirm('Are you sure you want to permanently delete this course? This will delete all related materials, quizzes, and enrollments.')) {
      console.log('User cancelled course deletion')
      return
    }
    
    console.log('Attempting to delete course:', courseId)
    
    try {
      const response = await coursesAPI.delete(courseId)
      console.log('Delete response:', response)
      await fetchCourses()
      alert('Course deleted successfully!')
    } catch (error) {
      console.error('Failed to delete course:', error)
      console.error('Error response:', error.response)
      alert('Failed to delete course: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <Layout sidebarItems={sidebarItems} title="Course Management">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">All Courses</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-glass hover:shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex space-x-2">
                <button 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Edit (coming soon)"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(course.id)
                  }}
                  className="p-2 hover:bg-red-50 rounded transition-colors"
                  title="Delete course"
                  type="button"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {course.materials?.length || 0} Materials
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {course.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold mb-4">Create New Course</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Course Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assign Teacher</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select Teacher (Optional)</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                  className="input w-full"
                  required
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Degree Programs *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {[
                    'BS Computer Science',
                    'BS Software Engineering',
                    'BS Information Technology',
                    'BS Data Science',
                    'BS Artificial Intelligence',
                    'MS Computer Science',
                    'MS Data Science',
                    'MS Software Engineering',
                    'PhD Computer Science'
                  ].map((degree) => (
                    <label key={degree} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.degree_types.includes(degree)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, degree_types: [...formData.degree_types, degree] })
                          } else {
                            setFormData({ ...formData, degree_types: formData.degree_types.filter(d => d !== degree) })
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{degree}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select all degree programs this course is for
                </p>
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Create Course
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </Layout>
  )
}

export default Courses
