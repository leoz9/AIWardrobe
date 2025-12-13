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

    // 加载当前配置
    useEffect(() => {
        if (isOpen) {
            fetchConfig()
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

    // 获取模型列表
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

    // 测试连接
    const handleTestConnection = async () => {
        setTesting(true)
        setTestResult(null)

        // 先保存配置
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

    // 保存配置
    const handleSave = async (closeAfter = true) => {
        try {
            const payload = {
                api_base: config.api_base,
                model: config.model,
                bg_removal_method: config.bg_removal_method,
                qweather_api_host: config.qweather_api_host
            }

            // 只有当用户输入了新的 API Key 时才更新
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
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ API 设置</h2>
                    <button className="settings-close" onClick={onClose}>✕</button>
                </div>

                <div className="settings-content">
                    <div className="settings-section-title">LLM 设置</div>
                    <div className="settings-group">
                        <label className="settings-label">
                            API Base URL
                            <span className="settings-hint">支持 OpenAI 风格接口</span>
                        </label>
                        <input
                            type="url"
                            className="settings-input"
                            value={config.api_base}
                            onChange={e => setConfig(prev => ({ ...prev, api_base: e.target.value }))}
                            placeholder="https://api.openai.com/v1"
                        />
                    </div>

                    <div className="settings-group">
                        <label className="settings-label">
                            API Key
                            {hasExistingKey && !config.api_key && (
                                <span className="settings-hint success">已配置</span>
                            )}
                        </label>
                        <input
                            type="password"
                            className="settings-input"
                            value={config.api_key}
                            onChange={e => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                            placeholder={hasExistingKey ? "••••••••（留空保持不变）" : "sk-..."}
                        />
                    </div>

                    <div className="settings-group">
                        <label className="settings-label">
                            模型
                            {loading && <span className="settings-hint">加载中...</span>}
                        </label>
                        <div className="settings-model-input-group">
                            {models.length > 0 && showModelSelect ? (
                                <select
                                    className="settings-input"
                                    value={config.model}
                                    onChange={e => {
                                        if (e.target.value === '__custom__') {
                                            setShowModelSelect(false)
                                        } else {
                                            setConfig(prev => ({ ...prev, model: e.target.value }))
                                        }
                                    }}
                                >
                                    {/* 如果当前模型不在列表中，添加为选项 */}
                                    {!models.find(m => m.id === config.model) && config.model && (
                                        <option value={config.model}>{config.model}</option>
                                    )}
                                    {models.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                    <option value="__custom__">-- 手动输入 --</option>
                                </select>
                            ) : (
                                <div className="settings-input-wrapper">
                                    <input
                                        type="text"
                                        className="settings-input"
                                        value={config.model}
                                        onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                                        placeholder="gpt-4o"
                                        list="model-list"
                                    />
                                    <datalist id="model-list">
                                        {models.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </datalist>
                                    {models.length > 0 && (
                                        <button
                                            className="settings-input-trigger"
                                            onClick={() => setShowModelSelect(true)}
                                            title="切换到选择列表"
                                        >
                                            📋
                                        </button>
                                    )}
                                </div>
                            )}
                            <button
                                className="settings-btn secondary"
                                onClick={fetchModels}
                                disabled={loading}
                            >
                                刷新
                            </button>
                        </div>
                    </div>

                    <div className="settings-group">
                        <button
                            className="settings-btn test"
                            onClick={handleTestConnection}
                            disabled={testing}
                        >
                            {testing ? '测试中...' : '🔗 测试连接'}
                        </button>

                        {testResult && (
                            <div className={`settings-test-result ${testResult.success ? 'success' : 'error'}`}>
                                {testResult.success ? '✓ ' : '✗ '}
                                {testResult.message}
                            </div>
                        )}
                    </div>

                    <div className="settings-group">
                        <div className="settings-common-providers">
                            <p className="settings-label">快速配置预设：</p>
                            <div className="settings-provider-btns">
                                <button
                                    className="settings-provider-btn"
                                    onClick={() => setConfig(prev => ({ ...prev, api_base: 'https://api.openai.com/v1', model: 'gpt-4o' }))}
                                >
                                    OpenAI
                                </button>
                                <button
                                    className="settings-provider-btn"
                                    onClick={() => setConfig(prev => ({ ...prev, api_base: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' }))}
                                >
                                    Anthropic
                                </button>
                                <button
                                    className="settings-provider-btn"
                                    onClick={() => setConfig(prev => ({ ...prev, api_base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash-exp' }))}
                                >
                                    Google
                                </button>
                                <button
                                    className="settings-provider-btn"
                                    onClick={() => setConfig(prev => ({ ...prev, api_base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' }))}
                                >
                                    DeepSeek
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="settings-divider"></div>
                    <div className="settings-section-title">图像处理设置</div>

                    <div className="settings-group">
                        <label className="settings-label">
                            背景移除方式
                        </label>
                        <div className="settings-radio-group">
                            <label className={`settings-radio-item ${config.bg_removal_method === 'local' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="bg_removal_method"
                                    value="local"
                                    checked={config.bg_removal_method === 'local'}
                                    onChange={e => setConfig(prev => ({ ...prev, bg_removal_method: e.target.value }))}
                                />
                                <span className="radio-label">
                                    <strong>本地 rembg (免费)</strong>
                                    <span className="radio-desc">使用服务器 CPU/GPU 处理，无需 API Key</span>
                                </span>
                            </label>
                            <label className={`settings-radio-item ${config.bg_removal_method === 'removebg' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="bg_removal_method"
                                    value="removebg"
                                    checked={config.bg_removal_method === 'removebg'}
                                    onChange={e => setConfig(prev => ({ ...prev, bg_removal_method: e.target.value }))}
                                />
                                <span className="radio-label">
                                    <strong>remove.bg API (付费)</strong>
                                    <span className="radio-desc">效果更好，需要 API Key</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    {config.bg_removal_method === 'removebg' && (
                        <div className="settings-group fade-in">
                            <label className="settings-label">
                                remove.bg API Key
                                {hasRemoveBgKey && !config.removebg_api_key && (
                                    <span className="settings-hint success">已配置</span>
                                )}
                            </label>
                            <input
                                type="password"
                                className="settings-input"
                                value={config.removebg_api_key}
                                onChange={e => setConfig(prev => ({ ...prev, removebg_api_key: e.target.value }))}
                                placeholder={hasRemoveBgKey ? "••••••••（留空保持不变）" : "请输入 API Key"}
                            />
                            <div className="settings-helper-text">
                                <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer">
                                    获取 API Key →
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="settings-divider"></div>
                    <div className="settings-section-title">🌤️ 天气 API 设置</div>

                    <div className="settings-group">
                        <label className="settings-label">
                            和风天气 API Key
                            {hasQweatherKey && !config.qweather_api_key && (
                                <span className="settings-hint success">已配置</span>
                            )}
                        </label>
                        <input
                            type="password"
                            className="settings-input"
                            value={config.qweather_api_key}
                            onChange={e => setConfig(prev => ({ ...prev, qweather_api_key: e.target.value }))}
                            placeholder={hasQweatherKey ? "••••••••（留空保持不变）" : "请输入和风天气 API Key"}
                        />
                        <div className="settings-helper-text">
                            <a href="https://console.qweather.com" target="_blank" rel="noopener noreferrer">
                                获取 API Key →
                            </a>
                            <span className="settings-hint">用于获取实时天气和穿搭建议</span>
                        </div>
                    </div>

                    <div className="settings-group">
                        <label className="settings-label">
                            API Host
                            <span className="settings-hint">和风天气 API 域名（如 m54jab46rp.re.qweatherapi.com）</span>
                        </label>
                        <input
                            type="text"
                            className="settings-input"
                            value={config.qweather_api_host}
                            onChange={e => setConfig(prev => ({ ...prev, qweather_api_host: e.target.value }))}
                            placeholder="devapi.qweather.com"
                        />
                        <div className="settings-helper-text">
                            <a href="https://console.qweather.com/setting?lang=zh" target="_blank" rel="noopener noreferrer">
                                获取域名 →
                            </a>
                        </div>
                    </div>

                </div>

                <div className="settings-footer">
                    <button className="settings-btn secondary" onClick={onClose}>
                        取消
                    </button>
                    <button className="settings-btn primary" onClick={() => handleSave(true)}>
                        保存
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Settings
