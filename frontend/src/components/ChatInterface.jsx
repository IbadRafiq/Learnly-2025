import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader, AlertTriangle, FileText } from 'lucide-react'

const ChatInterface = ({ courseId, onSendMessage, isLoading }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const response = await onSendMessage(input, messages)

      const aiMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        moderation_passed: response.moderation_passed,
        moderation_warnings: response.moderation_warnings,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = {
        role: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[650px] card-glass">
      {/* Chat Header */}
      <div className="p-5 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="gradient-text">AI Co-Instructor</span>
        </h3>
        <p className="text-sm text-gray-600 mt-2 ml-11">
          Ask me anything about the course materials
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 mt-20"
            >
              <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Start a conversation with your AI Co-Instructor</p>
            </motion.div>
          )}

          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-md ${message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : message.role === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-white text-gray-900 border border-gray-100 shadow-lg'
                  }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                  {message.role === 'user' && <User className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                  {message.role === 'error' && <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>

                    {/* Moderation Warnings */}
                    {message.moderation_warnings && message.moderation_warnings.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Content warning: {message.moderation_warnings.join(', ')}
                      </div>
                    )}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold mb-2 flex items-center text-gray-700">
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          Sources:
                        </p>
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="text-xs bg-gray-50 p-2.5 rounded-lg mb-2 border border-gray-100">
                            <p className="font-semibold text-gray-800">{source.metadata.material}</p>
                            <p className="text-gray-600 truncate mt-1">{source.content}</p>
                            <p className="text-gray-500 mt-1.5 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Relevance: {(source.score * 100).toFixed(0)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confidence */}
                    {message.confidence !== undefined && (
                      <p className="text-xs mt-2 opacity-70">
                        Confidence: {(message.confidence * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-2xl p-4">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
        <div className="flex space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the course..."
            className="flex-1 input resize-none"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-primary self-end disabled:opacity-50 disabled:cursor-not-allowed px-6"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
