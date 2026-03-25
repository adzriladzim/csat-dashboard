import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot, User, Sparkles, Minimize2, Maximize2 } from 'lucide-react'
import { askAI } from '@/utils/aiUtils'
import useStore from '@/lib/store'
import { aggregateByDosen, avg, getGlobalMeetingStats, detectAnomalies, detectPerformanceDrops } from '@/utils/analytics'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya **Lirzda**, asisten analitik Anda. Ada yang bisa saya bantu bedah dari data CSAT hari ini? ✨📈' }
  ])
  const [isTyping, setIsTyping] = useState(false)
  
  const { getFiltered, parsedData } = useStore()
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || isTyping) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Prepare Rich Context
    const filtered = getFiltered()
    const dosenList = aggregateByDosen(filtered, parsedData)
    const meetingStats = getGlobalMeetingStats(filtered)
    
    const context = {
      currentPage: window.location.pathname,
      summary: {
        totalResponden: filtered.length,
        averageCsat: avg(dosenList.map(d => d.csatGabungan)),
        top3Dosen: dosenList.slice(0, 3).map(d => ({ nama: d.namaDosen, csat: d.csatGabungan })),
        bottom3Dosen: dosenList.slice(-3).reverse().map(d => ({ nama: d.namaDosen, csat: d.csatGabungan })),
      },
      perMeetingStats: meetingStats.map(m => ({
        label: m.pertemuan,
        avg: m.composite,
        respondents: m.count
      })),
      anomalies: detectAnomalies(dosenList).slice(0, 5).map(a => ({
        nama: a.namaDosen,
        type: a.type,
        csat: a.csatGabungan
      })),
      performanceDrops: detectPerformanceDrops(dosenList, 0.4).slice(0, 5)
    }

    const response = await askAI(input, context, messages)
    setMessages(prev => [...prev, response])
    setIsTyping(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[9999] group"
      >
        <Sparkles className="absolute -top-1 -left-1 w-5 h-5 text-amber-400 animate-bounce" />
        <MessageSquare size={24} />
        <span className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Tanya Lirzda AI
        </span>
      </button>
    )
  }

  return (
    <div 
      className={clsx(
        "fixed right-6 bottom-6 bg-[var(--bg-dropdown)] border border-[var(--brand-border)] shadow-[var(--shadow-overlay)] z-[9999] flex flex-col transition-all duration-300 overflow-hidden backdrop-blur-xl",
        isMinimized ? "w-72 h-14 rounded-2xl" : "w-[380px] h-[580px] rounded-3xl"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--border)] bg-blue-600/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white scale-90 shadow-lg shadow-blue-500/20">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--foreground)] leading-none">Lirzda AI</h3>
            {!isMinimized && <span className="text-[10px] text-blue-500 font-bold animate-pulse">Online & Ready</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-[var(--muted)]"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-[var(--muted)]"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/[0.02] dark:bg-white/[0.02]"
          >
            {messages.map((m, i) => (
              <div key={i} className={clsx("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  m.role === 'user' ? "bg-slate-700" : "bg-blue-600"
                )}>
                  {m.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                </div>
                <div className={clsx(
                  "max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap markdown-content",
                  m.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none font-medium" 
                    : "bg-[var(--bg-card)] text-[var(--foreground)] rounded-tl-none border border-[var(--border)]"
                )}>
                  {m.role === 'assistant' && m.cached && (
                    <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
                      <Sparkles size={10} className="text-blue-500" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Lirzda Memory</span>
                    </div>
                  )}
                  {m.role === 'assistant' ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-[var(--bg-card)] rounded-2xl p-4 flex gap-1.5 items-center rounded-tl-none border border-[var(--border)] shadow-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSend}
            className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)] flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tanya sesuatu tentang data..."
              className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs font-medium text-[var(--foreground)] placeholder:text-[var(--muted-2)] focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  )
}
