import { useState } from 'react'

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
        <div className="filter-section">
            <div className="search-wrapper">
                <input
                    type="text"
                    placeholder="🔍 搜索名称、描述..."
                    className="search-input"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <div className="filter-groups">
                <div className="filter-group">
                    <span className="filter-label">季节</span>
                    <div className="filter-chips">
                        {SEASONS.map(season => (
                            <button
                                key={season}
                                className={`filter-chip ${selectedSeasons.includes(season) ? 'active' : ''}`}
                                onClick={() => toggleSeason(season)}
                            >
                                {season}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-group">
                    <span className="filter-label">风格</span>
                    <div className="filter-chips">
                        {STYLES.map(style => (
                            <button
                                key={style}
                                className={`filter-chip ${selectedStyles.includes(style) ? 'active' : ''}`}
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
