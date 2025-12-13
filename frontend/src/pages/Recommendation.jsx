import { useState, useEffect } from 'react'
import { Search, MapPin, Sparkles, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const API_BASE = `http://${window.location.hostname}:8000/api`

export default function Recommendation() {
    const [loading, setLoading] = useState(false)
    const [weather, setWeather] = useState(null)
    const [recommendation, setRecommendation] = useState('')
    const [suggestedTop, setSuggestedTop] = useState(null)
    const [suggestedBottom, setSuggestedBottom] = useState(null)

    // 城市搜索相关
    const [cityQuery, setCityQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedCity, setSelectedCity] = useState({
        name: '上海',
        id: '101020100'
    })
    const [showCityPicker, setShowCityPicker] = useState(false)



    // 打字机效果
    const [displayedRecommendation, setDisplayedRecommendation] = useState('')

    useEffect(() => {
        if (!recommendation) {
            setDisplayedRecommendation('')
            return
        }

        // 使用 Array.from 正确处理 emoji 等多字节字符
        const chars = Array.from(recommendation)
        let index = 0
        setDisplayedRecommendation('')

        const timer = setInterval(() => {
            if (index < chars.length) {
                index++
                setDisplayedRecommendation(chars.slice(0, index).join(''))
            } else {
                clearInterval(timer)
            }
        }, 30) // 打字速度

        return () => clearInterval(timer)
    }, [recommendation])

    // 搜索城市
    const searchCity = async (query) => {
        if (!query || query.trim().length < 1) {
            setSearchResults([])
            return
        }

        try {
            const response = await fetch(`${API_BASE}/cities?query=${encodeURIComponent(query)}&limit=10`)
            if (response.ok) {
                const cities = await response.json()
                setSearchResults(cities)
            } else {
                setSearchResults([])
            }
        } catch (error) {
            console.error('城市搜索失败:', error)
            setSearchResults([])
        }
    }

    // 选择城市
    const selectCity = (city) => {
        setSelectedCity({
            name: `${city.name}, ${city.adm1}`,
            id: city.id
        })
        setShowCityPicker(false)
        setCityQuery('')
        setSearchResults([])
        fetchRecommendation(city.id)
    }

    // 获取AI推荐
    const fetchRecommendation = async (locationId) => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE}/recommendation?location=${locationId}`)
            if (response.ok) {
                const data = await response.json()
                setWeather(data.weather)
                setRecommendation(data.recommendation_text)
                setSuggestedTop(data.suggested_top)
                setSuggestedBottom(data.suggested_bottom)
            }
        } catch (error) {
            console.error('获取推荐失败:', error)
        } finally {
            setLoading(false)
        }
    }

    // 刷新推荐
    const refreshRecommendation = () => {
        fetchRecommendation(selectedCity.id)
    }

    // 获取天气图标
    const getWeatherIcon = (icon) => {
        // 和风天气图标代码映射
        const iconMap = {
            '100': '☀️', // 晴
            '101': '☁️', // 多云
            '102': '⛅', // 少云
            '103': '⛅', // 晴间多云
            '104': '☁️', // 阴
            '150': '🌙', // 晴（夜间）
            '300': '🌦️', // 阵雨
            '301': '⛈️', // 强阵雨
            '302': '⛈️', // 雷阵雨
            '303': '⛈️', // 强雷阵雨
            '304': '🌨️', // 雷阵雨伴有冰雹
            '305': '🌧️', // 小雨
            '306': '🌧️', // 中雨
            '307': '🌧️', // 大雨
            '308': '🌧️', // 极端降雨
            '309': '🌦️', // 毛毛雨/细雨
            '310': '⛈️', // 暴雨
            '311': '⛈️', // 大暴雨
            '312': '⛈️', // 特大暴雨
            '313': '🌨️', // 冻雨
            '314': '🌧️', // 小到中雨
            '315': '🌧️', // 中到大雨
            '316': '🌧️', // 大到暴雨
            '317': '⛈️', // 暴雨到大暴雨
            '318': '⛈️', // 大暴雨到特大暴雨
            '399': '🌧️', // 雨
            '400': '🌨️', // 小雪
            '401': '🌨️', // 中雪
            '402': '❄️', // 大雪
            '403': '❄️', // 暴雪
            '404': '🌨️', // 雨夹雪
            '405': '🌨️', // 雨雪天气
            '406': '🌨️', // 阵雨夹雪
            '407': '❄️', // 阵雪
            '408': '🌨️', // 小到中雪
            '409': '❄️', // 中到大雪
            '410': '❄️', // 大到暴雪
            '499': '❄️', // 雪
            '500': '🌫️', // 薄雾
            '501': '🌫️', // 雾
            '502': '🌫️', // 霾
            '503': '🌪️', // 扬沙
            '504': '🌪️', // 浮尘
            '507': '🌪️', // 沙尘暴
            '508': '🌪️', // 强沙尘暴
            '509': '🌫️', // 浓雾
            '510': '🌫️', // 强浓雾
            '511': '🌫️', // 中度霾
            '512': '🌫️', // 重度霾
            '513': '🌫️', // 严重霾
            '514': '🌫️', // 大雾
            '515': '🌫️'  // 特强浓雾
        }
        return iconMap[icon] || '🌤️'
    }

    return (
        <div className="page-container recommendation-page">
            {/* 城市选择器 */}
            <div className="city-selector">
                <div className="city-display" onClick={() => setShowCityPicker(!showCityPicker)}>
                    <MapPin size={18} />
                    <span>{selectedCity.name}</span>
                    <span className="city-arrow">{showCityPicker ? '▲' : '▼'}</span>
                </div>

                {showCityPicker && (
                    <div className="city-picker-modal">
                        <div className="city-search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="搜索城市（支持拼音）"
                                value={cityQuery}
                                onChange={(e) => {
                                    setCityQuery(e.target.value)
                                    searchCity(e.target.value)
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="city-results">
                            {searchResults.length > 0 ? (
                                searchResults.map((city) => (
                                    <div
                                        key={city.id}
                                        className="city-item"
                                        onClick={() => selectCity(city)}
                                    >
                                        <div className="city-name">{city.name}</div>
                                        <div className="city-info">{city.adm1} · {city.country}</div>
                                    </div>
                                ))
                            ) : cityQuery ? (
                                <div className="city-empty">未找到匹配的城市</div>
                            ) : (
                                <div className="city-hint">请输入城市名称进行搜索</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 初始状态：显示生成按钮 */}
            {!weather && !loading && (
                <div className="recommendation-initial">
                    <div className="initial-icon">
                        <Sparkles size={48} />
                    </div>
                    <h2>准备好开启今天的时尚之旅了吗？</h2>
                    <p>点击下方按钮，AI将根据实时天气为您推荐最佳穿搭。</p>
                    <button
                        className="generate-btn"
                        onClick={() => fetchRecommendation(selectedCity.id)}
                    >
                        <Sparkles size={20} />
                        生成今日穿搭推荐
                    </button>
                    <div className="weather-hint">
                        <span>当前城市：{selectedCity.name}</span>
                    </div>
                </div>
            )}

            {/* 天气显示 */}
            {weather && (
                <div className="weather-card">
                    <div className="weather-icon-large">
                        {getWeatherIcon(weather.icon)}
                    </div>
                    <div className="weather-main">
                        <div className="temperature">{Math.round(weather.temperature)}°</div>
                        <div className="condition">{weather.condition}</div>
                    </div>
                    <div className="weather-details">
                        <div className="detail-item">
                            <span className="detail-label">体感</span>
                            <span className="detail-value">{Math.round(weather.feelsLike)}°</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">湿度</span>
                            <span className="detail-value">{weather.humidity}%</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">风力</span>
                            <span className="detail-value">{weather.windScale}级</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading 状态 */}
            {loading && (
                <div className="recommendation-loading">
                    <Sparkles className="loading-icon" size={24} />
                    <span>AI正在为您生成推荐...</span>
                </div>
            )}

            {/* AI推荐结果 - 仅在有天气信息且不加载时显示 */}
            {!loading && weather && (
                <>
                    <div className="recommendation-header">
                        <div className="recommendation-title">
                            <Sparkles size={20} />
                            <span>AI穿搭推荐</span>
                        </div>
                        <button className="refresh-btn" onClick={refreshRecommendation} title="刷新推荐">
                            <RefreshCw size={18} />
                        </button>
                    </div>

                    <div className="recommendation-text">
                        <ReactMarkdown>{displayedRecommendation}</ReactMarkdown>
                        {displayedRecommendation.length < recommendation.length && (
                            <span className="typing-cursor">|</span>
                        )}
                    </div>

                    {/* 推荐的衣服卡片 */}
                    <div className="outfit-suggestions">
                        {/* 推荐的上衣 */}
                        {suggestedTop && (
                            <div className="suggestion-card">
                                <div className="suggestion-label">推荐上衣</div>
                                <div className="suggestion-image-wrapper">
                                    <img
                                        src={`${API_BASE.replace('/api', '')}${suggestedTop.image_url}`}
                                        alt={suggestedTop.item}
                                        className="suggestion-image"
                                    />
                                </div>
                                <div className="suggestion-info">
                                    <div className="suggestion-name">{suggestedTop.item}</div>
                                    {suggestedTop.description && (
                                        <div className="suggestion-desc">{suggestedTop.description}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 推荐的裤子 */}
                        {suggestedBottom && (
                            <div className="suggestion-card">
                                <div className="suggestion-label">推荐下装</div>
                                <div className="suggestion-image-wrapper">
                                    <img
                                        src={`${API_BASE.replace('/api', '')}${suggestedBottom.image_url}`}
                                        alt={suggestedBottom.item}
                                        className="suggestion-image"
                                    />
                                </div>
                                <div className="suggestion-info">
                                    <div className="suggestion-name">{suggestedBottom.item}</div>
                                    {suggestedBottom.description && (
                                        <div className="suggestion-desc">{suggestedBottom.description}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
