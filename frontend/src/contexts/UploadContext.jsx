import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const API_BASE = `http://${window.location.hostname}:8000/api`

const UploadContext = createContext(null)

const INITIAL_UPLOAD_STATE = {
  isUploading: false,
  progress: 0,
  statusKey: '',
  current: 0,
  total: 0,
  completedSingleItem: null,
  batchResult: null,
  lastError: ''
}

export function UploadProvider({ children }) {
  const [state, setState] = useState(INITIAL_UPLOAD_STATE)
  const uploadingRef = useRef(false)

  const setStage = useCallback((statusKey, current, total) => {
    setState(prev => ({
      ...prev,
      statusKey,
      current,
      total
    }))
  }, [])

  const uploadSingleFile = useCallback(async (file, current, total) => {
    if (!file?.type?.startsWith('image/')) {
      throw new Error('INVALID_IMAGE_TYPE')
    }

    const formData = new FormData()
    formData.append('file', file)

    setStage('upload.removingBg', current, total)
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    })

    setStage('upload.analyzing', current, total)
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || 'UPLOAD_FAILED')
    }

    return response.json()
  }, [setStage])

  const uploadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) {
      return { successItems: [], failedMessages: [] }
    }
    if (uploadingRef.current) {
      return { successItems: [], failedMessages: ['UPLOAD_IN_PROGRESS'] }
    }

    const imageFiles = files.filter(file => file?.type?.startsWith('image/'))
    if (imageFiles.length === 0) {
      return { successItems: [], failedMessages: ['INVALID_IMAGE_TYPE'] }
    }

    uploadingRef.current = true
    setState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      statusKey: 'upload.uploading',
      current: 0,
      total: imageFiles.length,
      completedSingleItem: null,
      batchResult: null,
      lastError: ''
    }))

    const total = imageFiles.length
    const successItems = []
    const failedMessages = []

    try {
      for (let i = 0; i < total; i += 1) {
        const file = imageFiles[i]
        const current = i + 1
        const baseProgress = Math.round((i / total) * 100)

        setState(prev => ({
          ...prev,
          progress: Math.max(baseProgress, 5)
        }))
        setStage('upload.uploading', current, total)

        try {
          const data = await uploadSingleFile(file, current, total)
          successItems.push(data)
          setState(prev => ({
            ...prev,
            progress: Math.round((current / total) * 100)
          }))
        } catch (error) {
          failedMessages.push(error?.message || 'UPLOAD_FAILED')
        }
      }

      const nextState = {
        isUploading: false,
        progress: 0,
        statusKey: '',
        current: 0,
        total: 0,
        completedSingleItem: total === 1 && successItems.length === 1 ? successItems[0] : null,
        batchResult: total > 1 ? { success: successItems.length, failed: total - successItems.length } : null,
        lastError: total === 1 && successItems.length === 0 ? (failedMessages[0] || 'UPLOAD_FAILED') : ''
      }
      setState(prev => ({ ...prev, ...nextState }))
      return { successItems, failedMessages }
    } finally {
      uploadingRef.current = false
    }
  }, [setStage, uploadSingleFile])

  const consumeCompletedSingleItem = useCallback(() => {
    setState(prev => ({ ...prev, completedSingleItem: null }))
  }, [])

  const consumeBatchResult = useCallback(() => {
    setState(prev => ({ ...prev, batchResult: null }))
  }, [])

  const consumeLastError = useCallback(() => {
    setState(prev => ({ ...prev, lastError: '' }))
  }, [])

  const value = useMemo(() => ({
    ...state,
    uploadFiles,
    consumeCompletedSingleItem,
    consumeBatchResult,
    consumeLastError
  }), [state, uploadFiles, consumeCompletedSingleItem, consumeBatchResult, consumeLastError])

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider')
  }
  return context
}

