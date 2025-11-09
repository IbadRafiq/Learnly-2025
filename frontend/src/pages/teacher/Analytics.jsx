import { BookOpen } from 'lucide-react'
import Layout from '../../components/Layout'

const TeacherAnalytics = () => {
  const sidebarItems = [
    { label: 'Dashboard', path: '/teacher', icon: BookOpen },
    { label: 'Analytics', path: '/teacher/analytics', icon: BookOpen },
  ]

  return (
    <Layout sidebarItems={sidebarItems} title="Student Analytics">
      <div className="card-glass">
        <h3 className="text-lg font-semibold">Student Performance Analytics</h3>
        <p className="text-gray-600 mt-2">View detailed student performance metrics here</p>
      </div>
    </Layout>
  )
}

export default TeacherAnalytics
