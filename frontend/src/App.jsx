import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Public Pages
import Landing from './pages/Landing'

// Auth Pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminCourses from './pages/admin/Courses'
import AdminModeration from './pages/admin/Moderation'
import AdminAnalytics from './pages/admin/Analytics'

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherCourses from './pages/teacher/Courses'
import TeacherCourseDetail from './pages/teacher/CourseDetail'
import TeacherAIChat from './pages/teacher/AIChat'
import TeacherQuiz from './pages/teacher/Quiz'
import TeacherAnalytics from './pages/teacher/Analytics'

// Student Pages
import StudentDashboard from './pages/student/Dashboard'
import StudentCourses from './pages/student/Courses'
import StudentCourseDetail from './pages/student/CourseDetail'
import StudentAIChat from './pages/student/AIChat'
import StudentQuiz from './pages/student/Quiz'
import StudentProgress from './pages/student/Progress'

// Shared Pages
import Profile from './pages/Profile'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore()
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
  }
  
  return children
}

function App() {
  const { user } = useAuthStore()

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminModeration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        
        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course/:courseId"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherCourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/ai-chat/:courseId"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherAIChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quiz/:courseId"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/analytics"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherAnalytics />
            </ProtectedRoute>
          }
        />
        
        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/course/:courseId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentCourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/ai-chat/:courseId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAIChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quiz/:quizId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/progress"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProgress />
            </ProtectedRoute>
          }
        />
        
        {/* Shared Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        {/* Default route - Landing page or dashboard based on auth */}
        <Route
          path="/"
          element={
            user ? <Navigate to={`/${user.role}`} replace /> : <Landing />
          }
        />
      </Routes>
    </Router>
  )
}

export default App
