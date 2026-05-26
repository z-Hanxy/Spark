import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CardList from '../components/CardList.jsx'
import db from '../db.js'
import useMobileBack from '../hooks/useMobileBack.js'

export default function FolderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const folderId = Number(id)

  useMobileBack()

  const [folder, setFolder] = useState(null)
  const [cards, setCards] = useState([])

  const loadFolder = useCallback(async () => {
    const f = await db.folders.get(folderId)
    if (!f) { navigate('/'); return }
    setFolder(f)
  }, [folderId, navigate])

  const loadCards = useCallback(async () => {
    const all = await db.cards.where('folderId').equals(folderId).toArray()
    setCards(all)
  }, [folderId])

  useEffect(() => { loadFolder(); loadCards() }, [loadFolder, loadCards])

  const handleCreateCard = async (question, answer, cardType = 'qa', clozeText = '', clozeProcessedText = '', matchPairs = []) => {
    const now = Date.now()
    await db.cards.add({
      folderId,
      question,
      answer,
      cardType,
      clozeText,
      clozeProcessedText,
      matchPairs,
      state: 'new',
      stepIndex: 0,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      lapseCount: 0,
      repetitionCount: 0,
      nextReviewDate: now,
      dueDate: now,
    })
    await loadCards()
  }

  const handleEditCard = async (cardId, question, answer) => {
    await db.cards.update(cardId, { question, answer })
    await loadCards()
  }

  const handleDeleteCard = async (cardId) => {
    await db.cards.delete(cardId)
    await loadCards()
  }

  if (!folder) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3">
        <button
          onClick={() => navigate('/')}
          className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          title="返回"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-700">{folder.name}</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{cards.length} 张卡片</span>
        </div>
      </div>

      {/* Card list full width */}
      <CardList
        cards={cards}
        folderName={folder.name}
        folderId={folderId}
        onCreateCard={handleCreateCard}
        onEditCard={handleEditCard}
        onDeleteCard={handleDeleteCard}
      />
    </div>
  )
}
