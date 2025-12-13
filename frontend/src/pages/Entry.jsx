import { useState } from 'react'
import Upload from '../components/Upload'
import Settings from '../components/Settings'
import { Save, ArrowLeft, Tag, Palette, Layers, CloudSun, FileText, Shirt, Settings as SettingsIcon } from 'lucide-react'

const API_BASE = `http://${window.location.hostname}:8000/api`

export default function Entry() {
    const [editingItem, setEditingItem] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [formData, setFormData] = useState({
        item: '',
        category: 'top',
        description: '',
        color_semantics: '',
        style_semantics: '', // Display as comma separated string
        season_semantics: '',
        usage_semantics: ''
    })

    const handleUploadSuccess = (item) => {
        setEditingItem(item)
        // Initialize form with AI results
        setFormData({
            item: item.item,
            category: item.category,
            description: item.description || '',
            color_semantics: item.color_semantics || '',
            style_semantics: item.style_semantics?.join(', ') || '',
            season_semantics: item.season_semantics?.join(', ') || '',
            usage_semantics: item.usage_semantics?.join(', ') || ''
        })
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Convert comma separated strings back to arrays
            const payload = {
                ...formData,
                style_semantics: formData.style_semantics.split(/[,，]\s*/).filter(Boolean),
                season_semantics: formData.season_semantics.split(/[,，]\s*/).filter(Boolean),
                usage_semantics: formData.usage_semantics.split(/[,，]\s*/).filter(Boolean),
                // Keep original image filename
                image_filename: editingItem.image_url.split('/').pop()
            }

            const response = await fetch(`${API_BASE}/clothes/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                // Show a nice toast or alert
                const event = new CustomEvent('show-toast', {
                    detail: { type: 'success', message: '保存成功！' }
                })
                window.dispatchEvent(event)
                setEditingItem(null) // Return to upload screen
            } else {
                throw new Error('Save failed')
            }
        } catch (error) {
            console.error('Save error:', error)
            const event = new CustomEvent('show-toast', {
                detail: { type: 'error', message: '保存失败' }
            })
            window.dispatchEvent(event)
        } finally {
            setLoading(false)
        }
    }

    if (editingItem) {
        return (
            <div className="page-container entry-edit-page fade-in">
                <header className="page-header sticky-header">
                    <button className="icon-btn secondary" onClick={() => setEditingItem(null)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2>编辑信息</h2>
                    <button className="icon-btn primary" onClick={handleSave} disabled={loading}>
                        <Save size={20} />
                        <span>保存</span>
                    </button>
                </header>

                <div className="edit-scroll-container">
                    <div className="image-preview-card">
                        <img
                            src={`${API_BASE.replace('/api', '')}${editingItem.image_url}`}
                            alt="Preview"
                            className="preview-img"
                        />
                        <div className="preview-overlay"></div>
                    </div>

                    <div className="edit-form">
                        <div className="form-section">
                            <h3 className="section-title">基本信息</h3>

                            <div className="form-group">
                                <label>名称</label>
                                <div className="input-wrapper">
                                    <Tag className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="item"
                                        value={formData.item}
                                        onChange={handleChange}
                                        placeholder="衣物名称"
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>分类</label>
                                <div className="input-wrapper">
                                    <Shirt className="input-icon" size={18} />
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="top">上装 (Top)</option>
                                        <option value="bottom">下装 (Bottom)</option>
                                        <option value="shoes">鞋履 (Shoes)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">特征属性</h3>

                            <div className="form-group">
                                <label>颜色</label>
                                <div className="input-wrapper">
                                    <Palette className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="color_semantics"
                                        value={formData.color_semantics}
                                        onChange={handleChange}
                                        placeholder="主要颜色"
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>风格</label>
                                <div className="input-wrapper">
                                    <Layers className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="style_semantics"
                                        value={formData.style_semantics}
                                        onChange={handleChange}
                                        placeholder="如: 休闲, 运动 (逗号分隔)"
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>季节</label>
                                <div className="input-wrapper">
                                    <CloudSun className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="season_semantics"
                                        value={formData.season_semantics}
                                        onChange={handleChange}
                                        placeholder="如: 夏季, 秋季 (逗号分隔)"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">详细描述</h3>
                            <div className="form-group no-icon">
                                <div className="input-wrapper">
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="form-textarea"
                                        placeholder="关于这件衣服的更多细节..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>录入新衣</h1>
                <button className="icon-btn secondary" onClick={() => setShowSettings(true)}>
                    <SettingsIcon size={20} />
                </button>
            </header>
            <div className="entry-content">
                <Upload onUploadSuccess={handleUploadSuccess} />
            </div>
            <Settings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={() => {
                    // 可以在这里添加保存后的回调逻辑
                }}
            />
        </div>
    )
}
