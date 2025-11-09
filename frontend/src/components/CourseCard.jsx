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
    if (!name) return 'bg-gray-500'
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
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
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      onClick={onClick}
      className="card-glass cursor-pointer overflow-hidden group"
    >
      {/* Course Header with Gradient */}
      <div className="h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full"></div>
      </div>

      {/* Course Content */}
      <div className="p-6 relative">
        {/* Teacher Avatar Circle */}
        <div className="absolute -top-10 right-6">
          <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-white`}>
            {teacherInitials}
          </div>
        </div>

        {/* Course Info */}
        <div className="pr-20">
          <div className="flex items-start gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {course.title}
              </h3>
              {course.course_code && (
                <p className="text-sm text-gray-500 font-mono mt-1">
                  {course.course_code}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
            {course.description}
          </p>

          {/* Course Stats */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            {course.teacher_name && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="truncate max-w-[120px]">{course.teacher_name}</span>
              </div>
            )}
            {course.materials !== undefined && (
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{course.materials?.length || 0} materials</span>
              </div>
            )}
            {course.quiz_count !== undefined && course.quiz_count > 0 && (
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>{course.quiz_count} quizzes</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && actions && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CourseCard
