import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Tabs } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'
import { aiApi } from '../services/api'

interface Message {
  id: number
  type: 'user' | 'service'
  content: string
  time: string
}

type AIModule = 'customer_service' | 'recommend' | 'search'

const MODULE_PLACEHOLDERS: Record<AIModule, string> = {
  customer_service: '请描述您遇到的问题...',
  recommend: '告诉我您想看什么类型的书...',
  search: '输入书名、作者或关键词搜索...',
}

const MODULE_QUICK_QUESTIONS: Record<AIModule, string[]> = {
  customer_service: ['如何充值书币？', '书籍无法打开', '账号登录问题', '如何成为作者？'],
  recommend: ['推荐科幻小说', '最近热门的文学书', '类似三体的书', '适合睡前看的书'],
  search: ['搜索三体', '东野圭吾的书', '玄幻类小说', '评分最高的书'],
}

export default function CustomerService() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<AIModule>('customer_service')
  const [messagesMap, setMessagesMap] = useState<Record<AIModule, Message[]>>({
    customer_service: [
      { id: 1, type: 'service', content: '您好！我是小阅，小说阅读平台的AI客服助手，请问有什么可以帮您？', time: formatTime() },
    ],
    recommend: [
      { id: 1, type: 'service', content: '您好！我是AI推荐助手，可以根据您的喜好推荐书籍，请告诉我您想看什么类型的书？', time: formatTime() },
    ],
    search: [
      { id: 1, type: 'service', content: '您好！我是AI搜索助手，可以帮您精准找到想看的书，请输入书名、作者或关键词。', time: formatTime() },
    ],
  })
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = messagesMap[activeModule]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function formatTime() {
    const now = new Date()
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const time = formatTime()
    const userMsg: Message = { id: Date.now(), type: 'user', content: inputValue, time }

    setMessagesMap((prev) => ({
      ...prev,
      [activeModule]: [...prev[activeModule], userMsg],
    }))
    setInputValue('')
    setIsTyping(true)

    try {
      const userId = parseInt(localStorage.getItem('userId') || '0') || undefined
      const result = await aiApi[activeModule === 'customer_service' ? 'customerService' : activeModule](
        inputValue,
        sessionId,
        userId,
      )

      const data = result as any
      if (data?.session_id && !sessionId) {
        setSessionId(data.session_id)
      }

      const responseText = data?.response || '抱歉，服务暂时不可用，请稍后再试。'
      const botMsg: Message = {
        id: Date.now() + 1,
        type: 'service',
        content: responseText,
        time: formatTime(),
      }

      setMessagesMap((prev) => ({
        ...prev,
        [activeModule]: [...prev[activeModule], botMsg],
      }))
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        type: 'service',
        content: '抱歉，AI服务暂时不可用，请稍后再试或联系人工客服。',
        time: formatTime(),
      }
      setMessagesMap((prev) => ({
        ...prev,
        [activeModule]: [...prev[activeModule], errorMsg],
      }))
    } finally {
      setIsTyping(false)
    }
  }

  const handleModuleChange = (key: string) => {
    setActiveModule(key as AIModule)
  }

  const quickQuestions = MODULE_QUICK_QUESTIONS[activeModule]

  return (
    <div style={{ padding: '12px', paddingBottom: '60px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 84px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
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
          AI智能助手
        </h2>
      </div>

      <Tabs
        activeKey={activeModule}
        onChange={handleModuleChange}
        style={{ marginBottom: '12px' }}
      >
        <Tabs.Tab title="AI客服" key="customer_service" />
        <Tabs.Tab title="智能推荐" key="recommend" />
        <Tabs.Tab title="智能搜索" key="search" />
      </Tabs>

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
                <div style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>{msg.time}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ color: '#999', fontSize: '12px', padding: '8px' }}>AI正在思考...</div>
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
          placeholder={MODULE_PLACEHOLDERS[activeModule]}
          value={inputValue}
          onChange={setInputValue}
          onEnterPress={sendMessage}
          style={{ flex: 1 }}
        />
        <Button color="primary" onClick={sendMessage} loading={isTyping} disabled={isTyping}>
          发送
        </Button>
      </div>
    </div>
  )
}
