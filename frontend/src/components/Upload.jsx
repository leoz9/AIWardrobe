import { useState, useRef } from 'react'

const API_BASE = `http://${window.location.hostname}:8000/api`

export default function Upload({ onUploadSuccess }) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState('')
    const [showCamera, setShowCamera] = useState(false)
    const fileInputRef = useRef(null)
    const cameraInputRef = useRef(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            uploadFile(files[0])
        }
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleCameraClick = () => {
        // 移动端直接调用系统相机
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            cameraInputRef.current?.click()
        } else {
            // 桌面端打开视频流
            startCamera()
        }
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            setShowCamera(true)
        } catch (err) {
            console.error('Camera error:', err)
            alert('无法访问相机，请检查权限设置')
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setShowCamera(false)
    }

    const capturePhoto = () => {
        if (!videoRef.current) return

        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(videoRef.current, 0, 0)

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
                uploadFile(file)
                stopCamera()
            }
        }, 'image/jpeg', 0.9)
    }

    const handleFileChange = (e) => {
        const files = e.target.files
        if (files && files.length > 0) {
            uploadFile(files[0])
        }
        e.target.value = ''
    }

    const uploadFile = async (file) => {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件')
            return
        }

        setIsUploading(true)
        setProgress(10)
        setStatus('正在上传图片...')

        const formData = new FormData()
        formData.append('file', file)

        try {
            setProgress(30)
            setStatus('正在移除背景...')

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            })

            setProgress(70)
            setStatus('正在分析衣物语义...')

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || '上传失败')
            }

            const data = await response.json()

            setProgress(100)
            setStatus('完成!')

            setTimeout(() => {
                setIsUploading(false)
                setProgress(0)
                setStatus('')
                onUploadSuccess?.(data)
            }, 500)

        } catch (error) {
            console.error('Upload error:', error)
            alert(`上传失败: ${error.message}`)
            setIsUploading(false)
            setProgress(0)
            setStatus('')
        }
    }

    // 相机模式 UI
    if (showCamera) {
        return (
            <div className="camera-section">
                <div className="camera-view">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="camera-video"
                    />
                </div>
                <div className="camera-controls">
                    <button className="camera-btn cancel" onClick={stopCamera}>
                        ✕ 取消
                    </button>
                    <button className="camera-btn capture" onClick={capturePhoto}>
                        📸 拍照
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="upload-section">
            <div
                className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="upload-icon">👕</div>
                <p className="upload-text">添加衣物到衣柜</p>

                <div className="upload-buttons">
                    <button className="upload-btn" onClick={handleUploadClick}>
                        📁 选择图片
                    </button>
                    <button className="upload-btn camera" onClick={handleCameraClick}>
                        📷 拍照
                    </button>
                </div>

                <p className="upload-hint">支持拖拽上传 JPG、PNG 格式</p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="upload-input"
                    onChange={handleFileChange}
                />
                {/* 移动端相机 input */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="upload-input"
                    onChange={handleFileChange}
                />
            </div>

            {isUploading && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="progress-text">{status}</p>
                </div>
            )}
        </div>
    )
}
