import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, Search, User, Sparkles } from 'lucide-react'

export default function TabBar() {
    const navigate = useNavigate()
    const location = useLocation()

    const tabs = [
        { path: '/', icon: PlusCircle, label: '录入' },
        { path: '/wardrobe', icon: Search, label: '衣柜' },
        { path: '/outfit', icon: User, label: '穿搭' },
        { path: '/recommendation', icon: Sparkles, label: '推荐' }
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-zinc-200 pb-safe z-50">
            <div className="max-w-md mx-auto flex items-center justify-around h-16">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = location.pathname === tab.path
                    return (
                        <button
                            key={tab.path}
                            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${isActive ? 'text-accent' : 'text-zinc-400 hover:text-zinc-600'}`}
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
