import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BookOpen, FileText, Trophy, MessageCircle, Download, 
  ArrowLeft, Clock, CheckCircle, Award, Target, Upload, Calendar
} from 'lucide-react'
import Layout from '../../components/Layout'
import { coursesAPI, quizAPI, assignmentAPI } from '../../utils/api'

const StudentCourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [assignments, setAssignments] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [activeTab, setActiveTab] = useState('materials')
  const [loading, setLoading] = useState(true)
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionText, setSubmissionText] = useState('')

  const sidebarItems = [
    { label: 'Dashboard', path: '/student', icon: BookOpen },
    { label: 'My Courses', path: '/student/courses', icon: BookOpen },
  ]

  useEffect(() => {
    fetchCourseData()
    
    // Check if tab parameter is in URL
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [courseId, searchParams])

  const fetchCourseData = async () => {
    setLoading(true)
    try {
      const [courseRes, quizzesRes, attemptsRes, assignmentsRes, submissionsRes] = await Promise.all([
        coursesAPI.getById(courseId),
        quizAPI.getByCourse(courseId),
        quizAPI.getMyAttempts(),
        assignmentAPI.getByCourse(courseId),
        assignmentAPI.getMySubmissions()
      ])
      
      setCourse(courseRes.data)
      setMaterials(courseRes.data.materials || [])
      setQuizzes(quizzesRes.data)
      setAssignments(assignmentsRes.data)
      setMySubmissions(submissionsRes.data)
      
      // Filter attempts for this course
      const courseAttempts = attemptsRes.data.filter(
        attempt => quizzesRes.data.some(quiz => quiz.id === attempt.quiz_id)
      )
      setAttempts(courseAttempts)
    } catch (error) {
      console.error('Failed to fetch course data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAttemptForQuiz = (quizId) => {
    return attempts.filter(a => a.quiz_id === quizId)
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
  }

  const calculateAverageScore = () => {
    if (attempts.length === 0) return 0
    const sum = attempts.reduce((acc, att) => acc + att.percentage, 0)
    return (sum / attempts.length).toFixed(1)
  }

  const handleAssignmentSubmit = async (assignmentId) => {
    try {
      const formData = new FormData()
      formData.append('assignment_id', assignmentId)
      if (submissionText) formData.append('submission_text', submissionText)
      if (submissionFile) formData.append('file', submissionFile)

      await assignmentAPI.submit(formData)
      alert('Assignment submitted successfully!')
      setSubmissionFile(null)
      setSubmissionText('')
      fetchCourseData() // Refresh data
    } catch (error) {
      alert('Failed to submit assignment: ' + (error.response?.data?.detail || error.message))
    }
  }

  const getSubmissionForAssignment = (assignmentId) => {
    return mySubmissions.find(sub => sub.assignment_id === assignmentId)
  }

  const isAssignmentOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
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
          <button onClick={() => navigate('/student/courses')} className="btn-primary mt-4">
            Back to Courses
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout sidebarItems={sidebarItems} title={course.title}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/student/courses')}
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
                  <BookOpen className="w-4 h-4" />
                  <span>{course.teacher_name}</span>
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
            <button
              onClick={() => navigate(`/student/ai-chat/${courseId}`)}
              className="btn-primary flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask AI</span>
            </button>
          </div>

          {/* Stats */}
          {attempts.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attempts.length}</div>
                <div className="text-sm text-gray-600">Quizzes Taken</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{calculateAverageScore()}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {attempts.filter(a => a.percentage >= 70).length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Materials
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Assignments
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
          Quizzes
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'results'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          My Results
        </button>
      </div>

      {/* Content */}
      <div>
        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
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
                  <a
                    href={`http://localhost:8000${material.file_path}`}
                    download
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </motion.div>
              ))
            ) : (
              <div className="card-glass text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No materials uploaded yet</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((assignment) => {
                const submission = getSubmissionForAssignment(assignment.id)
                const isOverdue = isAssignmentOverdue(assignment.due_date)

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-glass"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {assignment.title}
                          </h3>
                          {submission && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Submitted
                            </span>
                          )}
                          {!submission && isOverdue && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Due: {assignment.due_date 
                                ? new Date(assignment.due_date).toLocaleString() 
                                : 'No deadline'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>Max Score: {assignment.max_score}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {submission ? (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                            {submission.score !== null && (
                              <p className="text-lg font-semibold text-green-600 mt-1">
                                Score: {submission.score} / {assignment.max_score}
                              </p>
                            )}
                            {submission.feedback && (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">Feedback:</span> {submission.feedback}
                              </p>
                            )}
                          </div>
                          {submission.file_path && (
                            <a
                              href={`http://localhost:8000/${submission.file_path}`}
                              download
                              className="btn-secondary flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download Submission</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Submit Assignment</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Submission Text (Optional)
                            </label>
                            <textarea
                              value={submissionText}
                              onChange={(e) => setSubmissionText(e.target.value)}
                              className="input w-full"
                              rows="3"
                              placeholder="Enter your submission text..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Upload File
                            </label>
                            <input
                              type="file"
                              onChange={(e) => setSubmissionFile(e.target.files[0])}
                              className="input w-full"
                            />
                          </div>
                          <button
                            onClick={() => handleAssignmentSubmit(assignment.id)}
                            disabled={!submissionText && !submissionFile}
                            className="btn-primary flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Submit Assignment</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })
            ) : (
              <div className="card-glass text-center py-12">
                <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No assignments available yet</p>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => {
                const quizAttempts = getAttemptForQuiz(quiz.id)
                const bestScore = quizAttempts.length > 0
                  ? Math.max(...quizAttempts.map(a => a.percentage))
                  : null

                return (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-glass"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {quiz.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span className="capitalize">{quiz.difficulty}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{quiz.questions?.length || 0} questions</span>
                          </div>
                          {quizAttempts.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{quizAttempts.length} attempts</span>
                            </div>
                          )}
                        </div>
                        {bestScore !== null && (
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <span className="font-semibold text-gray-900">
                              Best Score: {bestScore}%
                            </span>
                          </div>
                        )}
                      </div>
                      {quizAttempts.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </span>
                          <button
                            onClick={() => setActiveTab('results')}
                            className="btn-secondary flex items-center gap-2 text-sm"
                          >
                            <Award className="w-4 h-4" />
                            <span>View Results</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>Take Quiz</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="card-glass text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No quizzes available yet</p>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {attempts.length > 0 ? (
              attempts.map((attempt) => {
                const quiz = quizzes.find(q => q.id === attempt.quiz_id)
                return (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-glass"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{quiz?.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(attempt.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div className={`text-2xl font-bold ${
                        attempt.percentage >= 70 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attempt.percentage}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-gray-600">
                        <span>Score: {attempt.score} / {quiz?.questions?.length || 0}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {attempt.percentage >= 70 ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">Passed</span>
                            </>
                          ) : (
                            <span className="text-red-600">Failed</span>
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/student/quiz/${quiz?.id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Retake Quiz →
                      </button>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="card-glass text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No quiz attempts yet</p>
                <button
                  onClick={() => setActiveTab('quizzes')}
                  className="btn-primary mt-4"
                >
                  View Available Quizzes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default StudentCourseDetail
