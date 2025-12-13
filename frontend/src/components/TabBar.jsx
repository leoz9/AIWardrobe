import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, Search, User, Sparkles } from 'lucide-react'
import './TabBar.css'

export default function TabBar() {
    const navigate = useNavigate()
    const location = useLocation()

    const tabs = [
        { path: '/', icon: PlusCircle, label: '录入' },
        { path: '/wardrobe', icon: Search, label: '衣柜' },
        { path: '/outfit', icon: User, label: '穿搭' },
        { path: '/recommendation', icon: Sparkles, label: 'AI推荐' }
    ]

    return (
        <nav className="tab-bar">
            {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = location.pathname === tab.path
                return (
                    <button
                        key={tab.path}
                        className={`tab-item ${isActive ? 'active' : ''}`}
                        onClick={() => navigate(tab.path)}
                    >
                        <Icon size={24} />
                        <span className="tab-label">{tab.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}
