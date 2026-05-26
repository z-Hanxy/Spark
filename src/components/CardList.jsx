import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal.jsx'

const TYPES = [
  { value: 'qa', label: '问答题' },
  { value: 'cloze', label: '填空题' },
  { value: 'match', label: '连线题' },
]

function typeLabel(v) {
  return (TYPES.find((t) => t.value === v) || TYPES[0]).label
}

export default function CardList({
  cards,
  folderName,
  folderId,
  onCreateCard,
  onEditCard,
  onDeleteCard,
}) {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [clozeText, setClozeText] = useState('')
  const [cardType, setCardType] = useState('qa')

  const [matchLeftText, setMatchLeftText] = useState('')
  const [matchRightText, setMatchRightText] = useState('')
  const [matchError, setMatchError] = useState('')

  const [editCard, setEditCard] = useState(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')

  // mobile: more menu & delete confirm
  const [isTouch, setIsTouch] = useState(false)
  const [menuCardId, setMenuCardId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, question }

  useEffect(() => {
    setIsTouch('ontouchstart' in window)
  }, [])

  // close menu on outside click
  useEffect(() => {
    if (menuCardId === null) return
    const handler = () => setMenuCardId(null)
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [menuCardId])

  const handleCreate = () => {
    if (cardType === 'cloze') {
      if (!clozeText.trim()) return
      onCreateCard(clozeText.trim(), '', cardType, clozeText.trim(), clozeText.trim())
      setClozeText('')
    } else if (cardType === 'match') {
      const leftLines = matchLeftText.trim().split('\n').filter(Boolean)
      const rightLines = matchRightText.trim().split('\n').filter(Boolean)
      if (leftLines.length === 0 || rightLines.length === 0) return
      if (leftLines.length !== rightLines.length) {
        setMatchError('左右数量不一致')
        return
      }
      setMatchError('')
      const pairs = leftLines.map((left, i) => ({ left, right: rightLines[i] }))
      onCreateCard('连线题', '', cardType, '', '', pairs)
      setMatchLeftText('')
      setMatchRightText('')
    } else {
      if (!question.trim() || !answer.trim()) return
      onCreateCard(question.trim(), answer.trim(), cardType)
      setQuestion('')
      setAnswer('')
    }
    setCardType('qa')
    setCreateOpen(false)
  }

  const closeCreateModal = () => {
    setCreateOpen(false)
    setQuestion('')
    setAnswer('')
    setClozeText('')
    setMatchLeftText('')
    setMatchRightText('')
    setMatchError('')
    setCardType('qa')
  }

  const openEdit = (card) => {
    setEditCard(card)
    setEditQuestion(card.question)
    setEditAnswer(card.answer)
  }

  const handleEdit = () => {
    if (!editQuestion.trim() || !editAnswer.trim()) return
    onEditCard(editCard.id, editQuestion.trim(), editAnswer.trim())
    setEditCard(null)
    setEditQuestion('')
    setEditAnswer('')
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">
            {folderName}
          </h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
          >
            新建
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {cards.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400">暂无卡片</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {cards.map((card) => {
                const ct = card.cardType || 'qa'
                const displayText = ct === 'cloze' ? (card.clozeProcessedText || card.clozeText || card.question)
                  : ct === 'match' ? `连线题 · ${(card.matchPairs || []).length} 组` : card.question
                const displaySub = ct === 'cloze' ? (card.clozeText || '填空题')
                  : ct === 'match' ? ((card.matchPairs || []).map(p => `${p.left}↔${p.right}`).join(', ') || '')
                  : card.answer
                const hasClozeMarks = ct === 'cloze' && (card.clozeProcessedText || '').includes('{{')
                return (
                  <div
                    key={card.id}
                    onClick={() => navigate(`/folder/${folderId}/card/${card.id}`)}
                    className="group relative flex cursor-pointer items-start justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="shrink-0 rounded bg-gray-200 px-1.5 py-px text-[10px] text-gray-500">
                          {typeLabel(ct)}
                        </span>
                        {ct === 'cloze' && !hasClozeMarks && (
                          <span className="shrink-0 rounded bg-blue-50 px-1.5 py-px text-[10px] text-blue-500">
                            点击以增加挖空
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm font-medium">{displayText}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">{displaySub}</p>
                    </div>

                    {/* ── desktop: hover buttons ── */}
                    <div className="ml-2 flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(card) }}
                        className="cursor-pointer rounded p-0.5 text-gray-400 hover:bg-blue-100 hover:text-blue-500"
                        title="编辑"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id) }}
                        className="cursor-pointer rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-500"
                        title="删除"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* ── mobile: ⋮ more button ── */}
                    {isTouch && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuCardId(menuCardId === card.id ? null : card.id) }}
                        className="ml-2 shrink-0 cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-200"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    )}

                    {/* ── mobile: dropdown menu ── */}
                    {isTouch && menuCardId === card.id && (
                      <div
                        className="absolute right-2 top-full z-40 mt-1 w-32 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { setMenuCardId(null); openEdit(card) }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          编辑
                        </button>
                        <button
                          onClick={() => { setMenuCardId(null); setDeleteTarget({ id: card.id, question: displayText }) }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={closeCreateModal} title="新建卡片">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">题型</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setCardType(t.value)}
                  className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                    cardType === t.value ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {cardType === 'cloze' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">内容</label>
              <textarea value={clozeText} onChange={(e) => setClozeText(e.target.value)} placeholder="请输入整段内容，例如：中国四大发明是指造纸术、指南针、火药和印刷术。" rows={6} autoFocus className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none" />
            </div>
          ) : cardType === 'match' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">连线配对</label>
              <p className="mb-2 text-xs text-gray-400">左右按行配对，第1行左 ↔ 第1行右，行数必须一致</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">左侧</label>
                  <textarea value={matchLeftText} onChange={(e) => { setMatchLeftText(e.target.value); setMatchError('') }} placeholder={'造纸术\n指南针\n火药\n印刷术'} rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">右侧</label>
                  <textarea value={matchRightText} onChange={(e) => { setMatchRightText(e.target.value); setMatchError('') }} placeholder={'蔡伦\n航海\n军事\n知识传播'} rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none" />
                </div>
              </div>
              {matchError && <p className="mt-2 text-xs font-medium text-red-500">{matchError}</p>}
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">问题</label>
                <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="" autoFocus className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">答案</label>
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="" rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none" />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={closeCreateModal} className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">取消</button>
            <button onClick={handleCreate} disabled={cardType === 'cloze' ? !clozeText.trim() : cardType === 'match' ? (!matchLeftText.trim() || !matchRightText.trim()) : (!question.trim() || !answer.trim())} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">创建</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editCard} onClose={() => setEditCard(null)} title="编辑卡片">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">问题</label>
            <input type="text" value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} placeholder="" autoFocus className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">答案</label>
            <textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} placeholder="" rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditCard(null)} className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">取消</button>
            <button onClick={handleEdit} disabled={!editQuestion.trim() || !editAnswer.trim()} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">保存</button>
          </div>
        </div>
      </Modal>

      {/* Mobile Delete Confirm Modal */}
      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="确定删除？">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            将删除卡片「<span className="font-medium text-gray-800">{deleteTarget?.question?.slice(0, 40)}{(deleteTarget?.question?.length > 40) ? '…' : ''}</span>」，此操作不可撤销。
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">取消</button>
            <button
              onClick={() => { onDeleteCard(deleteTarget.id); setDeleteTarget(null) }}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
