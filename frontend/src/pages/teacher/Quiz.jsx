import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles, BookOpen } from 'lucide-react'
import Layout from '../../components/Layout'
import { quizAPI } from '../../utils/api'

const TeacherQuiz = () => {
  const { courseId } = useParams()
  const [formData, setFormData] = useState({
    topic: '',
    difficulty: 'medium',
    num_questions: 5
  })
  const [generated, setGenerated] = useState(null)
  const [loading, setLoading] = useState(false)

  const sidebarItems = [
    { label: 'Dashboard', path: '/teacher', icon: BookOpen },
  ]

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await quizAPI.generate({
        course_id: parseInt(courseId),
        ...formData
      })
      setGenerated(response.data)
    } catch (error) {
      console.error('Failed to generate quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout sidebarItems={sidebarItems} title="Generate Quiz">
      <div className="card-glass max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">AI Quiz Generator</h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({...formData, topic: e.target.value})}
            placeholder="Topic (optional)"
            className="input w-full"
          />

          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            className="input w-full"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <input
            type="number"
            value={formData.num_questions}
            onChange={(e) => setFormData({...formData, num_questions: parseInt(e.target.value)})}
            min="1"
            max="20"
            className="input w-full"
          />

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>{loading ? 'Generating...' : 'Generate Quiz'}</span>
          </button>
        </form>

        {generated && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">Quiz generated successfully with {generated.questions?.length} questions!</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default TeacherQuiz
