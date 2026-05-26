import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal.jsx'

export default function Sidebar({
  folders,
  selectedFolderId,
  onCreateFolder,
  onDeleteFolder,
}) {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const handleCreate = () => {
    if (!newFolderName.trim()) return
    onCreateFolder(newFolderName.trim())
    setNewFolderName('')
    setIsModalOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate()
  }

  return (
    <>
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <span className="text-sm font-semibold text-gray-700">文件夹</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            title="新建文件夹"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {folders.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              暂无文件夹
            </p>
          )}
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => navigate(`/folder/${folder.id}`)}
              className={`group mx-2 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                selectedFolderId === folder.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="truncate">{folder.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteFolder(folder.id)
                }}
                className="cursor-pointer shrink-0 rounded p-0.5 text-gray-400 opacity-0 hover:bg-red-100 hover:text-red-500 group-hover:opacity-100"
                title="删除文件夹"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setNewFolderName('')
        }}
        title="新建文件夹"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsModalOpen(false)
                setNewFolderName('')
              }}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!newFolderName.trim()}
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              创建
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
