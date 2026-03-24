import { useState, useEffect } from 'react'

const Settings = ({ isOpen, onClose, onSave }) => {
    const [config, setConfig] = useState({
        api_base: 'https://api.openai.com/v1',
        api_key: '',
        model: 'gpt-4o',
        removebg_api_key: '',
        bg_removal_method: 'local',
        qweather_api_key: '',
        qweather_api_host: 'devapi.qweather.com'
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
                    qweather_api_host: data.qweather_api_host || 'devapi.qweather.com'
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
        } catch (error) {
            setTestResult({
                success: false,
                message: '连接测试失败'
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
                qweather_api_host: config.qweather_api_host
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div 
                className="bg-[#FAFAFA] w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-xl animate-[slideUp_0.3s_ease-out]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-zinc-200 bg-white sm:rounded-t-2xl px-6">
                    <h2 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">API 设置</h2>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* LLM Section */}
                    <div className="space-y-4">
                        <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">LLM 模型设置</div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 flex justify-between">
                                API Base URL
                                <span className="text-zinc-400 font-normal">支持 OpenAI 风格</span>
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
                            <label className="text-sm font-medium text-zinc-700 flex justify-between">
                                API Key
                                {hasExistingKey && !config.api_key && (
                                    <span className="text-green-500 font-normal text-xs bg-green-50 px-2 py-0.5 rounded">已配置</span>
                                )}
                            </label>
                            <input
                                type="password"
                                className="input-field font-mono"
                                value={config.api_key}
                                onChange={e => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                                placeholder={hasExistingKey ? "••••••••（留空保持不变）" : "sk-..."}
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium text-zinc-700 flex justify-between">
                                模型
                                {loading && <span className="text-zinc-400 font-normal animate-pulse text-xs">获取中...</span>}
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
                                            <option value="__custom__">⚙️ 手动输入...</option>
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
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 rounded-md"
                                                onClick={() => setShowModelSelect(true)}
                                                title="切换到列表"
                                            >
                                                📋
                                            </button>
                                        )}
                                    </div>
                                )}
                                <button className="btn-secondary px-3 shrink-0" onClick={fetchModels} disabled={loading}>
                                    获取
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                className={`w-full py-2.5 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors ${
                                    testResult?.success ? 'border-green-200 bg-green-50 text-green-700' :
                                    testResult?.success === false ? 'border-red-200 bg-red-50 text-red-700' :
                                    'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                                }`}
                                onClick={handleTestConnection}
                                disabled={testing}
                            >
                                {testing ? <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-600 rounded-full animate-spin"></span> : '🔗'}
                                {testing ? '测试连接...' : testResult ? testResult.message : '测试连接'}
                            </button>
                        </div>

                        <div className="pt-2">
                            <p className="text-xs text-zinc-500 mb-2 font-medium">快捷预设：</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {[
                                    { name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o' },
                                    { name: 'Anthropic', base: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
                                    { name: 'Google', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash-exp' },
                                    { name: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
                                ].map(p => (
                                    <button
                                        key={p.name}
                                        className="py-1.5 px-2 bg-white border border-zinc-200 rounded-md text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                        onClick={() => setConfig(prev => ({ ...prev, api_base: p.base, model: p.model }))}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-200/60 w-full" />

                    {/* Image Processing Section */}
                    <div className="space-y-4">
                        <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">图像抠图设置</div>
                        
                        <div className="flex flex-col gap-3">
                            <label className={`flex gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${config.bg_removal_method === 'local' ? 'border-accent bg-blue-50/20' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                                <input
                                    type="radio"
                                    name="bg_removal_method"
                                    value="local"
                                    className="mt-1"
                                    checked={config.bg_removal_method === 'local'}
                                    onChange={e => setConfig(prev => ({ ...prev, bg_removal_method: e.target.value }))}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-zinc-900 text-sm">本地离线 rembg</span>
                                    <span className="text-xs text-zinc-500 mt-0.5">服务器端免费推理，保护隐私</span>
                                </div>
                            </label>

                            <label className={`flex gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${config.bg_removal_method === 'removebg' ? 'border-accent bg-blue-50/20' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                                <input
                                    type="radio"
                                    name="bg_removal_method"
                                    value="removebg"
                                    className="mt-1"
                                    checked={config.bg_removal_method === 'removebg'}
                                    onChange={e => setConfig(prev => ({ ...prev, bg_removal_method: e.target.value }))}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-zinc-900 text-sm flex items-center gap-2">
                                        remove.bg API
                                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[10px] font-bold">PRO</span>
                                    </span>
                                    <span className="text-xs text-zinc-500 mt-0.5">专业级抠图效果，需自行提供 API Key</span>
                                </div>
                            </label>
                        </div>

                        {config.bg_removal_method === 'removebg' && (
                            <div className="animate-fade-in space-y-2 mt-4">
                                <label className="text-sm font-medium text-zinc-700 flex justify-between">
                                    remove.bg API Key
                                    {hasRemoveBgKey && !config.removebg_api_key && (
                                        <span className="text-green-500 font-normal text-xs bg-green-50 px-2 py-0.5 rounded">已配置</span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    className="input-field font-mono"
                                    value={config.removebg_api_key}
                                    onChange={e => setConfig(prev => ({ ...prev, removebg_api_key: e.target.value }))}
                                    placeholder={hasRemoveBgKey ? "••••••••（留空保持不变）" : "请输入 API Key"}
                                />
                                <div className="text-xs flex justify-end">
                                    <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                        前往获取 →
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-zinc-200/60 w-full" />

                    {/* Weather API Section */}
                    <div className="space-y-4 pb-4">
                        <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">天气查询设置</div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 flex justify-between">
                                和风天气 API Key
                                {hasQweatherKey && !config.qweather_api_key && (
                                    <span className="text-green-500 font-normal text-xs bg-green-50 px-2 py-0.5 rounded">已配置</span>
                                )}
                            </label>
                            <input
                                type="password"
                                className="input-field font-mono"
                                value={config.qweather_api_key}
                                onChange={e => setConfig(prev => ({ ...prev, qweather_api_key: e.target.value }))}
                                placeholder={hasQweatherKey ? "••••••••（留空保持不变）" : "请输入 API Key"}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 flex justify-between">
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
                                    和风控制台 →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-zinc-200 bg-white sm:rounded-b-2xl flex gap-3 pb-safe bg-zinc-50/50">
                    <button className="flex-1 py-3 rounded-xl font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors" onClick={onClose}>
                        取消
                    </button>
                    <button className="flex-[2] py-3 rounded-xl font-medium bg-zinc-900 text-white shadow-sm hover:bg-black transition-colors" onClick={() => handleSave(true)}>
                        保存设置
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
