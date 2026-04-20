import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'

interface Message {
  id: number
  type: 'user' | 'service'
  content: string
  time: string
}

export default function CustomerService() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'service', content: '您好！我是番茄小说在线客服，请问有什么可以帮您？', time: '10:00' },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = () => {
    if (!inputValue.trim()) return

    const now = new Date()
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`

    setMessages([
      ...messages,
      { id: Date.now(), type: 'user', content: inputValue, time },
    ])
    setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      const responses = [
        '好的，我已收到您的问题，正在为您查询...',
        '请您稍等，我需要核实一下相关信息。',
        '感谢您的反馈，我们会尽快处理。',
        '如果您有其他问题，可以随时告诉我。',
        '这个问题我已经记录下来，会反馈给相关部门处理。',
      ]
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'service',
          content: responses[Math.floor(Math.random() * responses.length)],
          time: `${now.getHours()}:${(now.getMinutes() + 1).toString().padStart(2, '0')}`,
        },
      ])
      setIsTyping(false)
    }, 1500)
  }

  const quickQuestions = [
    '如何充值书币？',
    '书籍无法打开',
    '账号登录问题',
    '其他问题',
  ]

  return (
    <div style={{ padding: '12px', paddingBottom: '60px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 84px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: '12px',
          }}
        >
          <LeftOutline fontSize={18} color="#fff" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          联系客服
        </h2>
      </div>

      <Card style={{ flex: 1, overflow: 'auto', marginBottom: '12px' }}>
        <div style={{ minHeight: '300px' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: msg.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.type === 'user' ? '#1677ff' : '#f0f0f0',
                  color: msg.type === 'user' ? '#fff' : '#333',
                }}
              >
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>{msg.time}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ color: '#999', fontSize: '12px', padding: '8px' }}>客服正在输入...</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickQuestions.map((q, i) => (
            <Button
              key={i}
              size="small"
              fill="outline"
              onClick={() => {
                setInputValue(q)
              }}
            >
              {q}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Input
          placeholder="请输入您的问题..."
          value={inputValue}
          onChange={setInputValue}
          onEnterPress={sendMessage}
          style={{ flex: 1 }}
        />
        <Button color="primary" onClick={sendMessage}>
          发送
        </Button>
      </div>
    </div>
  )
}
