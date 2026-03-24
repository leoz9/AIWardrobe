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

    const [cityQuery, setCityQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedCity, setSelectedCity] = useState({
        name: '上海',
        id: '101020100'
    })
    const [showCityPicker, setShowCityPicker] = useState(false)

    const [displayedRecommendation, setDisplayedRecommendation] = useState('')

    useEffect(() => {
        if (!recommendation) {
            setDisplayedRecommendation('')
            return
        }

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
        }, 30)

        return () => clearInterval(timer)
    }, [recommendation])

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

    const refreshRecommendation = () => {
        fetchRecommendation(selectedCity.id)
    }

    const getWeatherIcon = (icon) => {
        const iconMap = {
            '100': '☀️', '101': '☁️', '102': '⛅', '103': '⛅', '104': '☁️',
            '150': '🌙', '300': '🌦️', '301': '⛈️', '302': '⛈️', '303': '⛈️',
            '304': '🌨️', '305': '🌧️', '306': '🌧️', '307': '🌧️', '308': '🌧️',
            '309': '🌦️', '310': '⛈️', '311': '⛈️', '312': '⛈️', '313': '🌨️',
            '314': '🌧️', '315': '🌧️', '316': '🌧️', '317': '⛈️', '318': '⛈️',
            '399': '🌧️', '400': '🌨️', '401': '🌨️', '402': '❄️', '403': '❄️',
            '404': '🌨️', '405': '🌨️', '406': '🌨️', '407': '❄️', '408': '🌨️',
            '409': '❄️', '410': '❄️', '499': '❄️', '500': '🌫️', '501': '🌫️',
            '502': '🌫️', '503': '🌪️', '504': '🌪️', '507': '🌪️', '508': '🌪️',
            '509': '🌫️', '510': '🌫️', '511': '🌫️', '512': '🌫️', '513': '🌫️',
            '514': '🌫️', '515': '🌫️'
        }
        return iconMap[icon] || '🌤️'
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col pt-safe pb-24 relative overflow-hidden">
            {/* Background Blur Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[-10%] w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

            <div className="p-4 z-10 w-full mb-4">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-zinc-200 inline-flex items-center cursor-pointer transition-shadow hover:shadow-md mx-auto relative group" onClick={() => setShowCityPicker(!showCityPicker)}>
                    <MapPin size={16} className="text-accent mr-2" />
                    <span className="text-sm font-medium text-zinc-900 pr-4">{selectedCity.name}</span>
                    <span className="text-[10px] text-zinc-400 font-black tracking-widest leading-none bg-zinc-100 px-1 py-1 rounded shadow-sm">{showCityPicker ? '▲' : '▼'}</span>
                    
                    {showCityPicker && (
                        <div className="absolute top-14 left-0 w-80 bg-white rounded-2xl shadow-xl border border-zinc-200 p-3 z-50 animate-fade-in" onClick={e => e.stopPropagation()}>
                            <div className="relative mb-3">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="搜索城市（支持拼音）"
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-shadow text-zinc-800"
                                    value={cityQuery}
                                    onChange={(e) => {
                                        setCityQuery(e.target.value)
                                        searchCity(e.target.value)
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {searchResults.length > 0 ? (
                                    searchResults.map((city) => (
                                        <div
                                            key={city.id}
                                            className="px-4 py-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors flex flex-col"
                                            onClick={() => selectCity(city)}
                                        >
                                            <span className="text-sm font-semibold text-zinc-900">{city.name}</span>
                                            <span className="text-xs text-zinc-500 mt-0.5">{city.adm1} · {city.country}</span>
                                        </div>
                                    ))
                                ) : cityQuery ? (
                                    <div className="text-center py-6 text-zinc-400 text-sm">未找到匹配的城市</div>
                                ) : (
                                    <div className="text-center py-6 text-zinc-400 text-sm">请输入城市名称进行搜索</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!weather && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center animate-fade-in -mt-8">
                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6 shadow-[0_0_40px_rgba(37,99,235,0.2)]">
                        <Sparkles size={36} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-3 tracking-tight leading-tight">获取专属穿搭<br/>从今天的天气开始</h2>
                    <p className="text-zinc-500 text-sm mb-8 leading-relaxed max-w-[260px] mx-auto">AI 将分析实时气温与衣柜藏品为您打造最适合的 Look。</p>
                    <button
                        className="btn-primary w-full max-w-xs shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 py-3.5 rounded-xl border-none focus:ring-blue-500/50"
                        onClick={() => fetchRecommendation(selectedCity.id)}
                    >
                        <Sparkles size={18} className="animate-pulse" />
                        <span className="font-semibold tracking-wide">生成今日穿搭推荐</span>
                    </button>
                    <div className="mt-6">
                        <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">当前位置: {selectedCity.name}</span>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
                    <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                        <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <Sparkles className="text-accent animate-pulse" size={20} />
                    </div>
                    <span className="text-zinc-500 text-sm font-medium tracking-wider animate-pulse">AI 正在为您配搭...</span>
                </div>
            )}

            {!loading && weather && (
                <div className="flex-1 overflow-y-auto px-4 z-10 space-y-6">
                    <div className="bg-gradient-to-br from-blue-500 to-accent text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-4 -top-8 text-8xl opacity-10 blur-sm mix-blend-overlay group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                            {getWeatherIcon(weather.icon)}
                        </div>
                        <div className="relative z-10 flexitems-start flex-col">
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-5xl font-light tracking-tighter">{Math.round(weather.temperature)}°</span>
                                <div className="flex flex-col pb-1">
                                    <span className="text-lg font-bold">{weather.condition}</span>
                                    <span className="text-xs text-blue-100">体感 {Math.round(weather.feelsLike)}°</span>
                                </div>
                            </div>
                            <div className="flex gap-6 pt-4 border-t border-white/20">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">湿度</span>
                                    <span className="text-sm font-semibold">{weather.humidity}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">风力</span>
                                    <span className="text-sm font-semibold">{weather.windScale}级</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between pl-1">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-accent" />
                                <h3 className="font-serif font-bold text-zinc-900 tracking-tight text-lg">AI 推荐穿搭</h3>
                            </div>
                            <button className="text-zinc-400 hover:text-accent hover:rotate-180 transition-all duration-500 p-2" onClick={refreshRecommendation} title="重新生成">
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
                            <div className="prose prose-sm prose-zinc max-w-none text-zinc-600 leading-relaxed font-serif tracking-wide">
                                <ReactMarkdown>{displayedRecommendation}</ReactMarkdown>
                                {displayedRecommendation.length < recommendation.length && (
                                    <span className="inline-block w-1.5 h-4 ml-1 bg-accent/70 animate-pulse align-middle"></span>
                                )}
                            </div>
                        </div>
                    </div>

                    {(suggestedTop || suggestedBottom) && (
                        <div className="space-y-4 pt-2">
                            <h3 className="font-serif font-bold text-zinc-900 tracking-tight text-lg pl-1">建议组合</h3>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                {suggestedTop && (
                                    <div className="card group bg-white border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="px-3 py-2 border-b border-zinc-100 bg-zinc-50">
                                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">上装</span>
                                        </div>
                                        <div className="aspect-square bg-zinc-100/50 p-4 border-b border-zinc-100 relative overflow-hidden">
                                            <img
                                                src={`${API_BASE.replace('/api', '')}${suggestedTop.image_url}`}
                                                alt={suggestedTop.item}
                                                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <div className="text-sm font-medium text-zinc-900 truncate">{suggestedTop.item}</div>
                                            {suggestedTop.description && (
                                                <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{suggestedTop.description}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {suggestedBottom && (
                                    <div className="card group bg-white border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="px-3 py-2 border-b border-zinc-100 bg-zinc-50">
                                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">下装</span>
                                        </div>
                                        <div className="aspect-square bg-zinc-100/50 p-4 border-b border-zinc-100 relative overflow-hidden">
                                            <img
                                                src={`${API_BASE.replace('/api', '')}${suggestedBottom.image_url}`}
                                                alt={suggestedBottom.item}
                                                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <div className="text-sm font-medium text-zinc-900 truncate">{suggestedBottom.item}</div>
                                            {suggestedBottom.description && (
                                                <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{suggestedBottom.description}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
