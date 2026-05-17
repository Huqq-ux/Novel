import { useState, useRef } from 'react'
import Toast from './Toast'
import { uploadApi } from '../services/api'

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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onChange('')
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '160px',
        border: '2px dashed #ddd',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        background: preview ? 'transparent' : '#f9f9f9',
      }}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="封面预览"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            onClick={handleClear}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            ×
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
          <div style={{ fontSize: '14px' }}>{placeholder}</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            支持 JPG、PNG、GIF、WEBP
          </div>
        </div>
      )}

      {uploading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" />
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
              上传中...
            </div>
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

      <style>{`
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #1677ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
