import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  Trophy,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle,
  GraduationCap,
  MessageCircle,
  Target
} from 'lucide-react'

const Landing = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: Brain,
      title: 'AI Co-Instructor',
      description: 'Get instant answers and personalized guidance from our advanced AI powered by Llama 3.2',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BookOpen,
      title: 'Smart Learning',
      description: 'Access course materials with RAG-powered knowledge retrieval for better understanding',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Trophy,
      title: 'Adaptive Quizzes',
      description: 'Test your knowledge with AI-generated quizzes that adapt to your learning pace',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics and performance insights',
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  const benefits = [
    'Personalized learning experience',
    'Real-time AI assistance',
    'Interactive course materials',
    'Performance analytics',
    'Adaptive assessments',
    'Content moderation for safety'
  ]

  const roles = [
    {
      title: 'Students',
      description: 'Learn with AI assistance, take quizzes, and track your progress',
      icon: GraduationCap,
      color: 'blue'
    },
    {
      title: 'Teachers',
      description: 'Create courses, upload materials, and monitor student performance',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Admins',
      description: 'Manage the platform, oversee content, and analyze system metrics',
      icon: Target,
      color: 'green'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-2xl border-b border-gray-100/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">LEARNLY</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">AI-Powered Learning Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Virtual AI Co-Instructor</span>
              <br />
              <span className="text-gray-800">For Modern Education</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience personalized learning with cutting-edge AI technology.
              Get instant answers, adaptive quizzes, and comprehensive analytics.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
              >
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary text-lg px-8 py-4"
              >
                Sign In
              </button>
            </div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="glass rounded-2xl p-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roles.map((role, index) => (
                  <motion.div
                    key={role.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className={`p-3 bg-gradient-to-br from-${role.color}-500 to-${role.color}-600 rounded-lg w-fit mb-4`}>
                      <role.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{role.title}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for an enhanced learning experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card hover-lift"
              >
                <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-xl w-fit mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">
                Why Choose <span className="gradient-text">LEARNLY?</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform combines the best of AI technology with proven educational methods
                to deliver a superior learning experience.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <MessageCircle className="w-12 h-12 text-blue-600" />
                  <div>
                    <h4 className="font-bold text-lg">AI-Powered Chat</h4>
                    <p className="text-sm text-gray-600">Get instant answers to your questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <BookOpen className="w-12 h-12 text-purple-600" />
                  <div>
                    <h4 className="font-bold text-lg">Smart Materials</h4>
                    <p className="text-sm text-gray-600">RAG-enhanced course content</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <Trophy className="w-12 h-12 text-green-600" />
                  <div>
                    <h4 className="font-bold text-lg">Adaptive Testing</h4>
                    <p className="text-sm text-gray-600">Personalized quiz generation</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center text-white"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students and educators using LEARNLY today.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 mx-auto"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">LEARNLY</span>
          </div>
          <p className="mb-4">Virtual AI Co-Instructor Platform</p>
          <p className="text-sm">
            © 2024 LEARNLY. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
