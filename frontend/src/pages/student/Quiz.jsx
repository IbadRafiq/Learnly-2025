import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ClipboardList, Trophy } from 'lucide-react'
import Layout from '../../components/Layout'
import { quizAPI, authAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'

const StudentQuiz = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  const sidebarItems = [
    { label: 'Dashboard', path: '/student', icon: ClipboardList },
  ]

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      const response = await quizAPI.getById(quizId)
      setQuiz(response.data)
    } catch (error) {
      console.error('Failed to fetch quiz:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        student_answer: answer
      }))

      const response = await quizAPI.submitAttempt({
        quiz_id: parseInt(quizId),
        answers: formattedAnswers
      })

      setResult(response.data)
      setSubmitted(true)

      // Fetch updated user data to get new competency score
      try {
        const userResponse = await authAPI.getMe()
        updateUser(userResponse.data)
        console.log('User data updated with new competency score:', userResponse.data.competency_score)
      } catch (err) {
        console.error('Failed to refresh user data:', err)
      }

      // Redirect to course page with results tab after 3 seconds
      setTimeout(() => {
        navigate(`/student/course/${quiz.course_id}?tab=results`)
      }, 3000)
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      alert('Failed to submit quiz: ' + (error.response?.data?.detail || error.message))
    }
  }

  if (!quiz) return <Layout sidebarItems={sidebarItems} title="Quiz"><div>Loading...</div></Layout>

  return (
    <Layout sidebarItems={sidebarItems} title={quiz.title}>
      <div className="card-glass max-w-3xl mx-auto">
        {!submitted ? (
          <>
            <h3 className="text-xl font-bold mb-4">{quiz.title}</h3>
            <p className="text-gray-600 mb-6">{quiz.description}</p>

            <div className="space-y-6">
              {quiz.questions.map((question, index) => (
                <div key={question.id} className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-md">
                  <p className="font-bold mb-4 text-lg text-gray-900">
                    {index + 1}. {question.question_text}
                  </p>

                  {question.options?.map((option, idx) => (
                    <label key={idx} className="flex items-center space-x-3 mb-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{option}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              className="btn-primary w-full mt-6"
              disabled={Object.keys(answers).length !== quiz.questions.length}
            >
              Submit Quiz
            </button>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-green-600 mb-2">Quiz Submitted Successfully!</h3>
            </div>
            {result && (
              <div className="mt-8 space-y-6">
                <div className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {result.percentage}%
                </div>
                <p className="text-2xl text-gray-700 font-semibold">
                  Score: {result.score} / {result.max_score}
                </p>
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                  <p className="text-gray-700 font-medium">
                    Redirecting to results page...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default StudentQuiz
