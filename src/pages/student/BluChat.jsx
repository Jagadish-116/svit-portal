import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Trash2,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  Key,
  Copy,
  Check,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CleanAiMessage from '@/components/chat/CleanAiMessage'

const DEFAULT_OPENROUTER_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY ||
  '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'

const BLU_SYSTEM_PROMPT = `You are Blu, a helpful, intelligent, and highly capable AI academic tutor and assistant.
Answer questions directly, accurately, thoroughly, and comprehensively regardless of the subject, field, or topic.

Guidelines:
1. Answer the user's specific question directly, concisely, and completely. Never inject unrelated templates or unwanted boilerplate.
2. If the user asks for code, provide clean, syntactically correct, and well-commented code.
3. Structure your response clearly with helpful bullet points and clean titles when appropriate.
4. Clean Typography: Never output raw markdown headers (#, ##, ###) or excessive asterisks (*). Present clean, easy-to-read text.
5. Completeness: Always finish your explanation and conclusion completely without cutting off midway.`

export default function BluChat() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [customKey, setCustomKey] = useState('')
  const messagesEndRef = useRef(null)

  const [apiKey, setApiKey] = useState(() => {
    return (
      localStorage.getItem('svit_openrouter_api_key') ||
      DEFAULT_OPENROUTER_KEY
    )
  })

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('svit_blu_chat_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('svit_blu_chat_history', JSON.stringify(messages))
    } catch {}
    scrollToBottom()
  }, [messages, isStreaming])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSaveApiKey = () => {
    const trimmed = customKey.trim()
    if (trimmed) {
      localStorage.setItem('svit_openrouter_api_key', trimmed)
      setApiKey(trimmed)
    } else {
      localStorage.removeItem('svit_openrouter_api_key')
      setApiKey(DEFAULT_OPENROUTER_KEY)
    }
    setShowKeyModal(false)
  }

  const suggestedPrompts = [
    'Explain the difference between TCP and UDP with examples',
    'How does binary search work and what is its time complexity?',
    'Explain the concept of public-key cryptography with an example',
    'How do I optimize SQL queries for large datasets?',
  ]

  // Smoothly stream full text to the chat UI word-by-word
  const streamTextToMessage = (fullText, botMessageId) => {
    const words = fullText.split(' ')
    let currentIdx = 0
    let accumulated = ''

    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        accumulated += (currentIdx === 0 ? '' : ' ') + words[currentIdx]
        currentIdx++
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, content: accumulated } : msg
          )
        )
      } else {
        clearInterval(interval)
        setIsStreaming(false)
      }
    }, 20)
  }

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || input).trim()
    if (!queryText || isStreaming) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    const botMessageId = Date.now() + 1
    const initialBotMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }

    setMessages([...newMessages, initialBotMessage])

    const chatPayloadMessages = [
      { role: 'system', content: BLU_SYSTEM_PROMPT },
      ...newMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    // 1. First Attempt: OpenRouter with streaming
    let openRouterSuccess = false
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SVIT Portal - Blu AI Tutor',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          models: [
            'openrouter/free',
            'meta-llama/llama-3.3-70b-instruct:free',
            'google/gemma-4-31b-it:free',
          ],
          max_tokens: 4000,
          temperature: 0.7,
          stream: true,
          messages: chatPayloadMessages,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenRouter HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.replace(/^data:\s*/, '')
              const parsed = JSON.parse(jsonStr)
              const delta = parsed.choices?.[0]?.delta?.content || ''

              if (delta) {
                accumulated += delta
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, content: accumulated } : msg
                  )
                )
              }
            } catch (err) {}
          }
        }
      }

      buffer += decoder.decode()
      if (buffer.trim()) {
        const remainingLines = buffer.split('\n')
        for (const line of remainingLines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.replace(/^data:\s*/, '')
              const parsed = JSON.parse(jsonStr)
              const delta = parsed.choices?.[0]?.delta?.content || ''
              if (delta) {
                accumulated += delta
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, content: accumulated } : msg
                  )
                )
              }
            } catch (err) {}
          }
        }
      }

      if (accumulated.trim()) {
        openRouterSuccess = true
        setIsStreaming(false)
        return
      }
    } catch (openRouterErr) {
      console.warn('OpenRouter connection attempt failed, switching to live universal AI:', openRouterErr)
    }

    // 2. Second Attempt: Live AI provider without key dependency
    if (!openRouterSuccess) {
      try {
        const liveResponse = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: chatPayloadMessages,
            model: 'openai',
            seed: Math.floor(Math.random() * 1000000),
          }),
        })

        if (!liveResponse.ok) {
          throw new Error(`Live AI status: ${liveResponse.status}`)
        }

        const answerText = await liveResponse.text()
        if (answerText && !answerText.includes('Free limit reached')) {
          streamTextToMessage(answerText, botMessageId)
          return
        }
        throw new Error('Limit reached or empty response')
      } catch (liveAiErr) {
        console.error('All live AI providers failed:', liveAiErr)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  content:
                    "I am currently unable to reach the AI service. Please check your internet connection or configure an OpenRouter API key using the key icon above.",
                }
              : msg
          )
        )
        setIsStreaming(false)
      }
    }
  }

  const clearChat = () => {
    if (window.confirm('Clear all conversation history with Blu?')) {
      setMessages([])
      localStorage.removeItem('svit_blu_chat_history')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#090D16] text-[#F1F5F9]">
      {/* Top Header */}
      <header className="h-16 bg-[#0E1424]/90 backdrop-blur-md border-b border-[#1E293B] px-4 md:px-8 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 text-base">
                Blu
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0E1424]" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                Blu AI Academic Tutor
                <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI Tutor Live
                </span>
              </h2>
              <span className="text-[11px] text-slate-400 block font-sans">
                Universal Academic & Technical Assistant
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCustomKey(localStorage.getItem('svit_openrouter_api_key') || '')
              setShowKeyModal(true)
            }}
            className="p-2 text-slate-400 hover:text-blue-400 rounded-xl hover:bg-slate-800/50 transition-colors"
            title="Configure OpenRouter API Key"
          >
            <Key className="w-4 h-4" />
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Messages Thread (Desktop & Mobile Responsive) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="py-12 md:py-20 text-center space-y-6 max-w-xl mx-auto">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-500/30">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-blue-500 to-cyan-400 opacity-20 blur-lg -z-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Welcome to Blu, your Academic Wingman! 🎓
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Ask me anything across computer science, engineering, mathematics, coding, or any academic topic.
              </p>
            </div>

            {/* Suggested Chips Grid */}
            <div className="pt-4 text-left space-y-2.5">
              <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block px-1">
                Suggested Topics to Ask
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-left p-3.5 rounded-2xl bg-[#12192B]/80 hover:bg-[#1A233A] border border-[#1E293B] hover:border-blue-500/50 text-xs md:text-sm text-slate-200 transition-all shadow-md group"
                  >
                    <span className="text-blue-400 font-mono text-xs block mb-1">
                      0{idx + 1}. Concept
                    </span>
                    <span className="group-hover:text-blue-300 transition-colors">
                      {prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-1 shadow-md shadow-blue-500/10">
                    B
                  </div>
                )}
                <div
                  className={`relative group max-w-[88%] md:max-w-[78%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-none shadow-lg shadow-blue-600/20 whitespace-pre-wrap'
                      : 'bg-[#12192B] border border-[#1E293B] text-slate-200 rounded-tl-none shadow-xl'
                  }`}
                >
                  {msg.content ? (
                    isUser ? (
                      msg.content
                    ) : (
                      <>
                        <CleanAiMessage content={msg.content} />
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Zap className="w-3 h-3 text-cyan-400" /> Complete Answer
                          </span>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-slate-800"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 py-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar (Desktop & Mobile optimized) */}
      <div className="p-3 md:p-5 bg-[#0E1424]/90 backdrop-blur-md border-t border-[#1E293B] shrink-0">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Blu anything (e.g. algorithms, physics, history, mathematics, code)..."
              disabled={isStreaming}
              className="flex-1 h-12 md:h-14 bg-[#12192B] border border-[#1E293B] rounded-2xl px-5 text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="h-12 md:h-14 px-5 md:px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 shrink-0"
            >
              {isStreaming ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden md:inline text-sm font-medium">Ask Blu</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Optional API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0E1424] border border-[#1E293B] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                Configure OpenRouter API Key
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Blu connects to live AI models. If you have an OpenRouter API key, you can save it below.
            </p>
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full h-11 bg-[#12192B] border border-[#1E293B] rounded-xl px-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setCustomKey('')
                  localStorage.removeItem('svit_openrouter_api_key')
                  setApiKey(DEFAULT_OPENROUTER_KEY)
                  setShowKeyModal(false)
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Reset Default
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
