import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
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
                <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold mb-3">
                    {index + 1}. {question.question_text}
                  </p>

                  {question.options?.map((option, idx) => (
                    <label key={idx} className="flex items-center space-x-2 mb-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
                        className="w-4 h-4"
                      />
                      <span>{option}</span>
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
          <div className="text-center py-12">
            <h3 className="text-2xl font-bold text-green-600 mb-4">Quiz Submitted Successfully!</h3>
            {result && (
              <div className="mt-6 space-y-4">
                <div className="text-6xl font-bold text-blue-600">
                  {result.percentage}%
                </div>
                <p className="text-xl text-gray-700">
                  Score: {result.score} / {result.max_score}
                </p>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-600">
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
