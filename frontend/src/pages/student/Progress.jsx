import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../../components/Layout'
import { quizAPI } from '../../utils/api'

const StudentProgress = () => {
  const [attempts, setAttempts] = useState([])

  const sidebarItems = [
    { label: 'Dashboard', path: '/student', icon: TrendingUp },
    { label: 'Progress', path: '/student/progress', icon: TrendingUp },
  ]

  useEffect(() => {
    fetchAttempts()
  }, [])

  const fetchAttempts = async () => {
    try {
      const response = await quizAPI.getMyAttempts()
      setAttempts(response.data)
    } catch (error) {
      console.error('Failed to fetch attempts:', error)
    }
  }

  const chartData = attempts.map((attempt, index) => ({
    quiz: `Quiz ${index + 1}`,
    score: attempt.percentage
  }))

  return (
    <Layout sidebarItems={sidebarItems} title="My Progress">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass">
          <h3 className="text-lg font-semibold mb-4">Quiz Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quiz" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glass">
          <h3 className="text-lg font-semibold mb-4">Recent Quiz Results</h3>
          <div className="space-y-3">
            {attempts.slice(0, 5).map((attempt, index) => (
              <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Quiz #{attempt.id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  attempt.percentage >= 80 ? 'bg-green-100 text-green-800' :
                  attempt.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {attempt.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default StudentProgress
