import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'sql']

const ROLE_COLORS = {
  ADMIN:       { bg: 'rgba(255,55,95,0.15)',  color: '#ff375f', label: 'Admin' },
  INTERVIEWER: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa', label: 'Interviewer' },
  CANDIDATE:   { bg: 'rgba(0,184,163,0.15)',  color: '#00b8a3', label: 'Candidate' },
}

function ParticipantChip({ participant, isCurrentUser }) {
  const r = ROLE_COLORS[participant.role] || { bg: 'rgba(128,128,128,0.15)', color: '#808080', label: participant.role }
  const initials = participant.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs shrink-0"
      style={{ backgroundColor: 'var(--lc-surface-2)', border: '1px solid var(--lc-border)' }}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ backgroundColor: r.bg, color: r.color }}
      >
        {initials}
      </span>
      <span style={{ color: 'var(--lc-text-2)' }}>
        {participant.name}{isCurrentUser && ' (you)'}
      </span>
      <span
        className="px-1 rounded"
        style={{ backgroundColor: r.bg, color: r.color, fontSize: '10px' }}
      >
        {r.label}
      </span>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#00b8a3' }} />
    </div>
  )
}

function ChatMessage({ msg, isOwn }) {
  const r = ROLE_COLORS[msg.role] || { color: '#808080' }
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ backgroundColor: `${r.color}22`, color: r.color }}
      >
        {msg.name?.[0]?.toUpperCase()}
      </span>
      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs" style={{ color: r.color }}>{msg.name}</span>
        )}
        <div
          className="px-3 py-2 rounded-xl text-sm break-words"
          style={{
            backgroundColor: isOwn ? 'var(--lc-orange-dim)' : 'var(--lc-surface-2)',
            color: isOwn ? 'var(--lc-orange)' : 'var(--lc-text-2)',
            border: isOwn ? '1px solid rgba(255,161,22,0.3)' : '1px solid var(--lc-border)',
          }}
        >
          {msg.message}
        </div>
        <span style={{ color: 'var(--lc-muted)', fontSize: '10px' }}>{time}</span>
      </div>
    </div>
  )
}

export default function LiveInterviewRoom() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [connected, setConnected] = useState(false)
  const [participants, setParticipants] = useState([])
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [joinNotice, setJoinNotice] = useState(null)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const chatInputRef = useRef(null)
  const codeRef = useRef(code)
  codeRef.current = code

  useEffect(() => {
    const token = localStorage.getItem('token')
    const s = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket']
    })
    socketRef.current = s

    s.on('connect', () => {
      setConnected(true)
      s.emit('join-room', { sessionId })
    })

    s.on('connect_error', (err) => console.error('Socket error:', err.message))
    s.on('disconnect', () => setConnected(false))

    s.on('room-state', ({ participants, code, language, messages }) => {
      setParticipants(participants)
      setCode(code)
      setLanguage(language)
      setMessages(messages)
    })

    s.on('user-joined', ({ name, participants }) => {
      setParticipants(participants)
      setJoinNotice(`${name} joined the room`)
      setTimeout(() => setJoinNotice(null), 3000)
    })

    s.on('user-left', ({ name, participants }) => {
      setParticipants(participants)
      setJoinNotice(`${name} left the room`)
      setTimeout(() => setJoinNotice(null), 3000)
    })

    s.on('code-change', ({ code }) => setCode(code))
    s.on('language-change', ({ language }) => setLanguage(language))
    s.on('chat-message', (msg) => setMessages(prev => [...prev, msg]))

    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleCodeChange = useCallback((e) => {
    const newCode = e.target.value
    setCode(newCode)
    socketRef.current?.emit('code-change', { sessionId, code: newCode })
  }, [sessionId])

  const handleTabKey = useCallback((e) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.target
    const start = el.selectionStart
    const end = el.selectionEnd
    const newCode = codeRef.current.substring(0, start) + '  ' + codeRef.current.substring(end)
    setCode(newCode)
    socketRef.current?.emit('code-change', { sessionId, code: newCode })
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2
    })
  }, [sessionId])

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang)
    socketRef.current?.emit('language-change', { sessionId, language: lang })
  }, [sessionId])

  const sendMessage = useCallback(() => {
    const msg = chatInput.trim()
    if (!msg || !socketRef.current) return
    socketRef.current.emit('chat-message', { sessionId, message: msg })
    setChatInput('')
    chatInputRef.current?.focus()
  }, [chatInput, sessionId])

  const handleChatKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--lc-bg)' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 h-14 border-b gap-3"
        style={{ backgroundColor: 'var(--lc-nav)', borderColor: 'var(--lc-border)' }}
      >
        {/* Back + title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="lc-btn-ghost text-xs flex items-center gap-1.5"
            style={{ color: 'var(--lc-text-3)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="h-5 w-px" style={{ backgroundColor: 'var(--lc-border)' }} />
          <div className="flex items-center gap-2">
            <span className="relative flex w-2.5 h-2.5">
              {connected && (
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
                  style={{ backgroundColor: '#00b8a3' }}
                />
              )}
              <span
                className="relative w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: connected ? '#00b8a3' : '#ff375f' }}
              />
            </span>
            <span className="font-semibold text-sm" style={{ color: 'var(--lc-text)' }}>
              Live Room
              <span className="ml-1.5 font-mono text-xs" style={{ color: 'var(--lc-text-3)' }}>
                #{sessionId}
              </span>
            </span>
          </div>
        </div>

        {/* Participants — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-center overflow-x-auto">
          {participants.length === 0 ? (
            <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>
              Waiting for participants…
            </span>
          ) : (
            participants.map(p => (
              <ParticipantChip
                key={p.userId}
                participant={p}
                isCurrentUser={p.userId === user?.id}
              />
            ))
          )}
        </div>

        {/* Connection status */}
        <div className="shrink-0">
          <span className="text-xs" style={{ color: connected ? '#00b8a3' : 'var(--lc-muted)' }}>
            {connected ? 'Connected' : 'Connecting…'}
          </span>
        </div>
      </div>

      {/* Mobile participants strip */}
      {participants.length > 0 && (
        <div
          className="md:hidden flex items-center gap-2 px-4 py-2 border-b overflow-x-auto shrink-0"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          {participants.map(p => (
            <ParticipantChip
              key={p.userId}
              participant={p}
              isCurrentUser={p.userId === user?.id}
            />
          ))}
        </div>
      )}

      {/* Join/leave toast */}
      {joinNotice && (
        <div
          className="shrink-0 text-center text-xs py-1.5"
          style={{ backgroundColor: 'var(--lc-surface-2)', color: 'var(--lc-text-3)' }}
        >
          {joinNotice}
        </div>
      )}

      {/* ── Main split pane ───────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">

        {/* Code editor pane */}
        <div
          className="flex flex-col flex-1 min-h-0 border-r"
          style={{ borderColor: 'var(--lc-border)' }}
        >
          {/* Editor toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
            style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--lc-text-3)' }}>Language</span>
            <div className="relative">
              <select
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                className="lc-input text-xs pr-6 appearance-none cursor-pointer"
                style={{ padding: '3px 20px 3px 8px', minWidth: '110px', backgroundColor: 'var(--lc-surface-3)' }}
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                style={{ color: 'var(--lc-text-3)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <span className="ml-auto text-xs hidden sm:block" style={{ color: 'var(--lc-muted)' }}>
              Shared · syncs in real-time
            </span>
          </div>

          {/* Code textarea */}
          <textarea
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleTabKey}
            spellCheck={false}
            placeholder={`// Write your ${language} solution here…`}
            className="flex-1 resize-none outline-none font-mono text-sm p-4 min-h-0"
            style={{
              backgroundColor: 'var(--lc-bg)',
              color: 'var(--lc-text)',
              caretColor: 'var(--lc-orange)',
              lineHeight: '1.7',
              tabSize: 2,
            }}
          />
        </div>

        {/* Chat pane */}
        <div
          className="flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l min-h-0"
          style={{
            width: '100%',
            maxHeight: '40vh',
            borderColor: 'var(--lc-border)',
          }}
        >
          {/* Dynamically handle lg width via inline style */}
          <style>{`@media (min-width: 1024px) { .chat-pane { max-height: 100% !important; width: 360px !important; } }`}</style>
          <div
            className="chat-pane flex flex-col min-h-0 h-full"
            style={{ flex: 1 }}
          >
            {/* Chat header */}
            <div
              className="flex items-center justify-between px-4 py-2 border-b shrink-0"
              style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: 'var(--lc-text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-xs font-medium" style={{ color: 'var(--lc-text-3)' }}>Chat</span>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-muted)' }}
              >
                {messages.length}
              </span>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0"
              style={{ backgroundColor: 'var(--lc-bg)' }}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
                  <svg className="w-8 h-8" style={{ color: 'var(--lc-border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs text-center" style={{ color: 'var(--lc-muted)' }}>
                    No messages yet.<br />Start the conversation!
                  </p>
                </div>
              )}
              {messages.map(msg => (
                <ChatMessage key={msg.id} msg={msg} isOwn={msg.userId === user?.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div
              className="shrink-0 px-3 py-3 border-t"
              style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
            >
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  placeholder={connected ? 'Type a message… (Enter to send)' : 'Connecting…'}
                  className="lc-input flex-1 text-sm"
                  style={{ padding: '7px 12px' }}
                  disabled={!connected}
                />
                <button
                  onClick={sendMessage}
                  disabled={!connected || !chatInput.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center"
                  style={{
                    backgroundColor: connected && chatInput.trim() ? 'var(--lc-orange)' : 'var(--lc-surface-3)',
                    color: connected && chatInput.trim() ? '#1a1a1a' : 'var(--lc-muted)',
                    cursor: connected && chatInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
