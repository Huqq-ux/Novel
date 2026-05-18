import { useState, useRef } from 'react'
import Toast from './Toast'
import { uploadApi } from '../services/api'
import styles from './ImageUploader.module.css'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  maxSize?: number
}

export default function ImageUploader({
  value,
  onChange,
  placeholder = '点击上传封面',
  maxSize = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      Toast.info('请选择图片文件')
      return
    }

    const maxBytes = maxSize * 1024 * 1024
    if (file.size > maxBytes) {
      Toast.error(`图片大小不能超过 ${maxSize}MB`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const response: any = await uploadApi.uploadCover(file)
      if (response?.code === 200 && response?.data?.url) {
        onChange(response.data.url)
        Toast.success('上传成功')
      } else {
        Toast.error(response?.message || '上传失败')
      }
    } catch (error: any) {
      console.error('Upload failed:', error)
      Toast.error(error.response?.data?.message || '上传失败')
    } finally {
      setUploading(false)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const oldValue = value || preview
    setPreview(null)
    onChange('')
    if (oldValue && oldValue.startsWith('/uploads/')) {
      try {
        await uploadApi.deleteFile(oldValue)
      } catch {
        // 清理失败不阻塞用户操作
      }
    }
  }

  return (
    <div onClick={handleClick} className={styles.container}>
      {preview ? (
        <>
          <img src={preview} alt="封面预览" className={styles.previewImg} />
          <div onClick={handleClear} className={styles.clearBtn}>×</div>
        </>
      ) : (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>📷</div>
          <div className={styles.placeholderText}>{placeholder}</div>
          <div className={styles.placeholderHint}>支持 JPG、PNG、GIF、WEBP</div>
        </div>
      )}

      {uploading && (
        <div className={styles.overlay}>
          <div className={styles.spinnerWrap}>
            <div className={styles.spinner} />
            <div className={styles.spinnerText}>上传中...</div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
