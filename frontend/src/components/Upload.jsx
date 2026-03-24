import { useState, useRef } from 'react'
import { Upload as UploadIcon, Camera, Image as ImageIcon, X } from 'lucide-react'

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
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            cameraInputRef.current?.click()
        } else {
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
            setStatus('正在分析衣物...')

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

    if (showCamera) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                <div className="flex-1 relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="h-32 bg-black pb-safe flex items-center justify-around px-8">
                    <button className="p-4 text-white hover:text-red-400 transition-colors" onClick={stopCamera}>
                        <X size={28} />
                    </button>
                    <button className="w-16 h-16 rounded-full bg-white border-4 border-zinc-300 active:scale-95 transition-transform" onClick={capturePhoto}></button>
                    <div className="w-14"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div
                className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 bg-white ${
                    isDragging ? 'border-accent bg-blue-50/50 scale-[1.02]' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ minHeight: '300px' }}
            >
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <UploadIcon size={28} />
                </div>
                
                <h3 className="text-lg font-serif font-semibold text-zinc-800 mb-1">添加新衣物</h3>
                <p className="text-sm text-zinc-500 mb-8 text-center">支持拍照或本地上传图片<br/>AI将自动去除背景并分类</p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                    <button className="flex-1 btn-primary" onClick={handleCameraClick}>
                        <Camera size={18} />
                        拍照
                    </button>
                    <button className="flex-1 btn-secondary bg-white border border-zinc-200" onClick={handleUploadClick}>
                        <ImageIcon size={18} />
                        相册
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {isUploading && (
                <div className="mt-6 space-y-2 animate-fade-in">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-zinc-600">{status}</span>
                        <span className="text-accent">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent transition-all duration-300 relative top-0 left-0"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20" style={{
                                backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                backgroundSize: '1rem 1rem',
                                animation: 'progress 1s linear infinite'
                            }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
