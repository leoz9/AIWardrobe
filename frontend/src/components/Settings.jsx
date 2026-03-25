import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon, Globe, Sparkles } from 'lucide-react'

const LANGUAGES = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' }
]

const ZODIAC_SIGNS = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces'
]

const Settings = ({ isOpen, onClose, onSave }) => {
    const { t, i18n } = useTranslation()
    const { theme, toggleTheme } = useTheme()
    const [config, setConfig] = useState({
        api_base: 'https://api.openai.com/v1',
        api_key: '',
        model: 'gpt-4o',
        removebg_api_key: '',
        bg_removal_method: 'local',
        qweather_api_key: '',
        qweather_api_host: 'devapi.qweather.com',
        zodiac_sign: ''
    })
    const [models, setModels] = useState([])
    const [loading, setLoading] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState(null)
    const [hasExistingKey, setHasExistingKey] = useState(false)
    const [hasRemoveBgKey, setHasRemoveBgKey] = useState(false)
    const [hasQweatherKey, setHasQweatherKey] = useState(false)
    const [showModelSelect, setShowModelSelect] = useState(false)

    const API_BASE = `http://${window.location.hostname}:8000/api`

    useEffect(() => {
        if (isOpen) {
            fetchConfig()
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    const fetchConfig = async () => {
        try {
            const response = await fetch(`${API_BASE}/config`)
            if (response.ok) {
                const data = await response.json()
                setConfig(prev => ({
                    ...prev,
                    api_base: data.api_base || 'https://api.openai.com/v1',
                    model: data.model || 'gpt-4o',
                    bg_removal_method: data.bg_removal_method || 'local',
                    qweather_api_host: data.qweather_api_host || 'devapi.qweather.com',
                    zodiac_sign: data.zodiac_sign || ''
                }))
                setHasExistingKey(data.has_api_key)
                setHasRemoveBgKey(data.has_removebg_key)
                setHasQweatherKey(data.has_qweather_key)
            }
        } catch (error) {
            console.error('Failed to fetch config:', error)
        }
    }

    const fetchModels = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE}/models`)
            if (response.ok) {
                const data = await response.json()
                setModels(data.models || [])
                if (data.models && data.models.length > 0) {
                    setShowModelSelect(true)
                }
            }
        } catch (error) {
            console.error('Failed to fetch models:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleTestConnection = async () => {
        setTesting(true)
        setTestResult(null)

        await handleSave(false)

        try {
            const response = await fetch(`${API_BASE}/test-connection`, {
                method: 'POST'
            })
            const data = await response.json()
            setTestResult(data)

            if (data.success) {
                fetchModels()
            }
        } catch {
            setTestResult({
                success: false,
                message: t('settings.testFailed')
            })
        } finally {
            setTesting(false)
        }
    }

    const handleSave = async (closeAfter = true) => {
        try {
            const payload = {
                api_base: config.api_base,
                model: config.model,
                bg_removal_method: config.bg_removal_method,
                qweather_api_host: config.qweather_api_host,
                zodiac_sign: config.zodiac_sign
            }

            if (config.api_key) {
                payload.api_key = config.api_key
            }
            if (config.removebg_api_key) {
                payload.removebg_api_key = config.removebg_api_key
            }
            if (config.qweather_api_key) {
                payload.qweather_api_key = config.qweather_api_key
            }

            const response = await fetch(`${API_BASE}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                if (closeAfter) {
                    onSave && onSave()
                    onClose()
                }
            }
        } catch (error) {
            console.error('Failed to save config:', error)
        }
    }

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div
                className="bg-[var(--bg-primary)] w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-xl animate-[slideUp_0.3s_ease-out]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sm:rounded-t-2xl px-6">
                    <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{t('settings.title')}</h2>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* App Settings Section */}
                    <div className="space-y-4">
                        <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{t('settings.appSection')}</div>

                        {/* Language Switcher */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <Globe size={16} className="text-accent" />
                                {t('settings.language')}
                            </label>
                            <div className="flex gap-2">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            i18n.language === lang.code || (i18n.language.startsWith(lang.code))
                                                ? 'bg-accent text-white shadow-sm'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                        onClick={() => changeLanguage(lang.code)}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Switcher */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                {theme === 'dark' ? <Moon size={16} className="text-accent" /> : <Sun size={16} className="text-accent" />}
                                {t('settings.theme')}
                            </label>
                            <div className="flex gap-2">
                                <button
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                        theme === 'light'
                                            ? 'bg-accent text-white shadow-sm'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                                    onClick={() => theme !== 'light' && toggleTheme()}
                                >
                                    <Sun size={14} />
                                    {t('settings.themeLight')}
                                </button>
                                <button
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                        theme === 'dark'
                                            ? 'bg-accent text-white shadow-sm'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                                    onClick={() => theme !== 'dark' && toggleTheme()}
                                >
                                    <Moon size={14} />
                                    {t('settings.themeDark')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <Sparkles size={16} className="text-accent" />
                                {t('settings.zodiac')}
                            </label>
                            <select
                                className="input-field appearance-none"
                                value={config.zodiac_sign}
                                onChange={e => setConfig(prev => ({ ...prev, zodiac_sign: e.target.value }))}
                            >
                                <option value="">{t('settings.zodiacPlaceholder')}</option>
                                {ZODIAC_SIGNS.map(sign => (
                                    <option key={sign} value={sign}>
                                        {t(`settings.zodiacOptions.${sign}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-200/60 dark:bg-zinc-700/60 w-full" />

                    {/* LLM Section */}
                    <div className="space-y-4">
                        <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{t('settings.llmSection')}</div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
                                {t('settings.apiBaseLabel')}
                                <span className="text-zinc-400 font-normal">{t('settings.apiBaseHint')}</span>
                            </label>
                            <input
                                type="url"
                                className="input-field"
                                value={config.api_base}
                                onChange={e => setConfig(prev => ({ ...prev, api_base: e.target.value }))}
                                placeholder="https://api.openai.com/v1"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
                                {t('settings.apiKeyLabel')}
                                {hasExistingKey && !config.api_key && (
                                    <span className="text-green-500 font-normal text-xs bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">{t('settings.configured')}</span>
                                )}
                            </label>
                            <input
                                type="password"
                                className="input-field font-mono"
                                value={config.api_key}
                                onChange={e => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                                placeholder={hasExistingKey ? `••••••••（${t('settings.keepEmpty')}）` : "sk-..."}
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
                                {t('settings.model')}
                                {loading && <span className="text-zinc-400 font-normal animate-pulse text-xs">{t('settings.fetching')}</span>}
                            </label>
                            <div className="flex gap-2 relative">
                                {models.length > 0 && showModelSelect ? (
                                    <div className="relative flex-1">
                                        <select
                                            className="input-field appearance-none"
                                            value={config.model}
                                            onChange={e => {
                                                if (e.target.value === '__custom__') {
                                                    setShowModelSelect(false)
                                                } else {
                                                    setConfig(prev => ({ ...prev, model: e.target.value }))
                                                }
                                            }}
                                        >
                                            {!models.find(m => m.id === config.model) && config.model && (
                                                <option value={config.model}>{config.model}</option>
                                            )}
                                            {models.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                            <option value="__custom__">⚙️ {t('settings.manualInput')}</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex-1 relative group">
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={config.model}
                                            onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                                            placeholder="gpt-4o"
                                            list="model-list"
                                        />
                                        {models.length > 0 && (
                                            <button
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md"
                                                onClick={() => setShowModelSelect(true)}
                                                title={t('settings.switchToList')}
                                            >
                                                📋
                                            </button>
                                        )}
                                    </div>
                                )}
                                <button className="btn-secondary px-3 shrink-0" onClick={fetchModels} disabled={loading}>
                                    {t('settings.fetch')}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                className={`w-full py-2.5 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors ${
                                    testResult?.success ? 'border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-800 text-green-700 dark:text-green-400' :
                                    testResult?.success === false ? 'border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 text-red-700 dark:text-red-400' :
                                    'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300'
                                }`}
                                onClick={handleTestConnection}
                                disabled={testing}
                            >
                                {testing ? <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-600 rounded-full animate-spin"></span> : '🔗'}
                                {testing ? t('settings.testing') : testResult ? testResult.message : t('settings.testConnection')}
                            </button>
                        </div>

                        <div className="pt-2">
                            <p className="text-xs text-zinc-500 mb-2 font-medium">{t('settings.presets')}</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {[
                                    { name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o' },
                                    { name: 'Anthropic', base: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
                                    { name: 'Google', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash-exp' },
                                    { name: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
                                ].map(p => (
                                    <button
                                        key={p.name}
                                        className="py-1.5 px-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                                        onClick={() => setConfig(prev => ({ ...prev, api_base: p.base, model: p.model }))}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-200/60 dark:bg-zinc-700/60 w-full" />

                    {/* Image Processing Section */}
                    <div className="space-y-4">
                        <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{t('settings.imageSection')}</div>

                        <div className="flex flex-col gap-3">
                            <label className={`flex gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${config.bg_removal_method === 'local' ? 'border-accent bg-blue-50/20 dark:bg-blue-950/20' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                                <input
                                    type="radio"
                                    name="bg_removal_method"
                                    value="local"
                                    className="mt-1"
                                    checked={config.bg_removal_method === 'local'}
                                    onChange={e => setConfig(prev => ({ ...prev, bg_removal_method: e.target.value }))}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{t('settings.localRembg')}</span>
                                    <span className="text-xs text-zinc-500 mt-0.5">{t('settings.localRembgDesc')}</span>
                                </div>
                            </label>

                            <label className={`flex gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${config.bg_removal_method === 'removebg' ? 'border-accent bg-blue-50/20 dark:bg-blue-950/20' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                                <input
                                    type="radio"
                                    name="bg_removal_method"
                                    value="removebg"
                                    className="mt-1"
                                    checked={config.bg_removal_method === 'removebg'}
                                    onChange={e => setConfig(prev => ({ ...prev, bg_removal_method: e.target.value }))}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                                        remove.bg API
                                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold">PRO</span>
                                    </span>
                                    <span className="text-xs text-zinc-500 mt-0.5">{t('settings.removebgDesc')}</span>
                                </div>
                            </label>
                        </div>

                        {config.bg_removal_method === 'removebg' && (
                            <div className="animate-fade-in space-y-2 mt-4">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
                                    remove.bg API Key
                                    {hasRemoveBgKey && !config.removebg_api_key && (
                                        <span className="text-green-500 font-normal text-xs bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">{t('settings.configured')}</span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    className="input-field font-mono"
                                    value={config.removebg_api_key}
                                    onChange={e => setConfig(prev => ({ ...prev, removebg_api_key: e.target.value }))}
                                    placeholder={hasRemoveBgKey ? `••••••••（${t('settings.keepEmpty')}）` : t('settings.removebgKeyPlaceholder')}
                                />
                                <div className="text-xs flex justify-end">
                                    <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                        {t('settings.getKey')}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-zinc-200/60 dark:bg-zinc-700/60 w-full" />

                    {/* Weather API Section */}
                    <div className="space-y-4 pb-4">
                        <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{t('settings.weatherSection')}</div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
                                {t('settings.qweatherKey')}
                                {hasQweatherKey && !config.qweather_api_key && (
                                    <span className="text-green-500 font-normal text-xs bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">{t('settings.configured')}</span>
                                )}
                            </label>
                            <input
                                type="password"
                                className="input-field font-mono"
                                value={config.qweather_api_key}
                                onChange={e => setConfig(prev => ({ ...prev, qweather_api_key: e.target.value }))}
                                placeholder={hasQweatherKey ? `••••••••（${t('settings.keepEmpty')}）` : t('settings.removebgKeyPlaceholder')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
                                API Host
                            </label>
                            <input
                                type="text"
                                className="input-field font-mono text-sm"
                                value={config.qweather_api_host}
                                onChange={e => setConfig(prev => ({ ...prev, qweather_api_host: e.target.value }))}
                                placeholder="devapi.qweather.com"
                            />
                            <div className="text-xs flex justify-end mt-1">
                                <a href="https://console.qweather.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                    {t('settings.qweatherConsole')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sm:rounded-b-2xl flex gap-3 pb-safe">
                    <button className="flex-1 py-3 rounded-xl font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" onClick={onClose}>
                        {t('settings.cancel')}
                    </button>
                    <button className="flex-[2] py-3 rounded-xl font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm hover:bg-black dark:hover:bg-white transition-colors" onClick={() => handleSave(true)}>
                        {t('settings.saveSettings')}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default Settings
