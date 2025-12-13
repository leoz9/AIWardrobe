import { useState, useEffect } from 'react'
import FilterBar from '../components/FilterBar'
import { Trash2 } from 'lucide-react'

const API_BASE = `http://${window.location.hostname}:8000/api`

export default function Wardrobe() {
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [] })
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        search: '',
        seasons: [],
        styles: []
    })

    useEffect(() => {
        fetchWardrobe()
    }, [])

    const fetchWardrobe = async () => {
        try {
            const response = await fetch(`${API_BASE}/wardrobe`)
            if (response.ok) {
                const data = await response.json()
                setWardrobe(data)
            }
        } catch (error) {
            console.error('Failed to fetch wardrobe:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('确定要删除这件衣物吗？')) return

        try {
            const response = await fetch(`${API_BASE}/clothes/${id}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                fetchWardrobe()
            }
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const handleSearch = (text) => setFilters(prev => ({ ...prev, search: text }))
    const handleFilterChange = ({ seasons, styles }) => setFilters(prev => ({ ...prev, seasons, styles }))

    const filterItems = (items) => {
        return items.filter(item => {
            // Search
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                const matchesText =
                    item.item.toLowerCase().includes(searchLower) ||
                    (item.description && item.description.toLowerCase().includes(searchLower))
                if (!matchesText) return false
            }
            // Seasons
            if (filters.seasons.length > 0) {
                const hasSeason = item.season_semantics?.some(s => filters.seasons.includes(s))
                if (!hasSeason) return false
            }
            // Styles
            if (filters.styles.length > 0) {
                const hasStyle = item.style_semantics?.some(s => filters.styles.includes(s))
                if (!hasStyle) return false
            }
            return true
        })
    }

    const sections = [
        { title: '上装', items: filterItems(wardrobe.tops) },
        { title: '下装', items: filterItems(wardrobe.bottoms) },
        { title: '鞋履', items: filterItems(wardrobe.shoes) }
    ]

    if (loading) return <div className="loading">加载中...</div>

    return (
        <div className="page-container wardrobe-page">
            <header className="page-header sticky">
                <FilterBar onSearch={handleSearch} onFilterChange={handleFilterChange} />
            </header>

            <div className="wardrobe-content">
                {sections.map(section => (
                    <section key={section.title} className="wardrobe-section">
                        <h3 className="section-title">{section.title} ({section.items.length})</h3>
                        <div className="clothes-grid">
                            {section.items.map(item => (
                                <div key={item.id} className="clothes-card">
                                    <div className="card-image">
                                        <img
                                            src={`${API_BASE.replace('/api', '')}${item.image_url}`}
                                            alt={item.item}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="card-info">
                                        <span className="card-name">{item.item}</span>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
