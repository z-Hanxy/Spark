import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FolderDetail from './pages/FolderDetail.jsx'
import CardDetail from './pages/CardDetail.jsx'
import LearningPage from './pages/LearningPage.jsx'

export default function App() {
  return (
    <div className="flex min-h-screen h-dvh flex-col bg-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/folder/:id" element={<FolderDetail />} />
          <Route path="/folder/:folderId/card/:cardId" element={<CardDetail />} />
          <Route path="/learning" element={<LearningPage />} />
        </Routes>
      </div>
    </div>
  )
}
