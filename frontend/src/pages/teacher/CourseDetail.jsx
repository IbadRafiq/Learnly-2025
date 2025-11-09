import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BookOpen, FileText, Trophy, Users, ArrowLeft, Upload, 
  Sparkles, Brain, Loader, CheckCircle, AlertCircle, X, Mail, UserCircle, Calendar, Award
} from 'lucide-react'
import Layout from '../../components/Layout'
import { coursesAPI, quizAPI, assignmentAPI } from '../../utils/api'
import { AnimatePresence } from 'framer-motion'

const TeacherCourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [activeTab, setActiveTab] = useState('students')
  const [loading, setLoading] = useState(true)
  
  // Upload states
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Quiz generation states
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [quizData, setQuizData] = useState({
    topic: '',
    difficulty: 'medium',
    num_questions: 5,
    material_ids: []
  })
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [notification, setNotification] = useState(null)
  
  // Assignment states
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    assignment_type: 'assignment',
    max_score: 100,
    due_date: '',
    allow_late_submission: false
  })
  const [creatingAssignment, setCreatingAssignment] = useState(false)

  const sidebarItems = [
    { label: 'Dashboard', path: '/teacher', icon: BookOpen },
    { label: 'My Courses', path: '/teacher/courses', icon: BookOpen },
  ]

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    setLoading(true)
    try {
      const [courseRes, quizzesRes, studentsRes, assignmentsRes] = await Promise.all([
        coursesAPI.getById(courseId),
        quizAPI.getByCourse(courseId),
        coursesAPI.getStudents(courseId),
        assignmentAPI.getByCourse(courseId)
      ])
      
      setCourse(courseRes.data)
      setMaterials(courseRes.data.materials || [])
      setQuizzes(quizzesRes.data)
      setStudents(studentsRes.data)
      setAssignments(assignmentsRes.data)
    } catch (error) {
      console.error('Failed to fetch course data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      showNotification('error', 'Please select a file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)

    console.log('Uploading material:', { title, fileName: file.name, fileType: file.type })

    setUploading(true)
    try {
      const response = await coursesAPI.uploadMaterial(courseId, formData)
      console.log('Upload successful:', response.data)
      showNotification('success', 'Material uploaded successfully!')
      setFile(null)
      setTitle('')
      fetchCourseData()
    } catch (error) {
      console.error('Upload failed:', error)
      console.error('Error response:', error.response)
      const errorMsg = error.response?.data?.detail || error.message || 'Upload failed. Please try again.'
      showNotification('error', errorMsg)
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateQuiz = async (e) => {
    e.preventDefault()
    
    if (quizData.material_ids.length === 0) {
      showNotification('error', 'Please select at least one material to generate quiz from')
      return
    }
    
    setGeneratingQuiz(true)
    try {
      const response = await quizAPI.generate({
        course_id: parseInt(courseId),
        topic: quizData.topic,
        difficulty: quizData.difficulty,
        num_questions: quizData.num_questions,
        material_ids: quizData.material_ids
      })
      
      showNotification('success', `Quiz "${response.data.title}" generated and saved successfully!`)
      setShowQuizModal(false)
      setQuizData({ topic: '', difficulty: 'medium', num_questions: 5, material_ids: [] })
      await fetchCourseData()
    } catch (error) {
      console.error('Quiz generation failed:', error)
      showNotification('error', error.response?.data?.detail || 'Failed to generate quiz. Please ensure you have selected materials.')
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const handleCreateAssignment = async (e) => {
    e.preventDefault()
    setCreatingAssignment(true)
    try {
      await assignmentAPI.create({
        course_id: parseInt(courseId),
        title: assignmentData.title,
        description: assignmentData.description,
        assignment_type: assignmentData.assignment_type,
        max_score: assignmentData.max_score,
        due_date: assignmentData.due_date ? new Date(assignmentData.due_date).toISOString() : null,
        allow_late_submission: assignmentData.allow_late_submission
      })
      
      showNotification('success', `Assignment "${assignmentData.title}" created successfully!`)
      setAssignmentData({
        title: '',
        description: '',
        assignment_type: 'assignment',
        max_score: 100,
        due_date: '',
        allow_late_submission: false
      })
      await fetchCourseData()
    } catch (error) {
      console.error('Assignment creation failed:', error)
      showNotification('error', error.response?.data?.detail || 'Failed to create assignment.')
    } finally {
      setCreatingAssignment(false)
    }
  }

  if (loading) {
    return (
      <Layout sidebarItems={sidebarItems} title="Course Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!course) {
    return (
      <Layout sidebarItems={sidebarItems} title="Course Not Found">
        <div className="text-center py-12">
          <p className="text-gray-600">Course not found</p>
          <button onClick={() => navigate('/teacher/courses')} className="btn-primary mt-4">
            Back to Courses
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout sidebarItems={sidebarItems} title={course.title}>
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

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/teacher/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>

        <div className="card-glass">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{students.length} students enrolled</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{materials.length} materials</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>{quizzes.length} quizzes</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/teacher/ai-chat/${courseId}`)}
                className="btn-secondary flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                <span>Ask AI</span>
              </button>
              <button
                onClick={() => setShowQuizModal(true)}
                className="btn-primary flex items-center gap-2"
                disabled={materials.length === 0}
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Quiz</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'students'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Materials ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Assignments ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'quizzes'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Quizzes ({quizzes.length})
        </button>
      </div>

      {/* Content */}
      <div>
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            {students.length > 0 ? (
              students.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-glass flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <UserCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    Enrolled {new Date(student.enrolled_at).toLocaleDateString()}
                  </span>
                </motion.div>
              ))
            ) : (
              <div className="card-glass text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No students enrolled yet</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Create Assignment Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass"
            >
              <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Title *
                    </label>
                    <input
                      type="text"
                      value={assignmentData.title}
                      onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                      placeholder="e.g., Week 1 Project"
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={assignmentData.assignment_type}
                      onChange={(e) => setAssignmentData({ ...assignmentData, assignment_type: e.target.value })}
                      className="input w-full"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="project">Project</option>
                      <option value="lab">Lab Work</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={assignmentData.description}
                    onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
                    placeholder="Describe the assignment requirements..."
                    className="input w-full"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Score
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={assignmentData.max_score}
                      onChange={(e) => setAssignmentData({ ...assignmentData, max_score: parseFloat(e.target.value) })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={assignmentData.due_date}
                      onChange={(e) => setAssignmentData({ ...assignmentData, due_date: e.target.value })}
                      className="input w-full"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignmentData.allow_late_submission}
                        onChange={(e) => setAssignmentData({ ...assignmentData, allow_late_submission: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Allow late submission</span>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={creatingAssignment}
                  className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {creatingAssignment ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Create Assignment</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Assignments List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Created Assignments</h3>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-glass"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                            {assignment.assignment_type}
                          </span>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>Max Score: {assignment.max_score}</span>
                          </div>
                          {assignment.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Upload className="w-4 h-4" />
                            <span>{assignment.submission_count || 0} submissions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {assignment.allow_late_submission && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        Late submission allowed
                      </span>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="card-glass text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No assignments created yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            {/* Upload Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass"
            >
              <h3 className="text-lg font-semibold mb-4">Upload New Material</h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Week 1 Lecture Notes"
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File
                  </label>
                  <input
                    type="file"
                    id="file-input"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".pdf,.docx,.txt"
                    className="input w-full"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Supported formats: PDF, DOCX, TXT (Max 10MB)
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={uploading}
                  className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
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

            {/* Materials List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Uploaded Materials</h3>
              {materials.length > 0 ? (
                materials.map((material) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-glass flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{material.title}</h3>
                        <p className="text-sm text-gray-500">
                          Uploaded {new Date(material.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="card-glass text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No materials uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-glass"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {quiz.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="capitalize">{quiz.difficulty}</span>
                        <span>•</span>
                        <span>{quiz.questions?.length || 0} questions</span>
                        <span>•</span>
                        <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="card-glass text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No quizzes generated yet</p>
                <button
                  onClick={() => setShowQuizModal(true)}
                  className="btn-primary"
                  disabled={materials.length === 0}
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Generate First Quiz
                </button>
                {materials.length === 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    Upload course materials first
                  </p>
                )}
              </div>
            )}
          </div>
        )}
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
                  <p className="text-sm text-gray-600">{course.title}</p>
                </div>
              </div>

              <form onSubmit={handleGenerateQuiz} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Materials <span className="text-red-500">*</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                    {materials.length > 0 ? (
                      <>
                        <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={quizData.material_ids.length === materials.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQuizData({ ...quizData, material_ids: materials.map(m => m.id) })
                              } else {
                                setQuizData({ ...quizData, material_ids: [] })
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                            disabled={generatingQuiz}
                          />
                          <span className="font-medium text-gray-700">Select All</span>
                        </label>
                        <div className="border-t pt-2">
                          {materials.map((material) => (
                            <label key={material.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={quizData.material_ids.includes(material.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setQuizData({ ...quizData, material_ids: [...quizData.material_ids, material.id] })
                                  } else {
                                    setQuizData({ ...quizData, material_ids: quizData.material_ids.filter(id => id !== material.id) })
                                  }
                                }}
                                className="w-4 h-4 text-blue-600"
                                disabled={generatingQuiz}
                              />
                              <span className="text-sm text-gray-700">{material.title}</span>
                              <span className="text-xs text-gray-400 ml-auto">.{material.file_type}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No materials uploaded yet</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {quizData.material_ids.length} material(s) selected
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={quizData.topic}
                    onChange={(e) => setQuizData({ ...quizData, topic: e.target.value })}
                    placeholder="e.g., Python Basics, Variables"
                    className="input w-full"
                    disabled={generatingQuiz}
                  />
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

export default TeacherCourseDetail
