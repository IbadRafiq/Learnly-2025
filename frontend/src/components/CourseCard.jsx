import { motion } from 'framer-motion'
import { BookOpen, Users, FileText, Trophy } from 'lucide-react'

const CourseCard = ({ course, onClick, showActions = false, actions = null }) => {
  // Get initials from teacher name
  const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Generate a consistent color based on the teacher name
  const getColorClass = (name) => {
    if (!name) return 'from-gray-500 to-gray-600'
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-teal-500 to-teal-600',
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  const teacherInitials = getInitials(course.teacher_name)
  const colorClass = getColorClass(course.teacher_name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      className="card-glass cursor-pointer overflow-hidden group"
    >
      {/* Course Header with Premium Gradient */}
      <div className="h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Course Content */}
      <div className="p-6 relative">
        {/* Teacher Avatar Circle */}
        <div className="absolute -top-12 right-6">
          <div className={`w-20 h-20 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl ring-4 ring-white group-hover:ring-blue-100 transition-all`}>
            {teacherInitials}
          </div>
        </div>

        {/* Course Info */}
        <div className="pr-24">
          <div className="flex items-start gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                {course.title}
              </h3>
              {course.course_code && (
                <p className="text-sm text-gray-500 font-mono mt-1.5 bg-gray-50 px-2 py-0.5 rounded inline-block">
                  {course.course_code}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          {/* Course Stats */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            {course.teacher_name && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="truncate max-w-[120px] font-medium">{course.teacher_name}</span>
              </div>
            )}
            {course.materials !== undefined && (
              <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-blue-700">{course.materials?.length || 0} materials</span>
              </div>
            )}
            {course.quiz_count !== undefined && course.quiz_count > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-50 px-2.5 py-1.5 rounded-lg">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-700">{course.quiz_count} quizzes</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && actions && (
          <div className="mt-5 pt-5 border-t border-gray-100 flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CourseCard
