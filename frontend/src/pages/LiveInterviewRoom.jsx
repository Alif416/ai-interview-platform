import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import { useAuth } from '../context/AuthContext'

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'sql']

const ROLE_COLORS = {
  ADMIN:       { bg: 'rgba(255,55,95,0.15)',  color: '#ff375f', label: 'Admin' },
  INTERVIEWER: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa', label: 'Interviewer' },
  CANDIDATE:   { bg: 'rgba(0,184,163,0.15)',  color: '#00b8a3', label: 'Candidate' },
}

// Distinct colors for collaborative cursors
const CURSOR_COLORS = [
  '#60a5fa', '#00b8a3', '#ffc01e', '#ff375f',
  '#a78bfa', '#34d399', '#fb923c', '#f472b6',
]

function getUserColor(userId) {
  if (!userId) return CURSOR_COLORS[0]
  const sum = String(userId).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return CURSOR_COLORS[sum % CURSOR_COLORS.length]
}

const LC_DARK_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c084fc' },
    { token: 'string', foreground: '86efac' },
    { token: 'number', foreground: 'fca5a5' },
    { token: 'type', foreground: '67e8f9' },
  ],
  colors: {
    'editor.background': '#1a1a1a',
    'editor.foreground': '#eff2f6',
    'editor.lineHighlightBackground': '#282828',
    'editor.selectionBackground': '#ffa11640',
    'editor.inactiveSelectionBackground': '#ffa11620',
    'editorLineNumber.foreground': '#4a4a4a',
    'editorLineNumber.activeForeground': '#ffa116',
    'editorCursor.foreground': '#ffa116',
    'editorIndentGuide.background1': '#3c3c3c',
    'editorWhitespace.foreground': '#3c3c3c',
    'editorRuler.foreground': '#3c3c3c',
    'editorBracketMatch.background': '#ffa11630',
    'editorBracketMatch.border': '#ffa11680',
    'scrollbarSlider.background': '#3c3c3c80',
    'scrollbarSlider.hoverBackground': '#4a4a4a80',
    'minimap.background': '#1a1a1a',
  },
}

const EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  roundedSelection: true,
  padding: { top: 16, bottom: 16 },
  folding: true,
  wordWrap: 'off',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  quickSuggestions: true,
  formatOnPaste: false,
  bracketPairColorization: { enabled: true },
  renderLineHighlight: 'line',
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
}

function TypingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{
            backgroundColor: '#00b8a3',
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  )
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
  const [yjsConnected, setYjsConnected] = useState(false)
  const [participants, setParticipants] = useState([])
  const [language, setLanguage] = useState('javascript')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [joinNotice, setJoinNotice] = useState(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const chatInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Yjs + Monaco refs
  const ydocRef = useRef(null)
  const providerRef = useRef(null)
  const bindingRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  // ── Socket.IO for presence + chat ───────────────────────────────────
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

    s.on('room-state', ({ participants, language: lang, messages }) => {
      setParticipants(participants)
      if (lang) setLanguage(lang)
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

    s.on('language-change', ({ language: lang }) => setLanguage(lang))
    s.on('chat-message', (msg) => setMessages(prev => [...prev, msg]))

    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [sessionId])

  // ── Yjs for collaborative code editing ─────────────────────────────
  useEffect(() => {
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider(
      'ws://localhost:3001',
      sessionId,
      ydoc,
      { connect: true }
    )

    ydocRef.current = ydoc
    providerRef.current = provider

    provider.on('status', ({ status }) => {
      setYjsConnected(status === 'connected')
    })

    // Shared language via Y.Map — sync across all participants
    const ymeta = ydoc.getMap('meta')
    ymeta.observe(() => {
      const lang = ymeta.get('language')
      if (lang) {
        setLanguage(lang)
        if (editorRef.current && monacoRef.current) {
          const model = editorRef.current.getModel()
          monacoRef.current.editor.setModelLanguage(model, lang)
        }
      }
    })

    // Track awareness (who is currently editing, who is typing)
    provider.awareness.on('change', () => {
      const myClientID = provider.awareness.clientID
      const entries = Array.from(provider.awareness.getStates().entries())
      setActiveUsers(entries.filter(([, s]) => s.user).map(([, s]) => s.user))
      setTypingUsers(
        entries
          .filter(([cid, s]) => s.user && s.isTyping && cid !== myClientID)
          .map(([, s]) => s.user)
      )
    })

    // Set local awareness (include role so typing indicator can show it)
    if (user) {
      provider.awareness.setLocalStateField('user', {
        name: user.name,
        color: getUserColor(user.id),
        colorLight: `${getUserColor(user.id)}33`,
        role: user.role,
      })
    }

    // If editor is already mounted, create the binding
    if (editorRef.current && monacoRef.current) {
      createBinding(ydoc, provider, editorRef.current, monacoRef.current)
    }

    return () => {
      clearTimeout(typingTimeoutRef.current)
      bindingRef.current?.destroy()
      bindingRef.current = null
      provider.destroy()
      ydoc.destroy()
      ydocRef.current = null
      providerRef.current = null
    }
  }, [sessionId, user])

  function createBinding(ydoc, provider, editor, monaco) {
    if (bindingRef.current) {
      bindingRef.current.destroy()
    }
    const ytext = ydoc.getText('code')
    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    )
  }

  const handleEditorDidMount = useCallback((editor, monaco) => {
    monaco.editor.defineTheme('lc-dark', LC_DARK_THEME)
    monaco.editor.setTheme('lc-dark')

    editorRef.current = editor
    monacoRef.current = monaco

    // Broadcast typing state via Yjs awareness when the local user edits
    editor.onDidChangeModelContent(() => {
      if (editor.hasTextFocus() && providerRef.current) {
        providerRef.current.awareness.setLocalStateField('isTyping', true)
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          providerRef.current?.awareness.setLocalStateField('isTyping', false)
        }, 1500)
      }
    })

    // If Yjs is already set up, create binding now
    if (ydocRef.current && providerRef.current) {
      createBinding(ydocRef.current, providerRef.current, editor, monaco)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang)
    // Broadcast to all via Yjs (authoritative) and Socket.IO (for non-Yjs fallback)
    ydocRef.current?.getMap('meta').set('language', lang)
    socketRef.current?.emit('language-change', { sessionId, language: lang })
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), lang)
    }
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

  const isFullyConnected = connected && yjsConnected

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--lc-bg)' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 h-14 border-b gap-3"
        style={{ backgroundColor: 'var(--lc-nav)', borderColor: 'var(--lc-border)' }}
      >
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
              {isFullyConnected && (
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
                  style={{ backgroundColor: '#00b8a3' }}
                />
              )}
              <span
                className="relative w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isFullyConnected ? '#00b8a3' : '#ffa116' }}
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

        {/* Participants */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-center overflow-x-auto">
          {participants.length === 0 ? (
            <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>Waiting for participants…</span>
          ) : (
            participants.map(p => (
              <ParticipantChip key={p.userId} participant={p} isCurrentUser={p.userId === user?.id} />
            ))
          )}
        </div>

        {/* Active editor count + connection status */}
        <div className="shrink-0 flex items-center gap-3">
          {activeUsers.length > 1 && (
            <div className="hidden sm:flex items-center gap-1">
              {activeUsers.slice(0, 4).map((u, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2"
                  style={{ backgroundColor: u.color + '33', color: u.color, borderColor: u.color, marginLeft: i > 0 ? '-6px' : 0 }}
                  title={u.name}
                >
                  {u.name?.[0]?.toUpperCase()}
                </span>
              ))}
              {activeUsers.length > 4 && (
                <span className="text-xs ml-1" style={{ color: 'var(--lc-muted)' }}>+{activeUsers.length - 4}</span>
              )}
            </div>
          )}
          <span className="text-xs" style={{ color: isFullyConnected ? '#00b8a3' : 'var(--lc-muted)' }}>
            {isFullyConnected ? 'Live' : connected ? 'Syncing…' : 'Connecting…'}
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
            <ParticipantChip key={p.userId} participant={p} isCurrentUser={p.userId === user?.id} />
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
            <div className="ml-auto flex items-center gap-2">
              {typingUsers.length > 0 && (
                <span
                  className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,184,163,0.1)', color: '#00b8a3', border: '1px solid rgba(0,184,163,0.3)' }}
                >
                  <TypingDots />
                  <span>
                    {typingUsers.map(u => u.name).join(', ')}
                    {' '}{typingUsers.length === 1 ? 'is' : 'are'} typing…
                  </span>
                </span>
              )}
              {yjsConnected && (
                <span
                  className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,184,163,0.12)', color: '#00b8a3', border: '1px solid rgba(0,184,163,0.25)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Collaborative
                </span>
              )}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              theme="lc-dark"
              options={EDITOR_OPTIONS}
              onMount={handleEditorDidMount}
              loading={
                <div
                  className="flex items-center justify-center h-full"
                  style={{ backgroundColor: '#1a1a1a', color: 'var(--lc-muted)' }}
                >
                  <span className="text-sm">Loading editor…</span>
                </div>
              }
            />
          </div>
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
          <style>{`
            @media (min-width: 1024px) { .chat-pane { max-height: 100% !important; width: 360px !important; } }
            @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-3px); opacity: 1; } }
          `}</style>
          <div className="chat-pane flex flex-col min-h-0 h-full" style={{ flex: 1 }}>

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
