import { useEffect, useRef, useState } from 'react'
import { Upload as UploadIcon, Camera, Image as ImageIcon, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUpload } from '../contexts/UploadContext'

export default function Upload({ onUploadSuccess }) {
    const { t } = useTranslation()
    const {
        isUploading,
        progress,
        statusKey,
        current,
        total,
        completedSingleItem,
        batchResult,
        lastError,
        uploadFiles,
        consumeCompletedSingleItem,
        consumeBatchResult,
        consumeLastError
    } = useUpload()
    const [isDragging, setIsDragging] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const fileInputRef = useRef(null)
    const cameraInputRef = useRef(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    const status = statusKey
        ? (total > 1 && current > 0 ? `${t(statusKey)} (${current}/${total})` : t(statusKey))
        : ''

    useEffect(() => {
        if (!completedSingleItem) return
        onUploadSuccess?.(completedSingleItem)
        consumeCompletedSingleItem()
    }, [completedSingleItem, onUploadSuccess, consumeCompletedSingleItem])

    useEffect(() => {
        if (!batchResult) return
        alert(t('upload.batchResult', batchResult))
        consumeBatchResult()
    }, [batchResult, t, consumeBatchResult])

    useEffect(() => {
        if (!lastError) return
        const translatedError = lastError === 'INVALID_IMAGE_TYPE'
            ? t('upload.selectImage')
            : lastError
        alert(`${t('upload.uploadFailed')}: ${translatedError}`)
        consumeLastError()
    }, [lastError, t, consumeLastError])

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
            void uploadFiles(Array.from(files))
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
            alert(t('upload.cameraError'))
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
                void uploadFiles([file])
                stopCamera()
            }
        }, 'image/jpeg', 0.9)
    }

    const handleFileChange = (e) => {
        const files = e.target.files
        if (files && files.length > 0) {
            void uploadFiles(Array.from(files))
        }
        e.target.value = ''
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
                className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 ${
                    isDragging ? 'border-accent bg-blue-50/50 dark:bg-blue-950/30 scale-[1.02]' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ minHeight: '300px' }}
            >
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <UploadIcon size={28} />
                </div>

                <h3 className="text-lg font-serif font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{t('upload.title')}</h3>
                <p className="text-sm text-zinc-500 mb-8 text-center">{t('upload.subtitle')}<br/>{t('upload.subtitleAI')}</p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                    <button className="flex-1 btn-primary" onClick={handleCameraClick}>
                        <Camera size={18} />
                        {t('upload.camera')}
                    </button>
                    <button className="flex-1 btn-secondary bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" onClick={handleUploadClick}>
                        <ImageIcon size={18} />
                        {t('upload.album')}
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
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
                        <span className="text-zinc-600 dark:text-zinc-400">{status}</span>
                        <span className="text-accent">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
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
