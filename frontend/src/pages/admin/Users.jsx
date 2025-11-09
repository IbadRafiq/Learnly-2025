import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users as UsersIcon, Search, UserCheck, UserX, Trash2, Filter } from 'lucide-react'
import Layout from '../../components/Layout'
import { usersAPI } from '../../utils/api'

const Users = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const sidebarItems = [
    { label: 'Dashboard', path: '/admin', icon: UsersIcon },
    { label: 'Users', path: '/admin/users', icon: UsersIcon },
    { label: 'Courses', path: '/admin/courses', icon: UsersIcon },
    { label: 'Moderation', path: '/admin/moderation', icon: UsersIcon },
    { label: 'Analytics', path: '/admin/analytics', icon: UsersIcon },
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, roleFilter, users])

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll()
      setUsers(response.data)
      setFilteredUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        user =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleActivate = async (userId) => {
    try {
      await usersAPI.activate(userId)
      await fetchUsers()
      alert('User activated successfully!')
    } catch (error) {
      console.error('Failed to activate user:', error)
      alert('Failed to activate user: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeactivate = async (userId) => {
    try {
      await usersAPI.deactivate(userId)
      await fetchUsers()
      alert('User deactivated successfully!')
    } catch (error) {
      console.error('Failed to deactivate user:', error)
      alert('Failed to deactivate user: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDelete = async (userId) => {
    console.log('Delete button clicked for user:', userId)
    
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      console.log('User cancelled deletion')
      return
    }
    
    console.log('Attempting to delete user:', userId)
    
    try {
      const response = await usersAPI.delete(userId)
      console.log('Delete response:', response)
      await fetchUsers()
      alert('User deleted successfully!')
    } catch (error) {
      console.error('Failed to delete user:', error)
      console.error('Error response:', error.response)
      alert('Failed to delete user: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <Layout sidebarItems={sidebarItems} title="User Management">
      {/* Filters */}
      <div className="card-glass mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 relative">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.full_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      {user.is_active ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeactivate(user.id)
                          }}
                          className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 hover:text-orange-900 transition-colors"
                          title="Deactivate user"
                          type="button"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleActivate(user.id)
                          }}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-900 transition-colors"
                          title="Activate user"
                          type="button"
                        >
                          <UserCheck className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(user.id)
                        }}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-900 transition-colors"
                        title="Delete user permanently"
                        type="button"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found matching your criteria
        </div>
      )}
    </Layout>
  )
}

export default Users
