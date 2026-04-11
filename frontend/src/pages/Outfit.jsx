import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'

import { API_BASE, toImageUrl } from '../utils/api'

const CATEGORIES = [
    { key: 'tops', labelKey: 'outfit.top' },
    { key: 'bottoms', labelKey: 'outfit.bottom' },
    { key: 'shoes', labelKey: 'outfit.shoes' }
]

export default function Outfit() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [], accessories: [] })
    const [loading, setLoading] = useState(true)
    const [filterSeason, setFilterSeason] = useState('all')

    const [currentIndices, setCurrentIndices] = useState({
        tops: 0,
        bottoms: 0,
        shoes: 0
    })

    useEffect(() => {
        const controller = new AbortController()
        void fetchWardrobe(controller.signal)
        return () => controller.abort()
    }, [])

    const fetchWardrobe = async (signal) => {
        try {
            const response = await fetch(`${API_BASE}/wardrobe`, { signal })
            if (response.ok) {
                const data = await response.json()
                setWardrobe({
                    tops: data.tops || [],
                    bottoms: data.bottoms || [],
                    shoes: data.shoes || [],
                    accessories: data.accessories || []
                })
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error(error)
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }

    const seasonKeywordMap = {
        '春': ['春', 'spring'],
        '夏': ['夏', 'summer'],
        '秋': ['秋', 'autumn', 'fall'],
        '冬': ['冬', 'winter']
    }

    const filterBySeason = (items, category) => {
        if (filterSeason === 'all') return items

        const matched = items.filter(item => {
            const seasons = Array.isArray(item.season_semantics) ? item.season_semantics : []
            if (seasons.length === 0) {
                return category === 'shoes'
            }

            const keywords = seasonKeywordMap[filterSeason] || [filterSeason]
            return seasons.some(season => {
                const normalized = String(season || '').toLowerCase()
                return keywords.some(keyword => normalized.includes(keyword.toLowerCase()))
            })
        })

        if (category === 'shoes' && matched.length === 0 && items.length > 0) {
            return items
        }
        return matched
    }

    const tops = filterBySeason(wardrobe.tops, 'tops')
    const bottoms = filterBySeason(wardrobe.bottoms, 'bottoms')
    const shoes = filterBySeason(wardrobe.shoes, 'shoes')

    useEffect(() => {
        setCurrentIndices(prev => ({
            tops: tops.length > 0 ? Math.min(prev.tops, tops.length - 1) : 0,
            bottoms: bottoms.length > 0 ? Math.min(prev.bottoms, bottoms.length - 1) : 0,
            shoes: shoes.length > 0 ? Math.min(prev.shoes, shoes.length - 1) : 0
        }))
    }, [tops.length, bottoms.length, shoes.length])

    const getItemsByCategory = (category) => {
        if (category === 'tops') return tops
        if (category === 'bottoms') return bottoms
        return shoes
    }

    const getCurrentItem = (category) => {
        const items = getItemsByCategory(category)
        if (!items.length) return null
        return items[currentIndices[category]] || items[0]
    }

    const shiftCategory = (category, direction) => {
        const items = getItemsByCategory(category)
        if (items.length <= 1) return

        setCurrentIndices(prev => {
            const currentIndex = prev[category]
            const nextIndex = direction === 'prev'
                ? (currentIndex > 0 ? currentIndex - 1 : items.length - 1)
                : (currentIndex < items.length - 1 ? currentIndex + 1 : 0)
            return { ...prev, [category]: nextIndex }
        })
    }

    const shuffleOutfit = () => {
        setCurrentIndices({
            tops: tops.length > 0 ? Math.floor(Math.random() * tops.length) : 0,
            bottoms: bottoms.length > 0 ? Math.floor(Math.random() * bottoms.length) : 0,
            shoes: shoes.length > 0 ? Math.floor(Math.random() * shoes.length) : 0
        })
    }

    const seasonFilters = [
        { key: 'all', label: t('outfit.allSeasons') },
        { key: '春', label: t('filter.spring') },
        { key: '夏', label: t('filter.summer') },
        { key: '秋', label: t('filter.autumn') },
        { key: '冬', label: t('filter.winter') }
    ]

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-700 border-t-accent rounded-full animate-spin"></div>
        </div>
    )

    const topItem = getCurrentItem('tops')
    const bottomItem = getCurrentItem('bottoms')
    const shoesItem = getCurrentItem('shoes')

    return (
        <div className="bg-[var(--bg-primary)] px-3 sm:px-4 lg:px-0 pt-3 pb-2 flex flex-col max-w-6xl mx-auto w-full">
            <header className="shrink-0 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[22px] font-serif font-bold tracking-tight text-[var(--text-primary)]">{t('outfit.title')}</h2>
                    <button
                        className="btn-icon bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-accent hover:text-accent rounded-lg shadow-sm"
                        onClick={shuffleOutfit}
                        title={t('outfit.shuffle')}
                    >
                        <Shuffle size={18} className="group-active:-rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                    {seasonFilters.map(s => (
                        <button
                            key={s.key}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                                filterSeason === s.key
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'
                                    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            onClick={() => setFilterSeason(s.key)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid gap-3 lg:grid-cols-12">
                <section className="card lg:col-span-7 overflow-hidden">
                    <div className="p-3 sm:p-4 bg-zinc-50/40 dark:bg-zinc-900/30">
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden p-2 sm:p-3">
                            <div className="h-[44vh] min-h-[340px] max-h-[560px] grid grid-rows-[44%_34%_22%] gap-2">
                                <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-2 flex items-center justify-center">
                                    {topItem ? (
                                        <img src={toImageUrl(topItem.image_url)} alt={topItem.item} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-zinc-400">{t('outfit.noItems', { label: t('outfit.top') })}</span>
                                    )}
                                </div>
                                <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-2 flex items-center justify-center">
                                    {bottomItem ? (
                                        <img src={toImageUrl(bottomItem.image_url)} alt={bottomItem.item} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-zinc-400">{t('outfit.noItems', { label: t('outfit.bottom') })}</span>
                                    )}
                                </div>
                                <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-2 flex items-center justify-center">
                                    {shoesItem ? (
                                        <img src={toImageUrl(shoesItem.image_url)} alt={shoesItem.item} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-zinc-400">{t('outfit.noItems', { label: t('outfit.shoes') })}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className="lg:col-span-5 grid grid-cols-1 gap-3">
                    {CATEGORIES.map((category) => {
                        const items = getItemsByCategory(category.key)
                        const item = getCurrentItem(category.key)
                        const currentIndex = currentIndices[category.key] || 0
                        return (
                            <article key={category.key} className="card p-3">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-xs text-zinc-500 uppercase tracking-wide">{t(category.labelKey)}</div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            className="btn-icon border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-40"
                                            onClick={() => shiftCategory(category.key, 'prev')}
                                            disabled={items.length <= 1}
                                            type="button"
                                        >
                                            <ChevronLeft size={15} />
                                        </button>
                                        <span className="text-xs text-zinc-500 min-w-[3rem] text-center">
                                            {items.length ? `${currentIndex + 1}/${items.length}` : '--'}
                                        </span>
                                        <button
                                            className="btn-icon border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-40"
                                            onClick={() => shiftCategory(category.key, 'next')}
                                            disabled={items.length <= 1}
                                            type="button"
                                        >
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 h-40 lg:h-44 p-2.5 flex items-center justify-center hover:opacity-90 transition-opacity"
                                    onClick={() => item && navigate(`/clothes/${item.id}`)}
                                    type="button"
                                    disabled={!item}
                                >
                                    {item ? (
                                        <img
                                            src={toImageUrl(item.image_url)}
                                            alt={item.item}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs text-zinc-400 text-center">{t('outfit.noItems', { label: t(category.labelKey) })}</span>
                                    )}
                                </button>
                            </article>
                        )
                    })}
                </aside>
            </div>
        </div>
    )
}
