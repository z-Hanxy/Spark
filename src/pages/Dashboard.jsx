import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import DashboardStats from '../components/DashboardStats.jsx'
import db from '../db.js'
import useMobileBack from '../hooks/useMobileBack.js'

export default function Dashboard() {
  const [folders, setFolders] = useState([])
  const [statsKey, setStatsKey] = useState(0)

  useMobileBack({ isRoot: true })

  const refreshStats = () => setStatsKey((k) => k + 1)

  const loadFolders = useCallback(async () => {
    const all = await db.folders.toArray()
    setFolders(all)
  }, [])

  useEffect(() => { loadFolders() }, [loadFolders])

  const handleCreateFolder = async (name) => {
    await db.folders.add({ name, parentId: null })
    await loadFolders()
    refreshStats()
  }

  const handleDeleteFolder = async (folderId) => {
    await db.cards.where('folderId').equals(folderId).delete()
    await db.folders.delete(folderId)
    await loadFolders()
    refreshStats()
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-scroll">
      <DashboardStats refreshKey={statsKey} />

      {/* 文件夹区域 — 放到热力图下方 */}
      <Sidebar
        folders={folders}
        selectedFolderId={null}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
      />
    </div>
  )
}
