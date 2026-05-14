import { useState, useRef, useCallback } from 'react'

type AIModule = 'recommend' | 'search' | 'customer_service'

interface Message {
  id: number
  type: 'user' | 'assistant'
  content: string
  time: string
}

function formatTime() {
  const now = new Date()
  return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
}

const API_ENDPOINTS: Record<AIModule, string> = {
  recommend: '/api/ai/recommend',
  search: '/api/ai/search',
  customer_service: '/api/ai/customer-service',
}

export function useAIChat(module: AIModule) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const sessionIdRef = useRef<string | undefined>()
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = { id: Date.now(), type: 'user', content, time: formatTime() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setStreamingContent('')

    const userId = parseInt(localStorage.getItem('userId') || '0') || undefined
    abortRef.current = new AbortController()

    try {
      const response = await fetch(API_ENDPOINTS[module], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          session_id: sessionIdRef.current,
          user_id: userId,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullText = ''
      let returnedSessionId: string | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'session' && data.session_id) {
              returnedSessionId = data.session_id
            } else if (data.type === 'token') {
              fullText += data.content
              setStreamingContent(fullText)
            } else if (data.type === 'error') {
              fullText = `抱歉，服务暂时不可用：${data.message}`
              setStreamingContent(fullText)
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }

      if (returnedSessionId && !sessionIdRef.current) {
        sessionIdRef.current = returnedSessionId
      }

      const finalText = fullText || '抱歉，服务暂时不可用，请稍后再试。'
      const botMsg: Message = { id: Date.now() + 1, type: 'assistant', content: finalText, time: formatTime() }
      setMessages(prev => [...prev, botMsg])
      setStreamingContent('')
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg: Message = {
          id: Date.now() + 1,
          type: 'assistant',
          content: '抱歉，AI服务暂时不可用，请稍后再试。',
          time: formatTime(),
        }
        setMessages(prev => [...prev, errorMsg])
      }
    } finally {
      setLoading(false)
    }
  }, [module, loading])

  const clearMessages = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setStreamingContent('')
    sessionIdRef.current = undefined
  }, [])

  return { messages, loading, streamingContent, sendMessage, clearMessages }
}
