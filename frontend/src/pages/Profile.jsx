import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, Mail, Camera, Save, X, BookOpen, GraduationCap, Award
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store/authStore'
import { usersAPI, authAPI } from '../utils/api'

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const sidebarItems = [
    { label: 'Dashboard', path: `/${user?.role}`, icon: BookOpen },
    { label: 'Profile', path: '/profile', icon: User },
  ]

  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(`http://localhost:8000/${user.avatar}`)
    }
  }, [user])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', avatarFile)
      
      const response = await usersAPI.uploadAvatar(formData)
      
      // Refresh user data
      const userResponse = await authAPI.getMe()
      updateUser(userResponse.data)
      
      alert('Profile picture updated successfully!')
      setAvatarFile(null)
    } catch (error) {
      alert('Failed to upload avatar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return

    setUploading(true)
    try {
      await usersAPI.deleteAvatar()
      
      // Refresh user data
      const userResponse = await authAPI.getMe()
      updateUser(userResponse.data)
      
      setAvatarPreview(null)
      alert('Profile picture deleted successfully!')
    } catch (error) {
      alert('Failed to delete avatar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (!user) return null

  return (
    <Layout sidebarItems={sidebarItems} title="Profile Settings">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
        </div>

        {/* Profile Picture Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Picture</h2>
          
          <div className="flex items-center gap-6">
            {/* Avatar Display */}
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-blue-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-100">
                  {getInitials(user.full_name)}
                </div>
              )}
              
              {/* Upload Button Overlay */}
              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                Choose a profile picture. Recommended size: 400x400px. Max file size: 5MB.
              </p>
              <div className="flex gap-3">
                {avatarFile && (
                  <>
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploading}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{uploading ? 'Uploading...' : 'Save Photo'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setAvatarFile(null)
                        setAvatarPreview(user?.avatar ? `http://localhost:8000/${user.avatar}` : null)
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
                {user.avatar && !avatarFile && (
                  <button
                    onClick={handleAvatarDelete}
                    disabled={uploading}
                    className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="input flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{user.full_name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="input flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="input">
                  <span className="text-gray-900 capitalize font-medium">{user.role}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <div className="input">
                  <span className="text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Student-specific fields */}
            {user.role === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {user.semester && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Semester
                    </label>
                    <div className="input flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">Semester {user.semester}</span>
                    </div>
                  </div>
                )}

                {user.degree_type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Degree Program
                    </label>
                    <div className="input flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user.degree_type}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competency Score
                  </label>
                  <div className="input flex items-center gap-3">
                    <Award className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900 font-semibold">{user.competency_score}/100</span>
                        <span className="text-xs text-gray-500">
                          {user.competency_score < 40 ? 'Beginner' : 
                           user.competency_score < 70 ? 'Intermediate' : 'Advanced'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${user.competency_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Account Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-glass"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Account Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Account Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.is_active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Email Verified</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.is_verified 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user.is_verified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Profile
