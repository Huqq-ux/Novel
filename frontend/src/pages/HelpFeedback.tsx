import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Input, Button, TextArea, Toast } from 'antd-mobile'
import { LeftOutline } from 'antd-mobile-icons'

interface FAQ {
  question: string
  answer: string
}

export default function HelpFeedback() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'faq' | 'feedback'>('faq')
  const [feedback, setFeedback] = useState('')
  const [contact, setContact] = useState('')

  const faqs: FAQ[] = [
    { question: '如何修改密码？', answer: '请进入"设置"页面，点击"修改密码"进行操作。' },
    { question: '书籍无法加载怎么办？', answer: '请检查网络连接，或尝试清除缓存后重新加载。' },
    { question: '如何删除阅读记录？', answer: '在"我的阅读"页面，长按书籍可选择删除记录。' },
    { question: '书币如何获取？', answer: '每日签到可获得书币，连续签到奖励更多。' },
    { question: '如何联系客服？', answer: '请进入"联系客服"页面，在线客服将为您解答。' },
  ]

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      Toast.show('请输入反馈内容')
      return
    }
    Toast.show('感谢您的反馈！')
    setFeedback('')
    setContact('')
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '60px' }}>
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
          帮助与反馈
        </h2>
      </div>

      <div style={{ display: 'flex', marginBottom: '16px' }}>
        <Button
          fill={activeTab === 'faq' ? 'solid' : 'none'}
          color={activeTab === 'faq' ? 'primary' : 'default'}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('faq')}
        >
          常见问题
        </Button>
        <Button
          fill={activeTab === 'feedback' ? 'solid' : 'none'}
          color={activeTab === 'feedback' ? 'primary' : 'default'}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('feedback')}
        >
          意见反馈
        </Button>
      </div>

      {activeTab === 'faq' ? (
        <Card>
          <List>
            {faqs.map((item, index) => (
              <List.Item key={index} style={{ padding: '12px 0' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Q: {item.question}
                </div>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                  A: {item.answer}
                </div>
              </List.Item>
            ))}
          </List>
        </Card>
      ) : (
        <Card>
          <div style={{ padding: '12px 0' }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>问题描述</div>
            <TextArea
              placeholder="请详细描述您遇到的问题或建议"
              value={feedback}
              onChange={setFeedback}
              rows={4}
              style={{ marginBottom: '16px' }}
            />
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>联系方式（选填）</div>
            <Input
              placeholder="手机号或邮箱"
              value={contact}
              onChange={setContact}
              style={{ marginBottom: '16px' }}
            />
            <Button color="primary" block onClick={handleSubmitFeedback}>
              提交反馈
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
