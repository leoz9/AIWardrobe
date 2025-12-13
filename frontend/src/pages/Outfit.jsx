import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const API_BASE = `http://${window.location.hostname}:8000/api`

// 左右切换控制的单个穿搭部分
const OutfitPart = ({ items, label, proportion, currentIndex, onPrev, onNext }) => {
    if (!items || items.length === 0) {
        return (
            <div className="outfit-part" style={{ flex: proportion }}>
                <div className="outfit-label">{label}</div>
                <div className="outfit-content empty">
                    <div className="empty-icon">📦</div>
                    <div className="empty-text">暂无{label}</div>
                </div>
            </div>
        )
    }

    const currentItem = items[currentIndex] || items[0]

    return (
        <div className="outfit-part" style={{ flex: proportion }}>
            <div className="outfit-label">
                {label}
                <span className="outfit-counter">{currentIndex + 1} / {items.length}</span>
            </div>
            <div className="outfit-content">
                <img
                    src={`${API_BASE.replace('/api', '')}${currentItem.image_url}`}
                    alt={currentItem.item}
                    className="outfit-image"
                />
                {items.length > 1 && (
                    <>
                        <button className="outfit-nav prev" onClick={onPrev}>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="outfit-nav next" onClick={onNext}>
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}
                <div className="outfit-info">
                    <div className="outfit-item-name">{currentItem.item}</div>
                    {currentItem.description && (
                        <div className="outfit-desc">{currentItem.description}</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function Outfit() {
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [] })
    const [loading, setLoading] = useState(true)
    const [filterSeason, setFilterSeason] = useState('all')

    // 当前选中的索引
    const [currentIndices, setCurrentIndices] = useState({
        tops: 0,
        bottoms: 0,
        shoes: 0
    })

    useEffect(() => {
        fetchWardrobe()
    }, [])

    const fetchWardrobe = async () => {
        try {
            const response = await fetch(`${API_BASE}/wardrobe`)
            if (response.ok) {
                setWardrobe(await response.json())
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

    // 切换函数
    const handlePrev = (category) => {
        setCurrentIndices(prev => {
            const items = category === 'tops' ? tops : category === 'bottoms' ? bottoms : shoes
            const newIndex = prev[category] > 0 ? prev[category] - 1 : items.length - 1
            return { ...prev, [category]: newIndex }
        })
    }

    const handleNext = (category) => {
        setCurrentIndices(prev => {
            const items = category === 'tops' ? tops : category === 'bottoms' ? bottoms : shoes
            const newIndex = prev[category] < items.length - 1 ? prev[category] + 1 : 0
            return { ...prev, [category]: newIndex }
        })
    }

    // 随机换一套
    const shuffleOutfit = () => {
        setCurrentIndices({
            tops: tops.length > 0 ? Math.floor(Math.random() * tops.length) : 0,
            bottoms: bottoms.length > 0 ? Math.floor(Math.random() * bottoms.length) : 0,
            shoes: shoes.length > 0 ? Math.floor(Math.random() * shoes.length) : 0
        })
    }

    return (
        <div className="page-container outfit-page">
            <header className="outfit-header">
                <div className="outfit-title-row">
                    <h2>今日穿搭</h2>
                    <button className="shuffle-btn" onClick={shuffleOutfit} title="随机换一套">
                        🎲
                    </button>
                </div>
                <div className="season-chips">
                    {['all', '春', '夏', '秋', '冬'].map(s => (
                        <button
                            key={s}
                            className={`chip ${filterSeason === s ? 'active' : ''}`}
                            onClick={() => setFilterSeason(s)}
                        >
                            {s === 'all' ? '全部' : s}
                        </button>
                    ))}
                </div>
            </header>

            <div className="outfit-display">
                {/* 上衣 - 40% */}
                <OutfitPart
                    items={tops}
                    label="上衣"
                    proportion={4}
                    currentIndex={currentIndices.tops}
                    onPrev={() => handlePrev('tops')}
                    onNext={() => handleNext('tops')}
                />

                {/* 裤子 - 35% */}
                <OutfitPart
                    items={bottoms}
                    label="下装"
                    proportion={3.5}
                    currentIndex={currentIndices.bottoms}
                    onPrev={() => handlePrev('bottoms')}
                    onNext={() => handleNext('bottoms')}
                />

                {/* 鞋子 - 25% */}
                <OutfitPart
                    items={shoes}
                    label="鞋子"
                    proportion={2.5}
                    currentIndex={currentIndices.shoes}
                    onPrev={() => handlePrev('shoes')}
                    onNext={() => handleNext('shoes')}
                />
            </div>
        </div>
    )
}
