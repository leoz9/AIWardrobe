import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Upload from '../components/Upload'
import Settings from '../components/Settings'
import { Save, ArrowLeft, Tag, Palette, Layers, CloudSun, FileText, Shirt, Settings as SettingsIcon } from 'lucide-react'

const API_BASE = `http://${window.location.hostname}:8000/api`

export default function Entry() {
    const { t } = useTranslation()
    const [editingItem, setEditingItem] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [formData, setFormData] = useState({
        item: '',
        category: 'top',
        description: '',
        color_semantics: '',
        style_semantics: '',
        season_semantics: '',
        usage_semantics: ''
    })

    const handleUploadSuccess = (item) => {
        setEditingItem(item)
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
            const payload = {
                ...formData,
                style_semantics: formData.style_semantics.split(/[,，]\s*/).filter(Boolean),
                season_semantics: formData.season_semantics.split(/[,，]\s*/).filter(Boolean),
                usage_semantics: formData.usage_semantics.split(/[,，]\s*/).filter(Boolean),
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
                const event = new CustomEvent('show-toast', {
                    detail: { type: 'success', message: t('entry.saveSuccess') }
                })
                window.dispatchEvent(event)
                setEditingItem(null)
            } else {
                throw new Error('Save failed')
            }
        } catch (error) {
            console.error('Save error:', error)
            const event = new CustomEvent('show-toast', {
                detail: { type: 'error', message: t('entry.saveFailed') }
            })
            window.dispatchEvent(event)
        } finally {
            setLoading(false)
        }
    }

    if (editingItem) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col animate-fade-in relative z-20">
                <header className="glass-header px-4 py-4 flex items-center justify-between sticky top-0">
                    <button className="btn-icon" onClick={() => setEditingItem(null)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-serif font-semibold text-[var(--text-primary)]">{t('entry.editTitle')}</h2>
                    <button
                        className={`text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${loading ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' : 'bg-accent text-white hover:bg-blue-700'}`}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin"></span> : <Save size={18} />}
                        <span>{loading ? t('entry.saving') : t('entry.save')}</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-6">
                    <div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 flex flex-col items-center justify-center mt-4">
                        <img
                            src={`${API_BASE.replace('/api', '')}${editingItem.image_url}`}
                            alt="Preview"
                            className="w-full h-full object-contain drop-shadow-md"
                        />
                    </div>

                    <div className="space-y-6">
                        <section className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-2">{t('entry.basicInfo')}</h3>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <Tag className="text-accent" size={16} /> {t('entry.name')}
                                </label>
                                <input
                                    type="text"
                                    name="item"
                                    value={formData.item}
                                    onChange={handleChange}
                                    placeholder={t('entry.namePlaceholder')}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <Shirt className="text-accent" size={16} /> {t('entry.category')}
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="input-field appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat pr-10"
                                >
                                    <option value="top">{t('entry.categoryTop')}</option>
                                    <option value="bottom">{t('entry.categoryBottom')}</option>
                                    <option value="shoes">{t('entry.categoryShoes')}</option>
                                    <option value="accessory">{t('entry.categoryAccessory')}</option>
                                </select>
                            </div>
                        </section>

                        <section className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-2">{t('entry.features')}</h3>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <Palette className="text-accent" size={16} /> {t('entry.color')}
                                </label>
                                <input
                                    type="text"
                                    name="color_semantics"
                                    value={formData.color_semantics}
                                    onChange={handleChange}
                                    placeholder={t('entry.colorPlaceholder')}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <Layers className="text-accent" size={16} /> {t('entry.style')}
                                </label>
                                <input
                                    type="text"
                                    name="style_semantics"
                                    value={formData.style_semantics}
                                    onChange={handleChange}
                                    placeholder={t('entry.stylePlaceholder')}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <CloudSun className="text-accent" size={16} /> {t('entry.season')}
                                </label>
                                <input
                                    type="text"
                                    name="season_semantics"
                                    value={formData.season_semantics}
                                    onChange={handleChange}
                                    placeholder={t('entry.seasonPlaceholder')}
                                    className="input-field"
                                />
                            </div>
                        </section>

                        <section className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-2">
                                <FileText className="text-accent" size={16} /> {t('entry.description')}
                            </h3>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="input-field resize-none"
                                placeholder={t('entry.descriptionPlaceholder')}
                            />
                        </section>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4 flex flex-col pt-safe">
            <header className="flex items-center justify-between mb-8 mt-4">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)]">{t('entry.title')}</h1>
                <button
                    className="p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
                    onClick={() => setShowSettings(true)}
                >
                    <SettingsIcon className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200" size={20} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto">
                <Upload onUploadSuccess={handleUploadSuccess} />
            </div>

            <Settings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={() => {
                }}
            />
        </div>
    )
}
