import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'

const API_BASE = `http://${window.location.hostname}:8000/api`

const OutfitPart = ({ items, label, proportion, currentIndex, onPrev, onNext, emptyText }) => {
    if (!items || items.length === 0) {
        return (
            <div className={`flex-[${proportion}] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm`}>
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-800/50">
                    <span className="text-3xl mb-2 opacity-30">📦</span>
                    <span className="text-sm text-zinc-400">{emptyText}</span>
                </div>
            </div>
        )
    }

    const currentItem = items[currentIndex] || items[0]

    return (
        <div className={`flex-[${proportion}] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group`}>
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
                <span className="text-xs bg-white dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-600 shadow-sm">
                    {currentIndex + 1} / {items.length}
                </span>
            </div>

            <div className="relative flex-1 flex items-center justify-center p-4 bg-zinc-100/50 dark:bg-zinc-800/50 min-h-[140px] overflow-hidden">
                <img
                    src={`${API_BASE.replace('/api', '')}${currentItem.image_url}`}
                    alt={currentItem.item}
                    className="w-[85%] h-[85%] object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                />

                {items.length > 1 && (
                    <>
                        <button
                            className="absolute left-2 w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-accent hover:bg-white dark:hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 z-10"
                            onClick={onPrev}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            className="absolute right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-accent hover:bg-white dark:hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 z-10"
                            onClick={onNext}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 dark:from-zinc-900/95 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{currentItem.item}</h4>
                    {currentItem.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{currentItem.description}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function Outfit() {
    const { t } = useTranslation()
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [], accessories: [] })
    const [loading, setLoading] = useState(true)
    const [filterSeason, setFilterSeason] = useState('all')

    const [currentIndices, setCurrentIndices] = useState({
        tops: 0,
        bottoms: 0,
        shoes: 0,
        accessories: 0
    })

    useEffect(() => {
        fetchWardrobe()
    }, [])

    const fetchWardrobe = async () => {
        try {
            const response = await fetch(`${API_BASE}/wardrobe`)
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
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filter = (items) => {
        if (filterSeason === 'all') return items
        return items.filter(item => item.season_semantics?.some(s => s.includes(filterSeason)))
    }

    const tops = filter(wardrobe.tops)
    const bottoms = filter(wardrobe.bottoms)
    const shoes = filter(wardrobe.shoes)
    const accessories = filter(wardrobe.accessories)

    const handlePrev = (category) => {
        setCurrentIndices(prev => {
            const items = category === 'tops'
                ? tops
                : category === 'bottoms'
                    ? bottoms
                    : category === 'shoes'
                        ? shoes
                        : accessories
            const newIndex = prev[category] > 0 ? prev[category] - 1 : items.length - 1
            return { ...prev, [category]: newIndex }
        })
    }

    const handleNext = (category) => {
        setCurrentIndices(prev => {
            const items = category === 'tops'
                ? tops
                : category === 'bottoms'
                    ? bottoms
                    : category === 'shoes'
                        ? shoes
                        : accessories
            const newIndex = prev[category] < items.length - 1 ? prev[category] + 1 : 0
            return { ...prev, [category]: newIndex }
        })
    }

    const shuffleOutfit = () => {
        setCurrentIndices({
            tops: tops.length > 0 ? Math.floor(Math.random() * tops.length) : 0,
            bottoms: bottoms.length > 0 ? Math.floor(Math.random() * bottoms.length) : 0,
            shoes: shoes.length > 0 ? Math.floor(Math.random() * shoes.length) : 0,
            accessories: accessories.length > 0 ? Math.floor(Math.random() * accessories.length) : 0
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

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4 flex flex-col h-screen overflow-hidden pb-24">
            <header className="shrink-0 mb-4 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-serif font-bold tracking-tight text-[var(--text-primary)]">{t('outfit.title')}</h2>
                    <button
                        className="p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-accent hover:text-accent rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 group"
                        onClick={shuffleOutfit}
                        title={t('outfit.shuffle')}
                    >
                        <Shuffle size={20} className="group-active:-rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {seasonFilters.map(s => (
                        <button
                            key={s.key}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
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

            <div className="flex-1 flex flex-col gap-3 pb-8">
                <OutfitPart
                    items={tops}
                    label={t('outfit.top')}
                    proportion={4}
                    currentIndex={currentIndices.tops}
                    onPrev={() => handlePrev('tops')}
                    onNext={() => handleNext('tops')}
                    emptyText={t('outfit.noItems', { label: t('outfit.top') })}
                />
                <OutfitPart
                    items={bottoms}
                    label={t('outfit.bottom')}
                    proportion={3}
                    currentIndex={currentIndices.bottoms}
                    onPrev={() => handlePrev('bottoms')}
                    onNext={() => handleNext('bottoms')}
                    emptyText={t('outfit.noItems', { label: t('outfit.bottom') })}
                />
                <OutfitPart
                    items={shoes}
                    label={t('outfit.shoes')}
                    proportion={2}
                    currentIndex={currentIndices.shoes}
                    onPrev={() => handlePrev('shoes')}
                    onNext={() => handleNext('shoes')}
                    emptyText={t('outfit.noItems', { label: t('outfit.shoes') })}
                />
                <OutfitPart
                    items={accessories}
                    label={t('outfit.accessory')}
                    proportion={1}
                    currentIndex={currentIndices.accessories}
                    onPrev={() => handlePrev('accessories')}
                    onNext={() => handleNext('accessories')}
                    emptyText={t('outfit.noItems', { label: t('outfit.accessory') })}
                />
            </div>
        </div>
    )
}
