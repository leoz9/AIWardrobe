import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings as SettingsIcon, RefreshCw, Sparkles, CloudSun, Droplets, Wind, Thermometer, ChevronLeft, ChevronRight, Shirt, ArrowRight } from 'lucide-react'
import Settings from '../components/Settings'

const API_BASE = `http://${window.location.hostname}:8000/api`
const DEFAULT_LOCATION = '101020100'

const formatDate = (locale) => {
    const lang = locale?.startsWith('zh')
        ? 'zh-CN'
        : locale?.startsWith('ja')
            ? 'ja-JP'
            : 'en-US'
    return new Date().toLocaleDateString(lang, {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    })
}

export default function Home() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()

    const [weather, setWeather] = useState(null)
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [] })
    const [horoscope, setHoroscope] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)

    const carouselItems = useMemo(() => ([
        ...wardrobe.tops.map(item => ({ ...item, category: 'top' })),
        ...wardrobe.bottoms.map(item => ({ ...item, category: 'bottom' })),
        ...wardrobe.shoes.map(item => ({ ...item, category: 'shoes' }))
    ]), [wardrobe])

    useEffect(() => {
        if (activeIndex < carouselItems.length) return
        setActiveIndex(0)
    }, [carouselItems.length, activeIndex])

    useEffect(() => {
        if (carouselItems.length <= 1) return undefined
        const timer = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % carouselItems.length)
        }, 3500)
        return () => clearInterval(timer)
    }, [carouselItems.length])

    const fetchDashboard = async (withLoading = true) => {
        if (withLoading) {
            setLoading(true)
        } else {
            setRefreshing(true)
        }

        try {
            const [weatherRes, wardrobeRes, horoscopeRes] = await Promise.all([
                fetch(`${API_BASE}/weather?location=${DEFAULT_LOCATION}`),
                fetch(`${API_BASE}/wardrobe`),
                fetch(`${API_BASE}/horoscope/daily?location=${DEFAULT_LOCATION}`)
            ])

            if (weatherRes.ok) {
                setWeather(await weatherRes.json())
            }

            if (wardrobeRes.ok) {
                setWardrobe(await wardrobeRes.json())
            }

            if (horoscopeRes.ok) {
                setHoroscope(await horoscopeRes.json())
            }
        } catch (error) {
            console.error('Failed to fetch home dashboard:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchDashboard(true)
    }, [])

    const getCategoryLabel = (category) => {
        if (category === 'top') return t('home.categoryTop')
        if (category === 'bottom') return t('home.categoryBottom')
        return t('home.categoryShoes')
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-28 relative overflow-hidden">
            <div className="absolute top-[-100px] right-[-80px] w-64 h-64 rounded-full bg-sky-200/50 dark:bg-sky-900/20 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[-100px] w-64 h-64 rounded-full bg-amber-200/40 dark:bg-amber-900/20 blur-3xl pointer-events-none"></div>

            <header className="px-4 pt-6 pb-4 flex items-start justify-between relative z-10">
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{t('home.today')}</p>
                    <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)] leading-tight mt-1">{t('home.title')}</h1>
                    <p className="text-sm text-zinc-500 mt-1">{formatDate(i18n.language)}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-accent transition-colors cursor-pointer"
                        onClick={() => fetchDashboard(false)}
                        title={t('home.refresh')}
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                        className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-accent transition-colors cursor-pointer"
                        onClick={() => setShowSettings(true)}
                        title={t('settings.title')}
                    >
                        <SettingsIcon size={18} />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="px-4 py-12 flex flex-col items-center justify-center relative z-10">
                    <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-700 border-t-accent rounded-full animate-spin"></div>
                    <p className="text-sm text-zinc-500 mt-4">{t('home.loading')}</p>
                </div>
            ) : (
                <main className="px-4 space-y-4 relative z-10">
                    <section className="card p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                                <CloudSun size={18} className="text-accent" />
                                {t('home.weatherTitle')}
                            </h2>
                            <span className="text-[11px] px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                {weather?.icon || '--'}
                            </span>
                        </div>

                        <div className="mt-3 flex items-end justify-between">
                            <div>
                                <div className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {weather ? `${Math.round(weather.temperature)}°` : '--'}
                                </div>
                                <div className="text-sm text-zinc-500 mt-1">
                                    {weather?.location || t('home.unknownLocation')} · {weather?.condition || t('home.unknownWeather')}
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500 space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Thermometer size={13} />
                                    {t('home.weatherFeelsLike')}: {weather ? `${Math.round(weather.feelsLike)}°` : '--'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Droplets size={13} />
                                    {t('home.weatherHumidity')}: {weather ? `${Math.round(weather.humidity)}%` : '--'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Wind size={13} />
                                    {t('home.weatherWind')}: {weather?.windScale || '--'}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                                <Shirt size={18} className="text-accent" />
                                {t('home.carouselTitle')}
                            </h2>
                            <button
                                className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-accent cursor-pointer transition-colors"
                                onClick={() => navigate('/wardrobe')}
                            >
                                {t('home.viewAll')}
                            </button>
                        </div>

                        {carouselItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/40 p-8 text-center">
                                <p className="text-sm text-zinc-500">{t('home.emptyWardrobe')}</p>
                                <button
                                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:opacity-80 cursor-pointer"
                                    onClick={() => navigate('/entry')}
                                >
                                    {t('home.goEntry')}
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="overflow-hidden rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                                    <div
                                        className="flex transition-transform duration-500 ease-out"
                                        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                                    >
                                        {carouselItems.map(item => (
                                            <article key={item.id} className="w-full shrink-0 p-4">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-24 h-24 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 flex items-center justify-center">
                                                        <img
                                                            src={`${API_BASE.replace('/api', '')}${item.image_url}`}
                                                            alt={item.item}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.item}</h3>
                                                        <p className="text-xs text-zinc-500 mt-1">{getCategoryLabel(item.category)}</p>
                                                        {item.description ? (
                                                            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{item.description}</p>
                                                        ) : (
                                                            <p className="text-xs text-zinc-400 mt-2">{t('home.noDescription')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>

                                {carouselItems.length > 1 && (
                                    <>
                                        <button
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-accent transition-colors cursor-pointer"
                                            onClick={() => setActiveIndex(prev => (prev > 0 ? prev - 1 : carouselItems.length - 1))}
                                            aria-label={t('home.previous')}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-accent transition-colors cursor-pointer"
                                            onClick={() => setActiveIndex(prev => (prev < carouselItems.length - 1 ? prev + 1 : 0))}
                                            aria-label={t('home.next')}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </>
                                )}

                                {carouselItems.length > 1 && (
                                    <div className="flex items-center justify-center gap-1.5 mt-3">
                                        {carouselItems.map((_, idx) => (
                                            <button
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === activeIndex ? 'w-5 bg-accent' : 'w-1.5 bg-zinc-300 dark:bg-zinc-600'}`}
                                                onClick={() => setActiveIndex(idx)}
                                                aria-label={`${t('home.slide')} ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="card p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                                <Sparkles size={18} className="text-accent" />
                                {t('home.horoscopeTitle')}
                            </h2>
                            <span className="text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-accent">
                                {horoscope?.zodiac_name || t('home.unknownZodiac')}
                            </span>
                        </div>

                        <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">{horoscope?.summary || t('home.horoscopeFallback')}</p>

                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2.5">
                                <div className="text-[10px] uppercase tracking-wide text-zinc-500">{t('home.mood')}</div>
                                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-1 truncate">{horoscope?.mood || '--'}</div>
                            </div>
                            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2.5">
                                <div className="text-[10px] uppercase tracking-wide text-zinc-500">{t('home.luckyColor')}</div>
                                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-1 truncate">{horoscope?.lucky_color || '--'}</div>
                            </div>
                            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2.5">
                                <div className="text-[10px] uppercase tracking-wide text-zinc-500">{t('home.luckyNumber')}</div>
                                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-1 truncate">{horoscope?.lucky_number || '--'}</div>
                            </div>
                        </div>

                        <div className="mt-3 text-xs text-zinc-500 leading-relaxed">
                            {horoscope?.suggestion || t('home.horoscopeFallback')}
                        </div>

                        {horoscope && !horoscope.is_configured && (
                            <button
                                className="mt-4 w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 cursor-pointer transition-opacity"
                                onClick={() => setShowSettings(true)}
                            >
                                {t('home.setZodiac')}
                            </button>
                        )}
                    </section>
                </main>
            )}

            <Settings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={() => fetchDashboard(false)}
            />
        </div>
    )
}
