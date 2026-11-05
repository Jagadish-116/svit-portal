import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Trash2, Sparkles, RefreshCw, ChevronLeft, Terminal, Shield, BookOpen, Code2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import CleanAiMessage from '@/components/chat/CleanAiMessage'

const OPENROUTER_API_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY 

const BLU_SYSTEM_PROMPT = `You are Blu, the elite AI Academic Tutor designed for Swamy Vivekananda Institute of Technology (SVIT) specifically for the CSE – Cyber Security cohort (SR25 Regulation).

Key Faculty & Curriculum Context:
- Software Engineering (SE): Taught by Karuna Mam (Theory & UML Lab). Emphasize clean requirements engineering (IEEE SRS), Agile vs Waterfall, Design Patterns, and secure software development lifecycles.
- Cryptography & Network Security (CNS): Dr. K. Srinivas (AES, RSA, ECC, TLS, PKI, Network Defense).
- Cyber Forensics & Incident Response (CFIR): Prof. R. Venkatesh (Digital Evidence, Autopsy, Volatility, Chain of Custody).
- Database Management Systems (DBMS): Mrs. Anitha Reddy (SQL, ACID, Normalization, Query Optimization).
- Computer Networks (CN): Mr. Suresh Babu (TCP/IP, OSI layers, routing, Wireshark packet analysis).

Persona & Instruction Style:
1. Tone: Friendly, knowledgeable, sharp, cyber-focused, encouraging.
2. Structure: Break down complex engineering concepts with real-world analogies (e.g. comparing network packets to physical mail sorting or encryption to secure vaults).
3. Code Formatting: Provide well-commented code snippets in Python, C++, Java, or SQL.
4. Exam Guidance: Offer concise tips for Mid-Term and Final exams when asked.
5. Formatting: Never output raw # or unnecessary asterisks (*). Use clean clean section titles and simple bullet points so the text is smooth and easy to read.`

export default function BluChat() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)

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

  const suggestedPrompts = [
    'Explain Software Engineering Agile vs Waterfall (Karuna Mam SE syllabus)',
    'Explain the TCP/IP model with real-world analogies',
    'What is SQL injection and how do I prevent it?',
    'Explain Diffie-Hellman Key Exchange in Cryptography',
  ]

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

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SVIT Portal - Blu Academic Tutor',
        },
        body: JSON.stringify({
          // openrouter/free automatically selects an active free model
          model: 'openrouter/free',
          models: [
            'openrouter/free',
            'meta-llama/llama-3.3-70b-instruct:free'
          ],
          max_tokens: 800,
          temperature: 0.7,
          stream: true,
          messages: [
            { role: 'system', content: BLU_SYSTEM_PROMPT },
            ...newMessages.slice(-12).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `OpenRouter returned status ${response.status}`;
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.replace(/^data:\s*/, '');
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              
              if (delta) {
                accumulated += delta;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, content: accumulated } : msg
                  )
                );
              }
            } catch (err) {
              // Ignore partial chunk decode glitches
            }
          }
        }
      }
    } catch (err) {
      console.warn('OpenRouter fetch failed, using fallback tutor response:', err);
      
      const fallbackText = `Hello ${profile?.full_name || 'student'}! 🎓\n\nI am currently operating in resilient offline mode.\n\nRegarding **"${queryText}"**:\n\nIn **Software Engineering (SE - Karuna Mam)** and **Cyber Security**, always ensure requirements traceability and defense-in-depth.\n\nCheck the **Study Resources** tab for the latest lecture notes.\n\nFeel free to ask another query or check back when online!`;
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: fallbackText } : msg
        )
      );
    } finally {
      setIsStreaming(false);
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
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 text-base">
                Blu
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0E1424]" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                Blu AI Academic Tutor
                <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  GPT-4o Live
                </span>
              </h2>
              <span className="text-[11px] text-slate-400 block font-sans">
                SVIT CSE Cyber Security • SR25 Cohort
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                Powered by live GPT-4o for SVIT Cyber Security. Ask me about <span className="text-blue-400 font-semibold">Karuna Mam's Software Engineering</span>, Cryptography algorithms, Forensics labs, or exam preparation!
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
                  className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-none shadow-lg shadow-blue-600/20 whitespace-pre-wrap'
                      : 'bg-[#12192B] border border-[#1E293B] text-slate-200 rounded-tl-none shadow-xl'
                  }`}
                >
                  {msg.content ? (
                    isUser ? (
                      msg.content
                    ) : (
                      <CleanAiMessage content={msg.content} />
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
              placeholder="Ask Blu anything (e.g. SE design patterns, RSA cipher, buffer overflow)..."
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
    </div>
  )
}
