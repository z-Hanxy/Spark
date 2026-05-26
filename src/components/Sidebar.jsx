import { useState, useEffect } from 'react'
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

  // mobile: more menu & delete confirm
  const [isTouch, setIsTouch] = useState(false)
  const [menuFolderId, setMenuFolderId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    setIsTouch(('ontouchstart' in window) || navigator.maxTouchPoints > 0)
  }, [])

  // close menu on outside click
  useEffect(() => {
    if (menuFolderId === null) return
    const handler = () => setMenuFolderId(null)
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [menuFolderId])

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
      <div className="border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">文件夹</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
          >
            新建
          </button>
        </div>

        {folders.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">暂无文件夹</p>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => navigate(`/folder/${folder.id}`)}
                className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  selectedFolderId === folder.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="truncate">{folder.name}</span>
                </div>

                {/* ── desktop: hover delete button (hidden on touch devices) ── */}
                {!isTouch && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onDeleteFolder(folder.id)
                    }}
                    className="cursor-pointer shrink-0 rounded p-0.5 text-gray-400 opacity-0 hover:bg-red-100 hover:text-red-500 group-hover:opacity-100"
                    title="删除文件夹"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                {/* ── mobile: ⋮ more button (always visible, 44x44 touch target) ── */}
                {isTouch && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setMenuFolderId(menuFolderId === folder.id ? null : folder.id)
                    }}
                    className="ml-1 shrink-0 cursor-pointer rounded-lg p-2 text-gray-400 active:bg-gray-200 touch-manipulation"
                    style={{ minWidth: 44, minHeight: 44 }}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                )}

                {/* ── mobile: dropdown menu ── */}
                {isTouch && menuFolderId === folder.id && (
                  <div
                    className="absolute right-2 top-full z-40 mt-1 w-36 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault() }}
                  >
                    <button
                      onClick={() => {
                        setMenuFolderId(null)
                        setDeleteTarget({ id: folder.id, name: folder.name })
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 active:bg-red-50 touch-manipulation"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除文件夹
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setNewFolderName('') }}
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
            <button onClick={() => { setIsModalOpen(false); setNewFolderName('') }} className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">取消</button>
            <button onClick={handleCreate} disabled={!newFolderName.trim()} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">创建</button>
          </div>
        </div>
      </Modal>

      {/* Mobile Delete Confirm Modal */}
      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="确定删除？">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            将删除文件夹「<span className="font-medium text-gray-800">{deleteTarget?.name}</span>」及其所有卡片，此操作不可撤销。
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="touch-manipulation cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">取消</button>
            <button
              onClick={() => { onDeleteFolder(deleteTarget.id); setDeleteTarget(null) }}
              className="touch-manipulation cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
