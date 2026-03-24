import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, Search, User, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function TabBar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslation()

    const tabs = [
        { path: '/', icon: PlusCircle, label: t('tabs.entry') },
        { path: '/wardrobe', icon: Search, label: t('tabs.wardrobe') },
        { path: '/outfit', icon: User, label: t('tabs.outfit') },
        { path: '/recommendation', icon: Sparkles, label: t('tabs.recommendation') }
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-safe z-50">
            <div className="max-w-md mx-auto flex items-center justify-around h-16">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = location.pathname === tab.path
                    return (
                        <button
                            key={tab.path}
                            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${isActive ? 'text-accent' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                            onClick={() => navigate(tab.path)}
                        >
                            <Icon size={24} className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.5px]' : ''}`} />
                            <span className={`text-[10px] font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-80'}`}>{tab.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
