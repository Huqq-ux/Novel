import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAIChat } from '../hooks/useAIChat'
import Button from './Button'
import Input from './Input'

export default function AIFloatingAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, loading, streamingContent, sendMessage } = useAIChat('customer_service')
  const endRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const isReaderPage = location.pathname.startsWith('/read')

  useEffect(() => {
    if (isReaderPage && open) {
      setOpen(false)
    }
  }, [isReaderPage])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const msg = input
    setInput('')
    await sendMessage(msg)
  }

  if (isReaderPage) return null

  return (
    <>
      {!open && (
        <div
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '72px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139, 115, 85, 0.4)',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="#fff">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
        </div>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            right: '12px',
            bottom: '72px',
            width: 'calc(100vw - 24px)',
            maxWidth: '380px',
            height: '520px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-card)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>AI小阅助手</span>
            </div>
            <div
              onClick={() => setOpen(false)}
              style={{ cursor: 'pointer', padding: '4px', lineHeight: 1 }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-tertiary)' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🤖</div>
                <div style={{ fontSize: '14px' }}>您好！我是AI小阅，请问有什么可以帮您？</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
                  {['如何充值书币？', '书籍无法打开', '如何成为作者？', '账号登录问题'].map(q => (
                    <span
                      key={q}
                      onClick={() => setInput(q)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: msg.type === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    backgroundColor: msg.type === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: msg.type === 'user' ? '#fff' : 'var(--color-text-primary)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && streamingContent && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: '14px 14px 14px 4px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {streamingContent}
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '14px',
                    backgroundColor: 'var(--color-primary)',
                    marginLeft: '2px',
                    animation: 'blink 1s infinite',
                    verticalAlign: 'text-bottom',
                  }} />
                </div>
              </div>
            )}
            {loading && !streamingContent && (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', padding: '4px 8px' }}>AI正在思考...</div>
            )}
            <div ref={endRef} />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '10px 12px',
              borderTop: '1px solid var(--color-divider)',
              background: 'var(--color-bg)',
            }}
          >
            <Input
              placeholder="请描述您的问题..."
              value={input}
              onChange={setInput}
              onEnterPress={handleSend}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              loading={loading}
              disabled={loading || !input.trim()}
              style={{ minWidth: '56px' }}
            >
              发送
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
