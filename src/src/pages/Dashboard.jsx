import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import DashboardStats from '../components/DashboardStats.jsx'
import db from '../db.js'

export default function Dashboard() {
  const [folders, setFolders] = useState([])
  const [statsKey, setStatsKey] = useState(0)

  const refreshStats = () => setStatsKey((k) => k + 1)

  const loadFolders = useCallback(async () => {
    const all = await db.folders.toArray()
    setFolders(all)
  }, [])

  useEffect(() => { loadFolders() }, [loadFolders])

  // highlight folder by current route, handled by Sidebar internally via navigate
  // but we still need selectedFolderId for visual highlight — use URL
  // Actually we don't need selectedFolderId here since Sidebar uses navigate() now.
  // Let's pass null for highlight (no active folder on Dashboard page)
  const [highlightId, setHighlightId] = useState(null)

  const handleCreateFolder = async (name) => {
    await db.folders.add({ name, parentId: null })
    await loadFolders()
    refreshStats()
  }

  const handleDeleteFolder = async (folderId) => {
    await db.cards.where('folderId').equals(folderId).delete()
    await db.folders.delete(folderId)
    setHighlightId(null)
    await loadFolders()
    refreshStats()
  }

  return (
    <>
      <DashboardStats refreshKey={statsKey} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          selectedFolderId={highlightId}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg className="mx-auto mb-3 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-400">选择一个文件夹查看卡片</p>
            <p className="mt-1 text-xs text-gray-300">或创建一个新文件夹开始</p>
          </div>
        </div>
      </div>
    </>
  )
}
