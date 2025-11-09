import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import Layout from '../../components/Layout'
import { moderationAPI } from '../../utils/api'

const Moderation = () => {
  const [settings, setSettings] = useState([])
  const [logs, setLogs] = useState([])

  const sidebarItems = [
    { label: 'Dashboard', path: '/admin', icon: Shield },
    { label: 'Moderation', path: '/admin/moderation', icon: Shield },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [settingsRes, logsRes] = await Promise.all([
        moderationAPI.getSettings(),
        moderationAPI.getLogs({ limit: 10 })
      ])
      setSettings(settingsRes.data)
      setLogs(logsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  return (
    <Layout sidebarItems={sidebarItems} title="Content Moderation">
      <div className="card-glass">
        <h3 className="text-lg font-semibold mb-4">Moderation Settings</h3>
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium capitalize">{setting.category}</p>
                <p className="text-sm text-gray-600">Threshold: {setting.threshold}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                setting.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {setting.is_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass mt-6">
        <h3 className="text-lg font-semibold mb-4">Recent Logs</h3>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-900 truncate">{log.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{log.category}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  log.flagged ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {log.flagged ? 'Flagged' : 'Passed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Moderation
