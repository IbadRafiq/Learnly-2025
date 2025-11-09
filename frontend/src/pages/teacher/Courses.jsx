import { useState, useEffect } from 'react'
import { BookOpen, Upload, FileText, CheckCircle, AlertCircle, X, Loader, Sparkles, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../../components/Layout'
import { coursesAPI, quizAPI } from '../../utils/api'
import { useNavigate } from 'react-router-dom'

const TeacherCourses = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [quizData, setQuizData] = useState({
    topic: '',
    difficulty: 'medium',
    num_questions: 5
  })
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const navigate = useNavigate()

  const sidebarItems = [
    { label: 'Dashboard', path: '/teacher', icon: BookOpen },
    { label: 'My Courses', path: '/teacher/courses', icon: BookOpen },
  ]

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll()
      setCourses(response.data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file || !selectedCourse) {
      showNotification('error', 'Please select a course and file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)

    setUploading(true)
    try {
      await coursesAPI.uploadMaterial(selectedCourse, formData)
      showNotification('success', 'Material uploaded successfully!')
      setFile(null)
      setTitle('')
      setSelectedCourse(null)
      // Reset file input
      const fileInput = document.getElementById('file-input')
      if (fileInput) fileInput.value = ''
      fetchCourses()
    } catch (error) {
      console.error('Upload failed:', error)
      showNotification('error', error.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateQuiz = async (e) => {
    e.preventDefault()
    if (!selectedCourse) {
      showNotification('error', 'Please select a course first')
      return
    }

    setGeneratingQuiz(true)
    try {
      const response = await quizAPI.generate({
        course_id: parseInt(selectedCourse),
        topic: quizData.topic,
        difficulty: quizData.difficulty,
        num_questions: quizData.num_questions
      })
      
      // Save the generated quiz
      await quizAPI.create(response.data)
      
      showNotification('success', `Quiz "${response.data.title}" generated successfully!`)
      setShowQuizModal(false)
      setQuizData({ topic: '', difficulty: 'medium', num_questions: 5 })
    } catch (error) {
      console.error('Quiz generation failed:', error)
      showNotification('error', error.response?.data?.detail || 'Failed to generate quiz. Ensure the course has materials uploaded.')
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const selectedCourseData = courses.find(c => c.id === parseInt(selectedCourse))

  return (
    <Layout sidebarItems={sidebarItems} title="My Courses">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-glass"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold">Upload Course Material</h3>
          </div>

          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course *
              </label>
              <select
                value={selectedCourse || ''}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="input w-full"
                required
                disabled={uploading}
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Week 1 Lecture Notes"
                className="input w-full"
                required
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File *
              </label>
              <div className="relative">
                <input
                  id="file-input"
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.docx,.txt"
                  className="input w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                  disabled={uploading}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: PDF, DOCX, TXT (Max 10MB)
              </p>
            </div>

            {file && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    const fileInput = document.getElementById('file-input')
                    if (fileInput) fileInput.value = ''
                  }}
                  className="ml-auto text-blue-600 hover:text-blue-800"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={uploading}
              className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Material</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Courses List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-glass"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold">My Courses</h3>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {courses.length > 0 ? (
              courses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedCourse === String(course.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => navigate(`/teacher/course/${course.id}`)}
                >
                  <h4 className="font-semibold text-gray-800">{course.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>{course.materials?.length || 0} materials</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No courses assigned yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quiz Generation Modal */}
      <AnimatePresence>
        {showQuizModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !generatingQuiz && setShowQuizModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Generate AI Quiz</h3>
                  <p className="text-sm text-gray-600">Course: {selectedCourseData?.title}</p>
                </div>
              </div>

              <form onSubmit={handleGenerateQuiz} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={quizData.topic}
                    onChange={(e) => setQuizData({ ...quizData, topic: e.target.value })}
                    placeholder="e.g., Python Basics, Variables, Functions"
                    className="input w-full"
                    disabled={generatingQuiz}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to generate from all course materials
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={quizData.difficulty}
                    onChange={(e) => setQuizData({ ...quizData, difficulty: e.target.value })}
                    className="input w-full"
                    disabled={generatingQuiz}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={quizData.num_questions}
                    onChange={(e) => setQuizData({ ...quizData, num_questions: parseInt(e.target.value) })}
                    className="input w-full"
                    disabled={generatingQuiz}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowQuizModal(false)}
                    className="btn-secondary flex-1"
                    disabled={generatingQuiz}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={generatingQuiz}
                  >
                    {generatingQuiz ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

export default TeacherCourses
