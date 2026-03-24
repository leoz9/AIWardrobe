import { useState } from 'react'
import { Search } from 'lucide-react'

const SEASONS = ['春', '夏', '秋', '冬']
const STYLES = ['休闲', '正式', '运动', '商务', '复古', '简约', '日常', '通勤']

export default function FilterBar({ onSearch, onFilterChange }) {
    const [selectedSeasons, setSelectedSeasons] = useState([])
    const [selectedStyles, setSelectedStyles] = useState([])

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
        <div className="bg-white/90 backdrop-blur top-0 py-3 space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                    type="text"
                    placeholder="搜索名称、描述..."
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-100/80 border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap uppercase tracking-wider">季节</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {SEASONS.map(season => (
                            <button
                                key={season}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${selectedSeasons.includes(season) ? 'bg-zinc-900 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                onClick={() => toggleSeason(season)}
                            >
                                {season}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap uppercase tracking-wider">风格</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {STYLES.map(style => (
                            <button
                                key={style}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${selectedStyles.includes(style) ? 'bg-zinc-900 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                onClick={() => toggleStyle(style)}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
