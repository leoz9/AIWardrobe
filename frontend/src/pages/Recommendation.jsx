import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, Sparkles, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const API_BASE = `http://${window.location.hostname}:8000/api`

export default function Recommendation() {
    const { t } = useTranslation()
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
    const [searchingCities, setSearchingCities] = useState(false)
    const cityPickerRef = useRef(null)
    const cityInputRef = useRef(null)

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

    useEffect(() => {
        if (!showCityPicker) {
            return
        }

        const trimmedQuery = cityQuery.trim()
        if (!trimmedQuery) {
            setSearchResults([])
            setSearchingCities(false)
            return
        }

        const timer = setTimeout(async () => {
            setSearchingCities(true)
            try {
                const response = await fetch(`${API_BASE}/cities?query=${encodeURIComponent(trimmedQuery)}&limit=10`)
                if (response.ok) {
                    const cities = await response.json()
                    setSearchResults(cities)
                } else {
                    setSearchResults([])
                }
            } catch (error) {
                console.error('City search failed:', error)
                setSearchResults([])
            } finally {
                setSearchingCities(false)
            }
        }, 250)

        return () => clearTimeout(timer)
    }, [cityQuery, showCityPicker])

    useEffect(() => {
        if (!showCityPicker) {
            return
        }

        // 使用 requestAnimationFrame，确保下拉渲染后再聚焦输入框
        const rafId = requestAnimationFrame(() => {
            cityInputRef.current?.focus()
        })

        return () => cancelAnimationFrame(rafId)
    }, [showCityPicker])

    useEffect(() => {
        const handleOutsidePointerDown = (event) => {
            if (!showCityPicker) {
                return
            }
            if (cityPickerRef.current && !cityPickerRef.current.contains(event.target)) {
                setShowCityPicker(false)
            }
        }

        document.addEventListener('mousedown', handleOutsidePointerDown)

        return () => {
            document.removeEventListener('mousedown', handleOutsidePointerDown)
        }
    }, [showCityPicker])

    const formatCityName = (city) => {
        const segments = [city.name]

        if (city.adm2 && city.adm2 !== city.name) {
            segments.push(city.adm2)
        }
        if (city.adm1 && city.adm1 !== city.adm2 && city.adm1 !== city.name) {
            segments.push(city.adm1)
        }

        return segments.join(' · ')
    }

    const selectCity = (city) => {
        const cityName = formatCityName(city)
        setSelectedCity({
            name: cityName,
            id: city.id
        })
        setShowCityPicker(false)
        setCityQuery('')
        setSearchResults([])
        fetchRecommendation(city.id, cityName)
    }

    const fetchRecommendation = async (location, preferredName = null) => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE}/recommendation?location=${encodeURIComponent(location)}`)
            if (response.ok) {
                const data = await response.json()
                setWeather(data.weather)
                setRecommendation(data.recommendation_text)
                setSuggestedTop(data.suggested_top)
                setSuggestedBottom(data.suggested_bottom)
                if (preferredName) {
                    setSelectedCity({
                        name: preferredName,
                        id: location
                    })
                } else if (data.weather?.location) {
                    setSelectedCity({
                        name: data.weather.location,
                        id: location
                    })
                }
            }
        } catch (error) {
            console.error('Failed to fetch recommendation:', error)
        } finally {
            setLoading(false)
        }
    }

    const submitCityQuery = () => {
        const trimmedQuery = cityQuery.trim()
        if (!trimmedQuery) {
            fetchRecommendation(selectedCity.id)
            return
        }

        const firstResult = searchResults[0]
        if (firstResult) {
            selectCity(firstResult)
            return
        }

        setSelectedCity({
            name: trimmedQuery,
            id: trimmedQuery
        })
        setShowCityPicker(false)
        setSearchResults([])
        fetchRecommendation(trimmedQuery)
    }

    const refreshRecommendation = () => {
        fetchRecommendation(selectedCity.id, selectedCity.name)
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
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col pt-safe pb-24 relative overflow-hidden">
            {/* Background Blur Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-100 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[-10%] w-72 h-72 bg-purple-100 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 pointer-events-none"></div>

            <div className="p-4 z-10 w-full mb-4">
                <div className="relative mx-auto w-fit" ref={cityPickerRef}>
                    <button
                        type="button"
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 inline-flex items-center transition-shadow hover:shadow-md"
                        onClick={() => setShowCityPicker((open) => !open)}
                        aria-expanded={showCityPicker}
                    >
                        <MapPin size={16} className="text-accent mr-2" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 pr-4">{selectedCity.name}</span>
                        <span className="text-[10px] text-zinc-400 font-black tracking-widest leading-none bg-zinc-100 dark:bg-zinc-800 px-1 py-1 rounded shadow-sm">{showCityPicker ? '▲' : '▼'}</span>
                    </button>

                    {showCityPicker && (
                        <div
                            className="absolute top-14 left-0 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-3 z-50 animate-fade-in"
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative mb-3">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    ref={cityInputRef}
                                    type="text"
                                    placeholder={t('recommendation.searchCity')}
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-shadow text-zinc-800 dark:text-zinc-200"
                                    value={cityQuery}
                                    onChange={(e) => setCityQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            submitCityQuery()
                                        }
                                    }}
                                />
                            </div>

                            <button
                                type="button"
                                className="w-full mb-3 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-95 transition-opacity"
                                onClick={submitCityQuery}
                            >
                                {t('recommendation.searchAction')}
                            </button>

                            <div className="text-xs text-zinc-400 mb-3 px-1">
                                {t('recommendation.searchHint')}
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {searchResults.length > 0 ? (
                                    searchResults.map((city, index) => (
                                        <button
                                            type="button"
                                            key={`${city.id}-${city.adm1}-${city.adm2}-${index}`}
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors flex flex-col"
                                            onClick={() => selectCity(city)}
                                        >
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatCityName(city)}</span>
                                            <span className="text-xs text-zinc-500 mt-0.5">{city.country}</span>
                                        </button>
                                    ))
                                ) : searchingCities ? (
                                    <div className="text-center py-6 text-zinc-400 text-sm">{t('recommendation.searching')}</div>
                                ) : cityQuery ? (
                                    <div className="text-center py-6 text-zinc-400 text-sm">{t('recommendation.noCity')}</div>
                                ) : (
                                    <div className="text-center py-6 text-zinc-400 text-sm">{t('recommendation.enterCity')}</div>
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
                    <h2 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight leading-tight">{t('recommendation.getTitle')}<br/>{t('recommendation.getSubtitle')}</h2>
                    <p className="text-zinc-500 text-sm mb-8 leading-relaxed max-w-[260px] mx-auto">{t('recommendation.description')}</p>
                    <button
                        className="btn-primary w-full max-w-xs shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 py-3.5 rounded-xl border-none focus:ring-blue-500/50"
                        onClick={() => fetchRecommendation(selectedCity.id)}
                    >
                        <Sparkles size={18} className="animate-pulse" />
                        <span className="font-semibold tracking-wide">{t('recommendation.generate')}</span>
                    </button>
                    <div className="mt-6">
                        <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">{t('recommendation.currentLocation')}: {selectedCity.name}</span>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
                    <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                        <div className="absolute inset-0 border-4 border-zinc-100 dark:border-zinc-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <Sparkles className="text-accent animate-pulse" size={20} />
                    </div>
                    <span className="text-zinc-500 text-sm font-medium tracking-wider animate-pulse">{t('recommendation.aiLoading')}</span>
                </div>
            )}

            {!loading && weather && (
                <div className="flex-1 overflow-y-auto px-4 z-10 space-y-6">
                    <div className="bg-gradient-to-br from-blue-500 to-accent text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-4 -top-8 text-8xl opacity-10 blur-sm mix-blend-overlay group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                            {getWeatherIcon(weather.icon)}
                        </div>
                        <div className="relative z-10 flex items-start flex-col">
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-5xl font-light tracking-tighter">{Math.round(weather.temperature)}°</span>
                                <div className="flex flex-col pb-1">
                                    <span className="text-lg font-bold">{weather.condition}</span>
                                    <span className="text-xs text-blue-100">{t('recommendation.feelsLike')} {Math.round(weather.feelsLike)}°</span>
                                </div>
                            </div>
                            <div className="flex gap-6 pt-4 border-t border-white/20">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">{t('recommendation.humidity')}</span>
                                    <span className="text-sm font-semibold">{weather.humidity}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">{t('recommendation.wind')}</span>
                                    <span className="text-sm font-semibold">{weather.windScale}{t('recommendation.windLevel')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between pl-1">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-accent" />
                                <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-lg">{t('recommendation.aiTitle')}</h3>
                            </div>
                            <button className="text-zinc-400 hover:text-accent hover:rotate-180 transition-all duration-500 p-2" onClick={refreshRecommendation} title={t('recommendation.regenerate')}>
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed font-serif tracking-wide">
                                <ReactMarkdown>{displayedRecommendation}</ReactMarkdown>
                                {displayedRecommendation.length < recommendation.length && (
                                    <span className="inline-block w-1.5 h-4 ml-1 bg-accent/70 animate-pulse align-middle"></span>
                                )}
                            </div>
                        </div>
                    </div>

                    {(suggestedTop || suggestedBottom) && (
                        <div className="space-y-4 pt-2">
                            <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-lg pl-1">{t('recommendation.suggestedCombo')}</h3>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                {suggestedTop && (
                                    <div className="card group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('recommendation.topWear')}</span>
                                        </div>
                                        <div className="aspect-square bg-zinc-100/50 dark:bg-zinc-800/50 p-4 border-b border-zinc-100 dark:border-zinc-800 relative overflow-hidden">
                                            <img
                                                src={`${API_BASE.replace('/api', '')}${suggestedTop.image_url}`}
                                                alt={suggestedTop.item}
                                                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{suggestedTop.item}</div>
                                            {suggestedTop.description && (
                                                <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{suggestedTop.description}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {suggestedBottom && (
                                    <div className="card group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('recommendation.bottomWear')}</span>
                                        </div>
                                        <div className="aspect-square bg-zinc-100/50 dark:bg-zinc-800/50 p-4 border-b border-zinc-100 dark:border-zinc-800 relative overflow-hidden">
                                            <img
                                                src={`${API_BASE.replace('/api', '')}${suggestedBottom.image_url}`}
                                                alt={suggestedBottom.item}
                                                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{suggestedBottom.item}</div>
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
