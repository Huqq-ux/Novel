import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Toast from '../components/Toast'
import styles from './HelpFeedback.module.css'

interface FAQ {
  question: string
  answer: string
}

/**
 * 帮助与反馈页面
 * 功能描述：提供常见问题（FAQ）浏览和用户意见反馈提交功能
 * 实现逻辑：通过 Tab 切换「常见问题」和「意见反馈」两个面板，
 * 反馈表单提交后通过 Toast 提示成功并清空表单
 */
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
      Toast.error('请输入反馈内容')
      return
    }
    Toast.success('感谢您的反馈！')
    setFeedback('')
    setContact('')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="返回"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.headerTitle}>帮助与反馈</h2>
      </div>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'faq' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          常见问题
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'feedback' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          意见反馈
        </button>
      </div>

      {activeTab === 'faq' ? (
        <div className={styles.faqCard}>
          <Card variant="elevated">
            {faqs.map((item, index) => (
              <div key={index} className={styles.faqItem}>
                <div className={styles.faqQuestion}>
                  Q: {item.question}
                </div>
                <div className={styles.faqAnswer}>
                  A: {item.answer}
                </div>
              </div>
            ))}
          </Card>
        </div>
      ) : (
        <div className={styles.feedbackCard}>
          <Card variant="elevated">
            <div className={styles.feedbackContent}>
              <div className={styles.formGroup}>
                <div className={styles.formLabel}>问题描述</div>
                <Input
                  placeholder="请详细描述您遇到的问题或建议"
                  value={feedback}
                  onChange={setFeedback}
                  rows={4}
                />
              </div>
              <div className={styles.formGroup}>
                <div className={styles.formLabel}>联系方式（选填）</div>
                <Input
                  placeholder="手机号或邮箱"
                  value={contact}
                  onChange={setContact}
                />
              </div>
              <Button variant="primary" block onClick={handleSubmitFeedback}>
                提交反馈
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
