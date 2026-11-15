import React, { useState } from 'react'
import { authFetch } from '../services/api'
import { API_BASE } from '../services/config'

interface AvatarUploadProps {
  studentId?: number | string
  isEditing: boolean
  currentAvatarUrl?: string | null
  onUploadSuccess: (newUrl: string) => void
  onUploadStateChange?: (isUploading: boolean) => void
}

interface CloudinarySignature {
  signature: string
  timestamp: number
  folder: string
  cloudName: string
  apiKey: string
}

interface CloudinaryUploadResponse {
  secure_url: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

export const PupilAvatarUpload: React.FC<AvatarUploadProps> = ({
  studentId,
  isEditing,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadStateChange,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('יש לבחור קובץ תמונה.')
      input.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('גודל התמונה חייב להיות עד 5MB.')
      input.value = ''
      return
    }

    setErrorMessage('')
    setIsUploading(true)
    onUploadStateChange?.(true)
    try {
      const signatureResponse = await authFetch(`${API_BASE}/api/cloudinary-signature`)
      if (!signatureResponse.ok) {
        throw new Error(signatureResponse.status === 401 || signatureResponse.status === 403
          ? 'אין הרשאה להעלאת תמונה.'
          : 'לא ניתן לקבל אישור להעלאת תמונה.')
      }
      const { signature, timestamp, folder, cloudName, apiKey }: CloudinarySignature =
        await signatureResponse.json()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey)
      formData.append('timestamp', timestamp.toString())
      formData.append('signature', signature)
      formData.append('folder', folder)

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )

      if (!cloudinaryResponse.ok) throw new Error('העלאת התמונה נכשלה.')
      const cloudinaryData: CloudinaryUploadResponse = await cloudinaryResponse.json()
      if (!cloudinaryData.secure_url) throw new Error('Cloudinary לא החזיר כתובת לתמונה.')

      const avatarUrl = cloudinaryData.secure_url

      if (studentId != null && String(studentId).trim()) {
        const saveResponse = await authFetch(
          `${API_BASE}/api/pupils/${encodeURIComponent(studentId)}/avatar`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: avatarUrl }),
          }
        )
        if (!saveResponse.ok) throw new Error('שמירת התמונה בפרטי התלמיד נכשלה.')
      }

      onUploadSuccess(avatarUrl)
    } catch (error) {
      console.error('Pupil avatar upload failed', error)
      setErrorMessage(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה.')
    } finally {
      setIsUploading(false)
      onUploadStateChange?.(false)
      input.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {currentAvatarUrl ? (
        <img
          src={currentAvatarUrl}
          alt="תמונת תלמיד"
          style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div
          aria-label="אין תמונת תלמיד"
          style={{ width: 64, height: 64, borderRadius: '50%', background: '#e5e7eb' }}
        />
      )}
      <label style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}>
        {isUploading ? 'מעלה תמונה...' : isEditing ? 'החלף תמונה' : 'הוסף תמונה'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          style={{ display: 'none' }}
        />
      </label>
      {errorMessage && <span role="alert">{errorMessage}</span>}
    </div>
  )
}
