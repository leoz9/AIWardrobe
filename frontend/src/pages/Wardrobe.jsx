import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import FilterBar from '../components/FilterBar'
import { Trash2 } from 'lucide-react'

const API_BASE = `http://${window.location.hostname}:8000/api`

export default function Wardrobe() {
    const { t } = useTranslation()
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
        if (!confirm(t('wardrobe.deleteConfirm'))) return

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
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                const matchesText =
                    item.item.toLowerCase().includes(searchLower) ||
                    (item.description && item.description.toLowerCase().includes(searchLower))
                if (!matchesText) return false
            }
            if (filters.seasons.length > 0) {
                const hasSeason = item.season_semantics?.some(s => filters.seasons.includes(s))
                if (!hasSeason) return false
            }
            if (filters.styles.length > 0) {
                const hasStyle = item.style_semantics?.some(s => filters.styles.includes(s))
                if (!hasStyle) return false
            }
            return true
        })
    }

    const sections = [
        { title: t('wardrobe.tops'), items: filterItems(wardrobe.tops) },
        { title: t('wardrobe.bottoms'), items: filterItems(wardrobe.bottoms) },
        { title: t('wardrobe.shoes'), items: filterItems(wardrobe.shoes) }
    ]

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-700 border-t-accent rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500 text-sm">{t('wardrobe.loading')}</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] animate-fade-in pb-8">
            <header className="glass-header px-4 py-4 sticky top-0">
                <FilterBar onSearch={handleSearch} onFilterChange={handleFilterChange} />
            </header>

            <div className="p-4 space-y-8 mt-2">
                {sections.map(section => (
                    <section key={section.title} className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <h3 className="text-xl font-serif font-semibold text-[var(--text-primary)]">{section.title}</h3>
                            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-medium">
                                {section.items.length}
                            </span>
                        </div>

                        {section.items.length === 0 ? (
                            <div className="card p-8 flex flex-col items-center justify-center text-zinc-400 border-dashed bg-zinc-50/50 dark:bg-zinc-800/50">
                                <span className="text-3xl mb-2 opacity-50">📦</span>
                                <p className="text-sm">{t('wardrobe.noMatch')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                                {section.items.map(item => (
                                    <div key={item.id} className="card group overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                                        <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 p-4 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`${API_BASE.replace('/api', '')}${item.image_url}`}
                                                alt={item.item}
                                                loading="lazy"
                                                className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate pr-2">{item.item}</span>
                                            <button
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-md transition-colors"
                                                onClick={() => handleDelete(item.id)}
                                                title={t('wardrobe.delete')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    )
}
