import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import Layout from '../../components/Layout'
import ChatInterface from '../../components/ChatInterface'
import { ragAPI } from '../../utils/api'

const StudentAIChat = () => {
  const { courseId } = useParams()
  const [loading, setLoading] = useState(false)

  const sidebarItems = [
    { label: 'Dashboard', path: '/student', icon: BookOpen },
    { label: 'My Courses', path: '/student/courses', icon: BookOpen },
  ]

  const handleSendMessage = async (message, history) => {
    setLoading(true)
    try {
      const response = await ragAPI.query({
        query: message,
        course_id: parseInt(courseId),
        conversation_history: history
      })
      return response.data
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout sidebarItems={sidebarItems} title="AI Co-Instructor">
      <ChatInterface
        courseId={courseId}
        onSendMessage={handleSendMessage}
        isLoading={loading}
      />
    </Layout>
  )
}

export default StudentAIChat
