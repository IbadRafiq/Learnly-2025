import Layout from '../../components/Layout'
import { BarChart3 } from 'lucide-react'

const Analytics = () => {
  const sidebarItems = [
    { label: 'Dashboard', path: '/admin', icon: BarChart3 },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  ]

  return (
    <Layout sidebarItems={sidebarItems} title="System Analytics">
      <div className="card-glass">
        <h3 className="text-lg font-semibold">Detailed Analytics</h3>
        <p className="text-gray-600 mt-2">View comprehensive system analytics here</p>
      </div>
    </Layout>
  )
}

export default Analytics
