import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Entry from './pages/Entry'
import Wardrobe from './pages/Wardrobe'
import Outfit from './pages/Outfit'
import Recommendation from './pages/Recommendation'
import TabBar from './components/TabBar'
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-24 max-w-md mx-auto relative shadow-sm">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/entry" element={<Entry />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/outfit" element={<Outfit />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <TabBar />
      </div>
    </Router>
  )
}

export default App
