import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function FilterBar({ onSearch, onFilterChange }) {
    const { t } = useTranslation()
    const [selectedSeasons, setSelectedSeasons] = useState([])
    const [selectedStyles, setSelectedStyles] = useState([])

    const SEASONS = [
        { key: 'spring', label: t('filter.spring') },
        { key: 'summer', label: t('filter.summer') },
        { key: 'autumn', label: t('filter.autumn') },
        { key: 'winter', label: t('filter.winter') }
    ]

    const STYLES = [
        { key: 'casual', label: t('filter.casual') },
        { key: 'formal', label: t('filter.formal') },
        { key: 'sport', label: t('filter.sport') },
        { key: 'business', label: t('filter.business') },
        { key: 'vintage', label: t('filter.vintage') },
        { key: 'minimal', label: t('filter.minimal') },
        { key: 'daily', label: t('filter.daily') },
        { key: 'commute', label: t('filter.commute') }
    ]

    const toggleSeason = (season) => {
        const newSeasons = selectedSeasons.includes(season)
            ? selectedSeasons.filter(s => s !== season)
            : [...selectedSeasons, season]

        setSelectedSeasons(newSeasons)
        onFilterChange({ seasons: newSeasons, styles: selectedStyles })
    }

    const toggleStyle = (style) => {
        const newStyles = selectedStyles.includes(style)
            ? selectedStyles.filter(s => s !== style)
            : [...selectedStyles, style]

        setSelectedStyles(newStyles)
        onFilterChange({ seasons: selectedSeasons, styles: newStyles })
    }

    return (
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur top-0 py-3 space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                    type="text"
                    placeholder={t('wardrobe.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-100/80 dark:bg-zinc-800/80 border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white dark:focus:bg-zinc-800 transition-all text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap uppercase tracking-wider">{t('filter.season')}</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {SEASONS.map(season => (
                            <button
                                key={season.key}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${selectedSeasons.includes(season.label) ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                onClick={() => toggleSeason(season.label)}
                            >
                                {season.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap uppercase tracking-wider">{t('filter.style')}</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {STYLES.map(style => (
                            <button
                                key={style.key}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${selectedStyles.includes(style.label) ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                onClick={() => toggleStyle(style.label)}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
