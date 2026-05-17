import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { aiApi } from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import styles from './CustomerService.module.css'

interface Message {
  id: number
  type: 'user' | 'service'
  content: string
  time: string
}

type AIModule = 'customer_service' | 'recommend' | 'search'

const MODULE_LABELS: Record<AIModule, string> = {
  customer_service: 'AI客服',
  recommend: '智能推荐',
  search: '智能搜索',
}

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
  const tabs: AIModule[] = ['customer_service', 'recommend', 'search']

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.title}>
          AI智能助手
        </h2>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeModule === tab ? styles.tabActive : ''}`}
            onClick={() => handleModuleChange(tab)}
          >
            {MODULE_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className={styles.chatArea}>
        <div className={styles.chatInner}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.type === 'user' ? styles.messageUser : styles.messageService}`}
            >
              <div
                className={`${styles.bubble} ${msg.type === 'user' ? styles.bubbleUser : styles.bubbleService}`}
              >
                <div className={styles.bubbleContent}>{msg.content}</div>
                <div className={styles.bubbleTime}>{msg.time}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className={styles.typing}>AI正在思考...</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.quickQuestions}>
        {quickQuestions.map((q, i) => (
          <Button
            key={i}
            size="sm"
            variant="secondary"
            onClick={() => {
              setInputValue(q)
            }}
          >
            {q}
          </Button>
        ))}
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputWrap}>
          <Input
            placeholder={MODULE_PLACEHOLDERS[activeModule]}
            value={inputValue}
            onChange={setInputValue}
            onEnterPress={sendMessage}
          />
        </div>
        <div className={styles.sendBtn}>
          <Button
            variant="primary"
            onClick={sendMessage}
            loading={isTyping}
            disabled={isTyping}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
