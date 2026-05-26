import { useState } from 'react'
import Modal from './Modal.jsx'

export default function CardList({
  cards,
  folderName,
  onCreateCard,
  onEditCard,
  onDeleteCard,
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const [editCard, setEditCard] = useState(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')

  const [flippedCardId, setFlippedCardId] = useState(null)

  const handleCreate = () => {
    if (!question.trim() || !answer.trim()) return
    onCreateCard(question.trim(), answer.trim())
    setQuestion('')
    setAnswer('')
    setCreateOpen(false)
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
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700">
            {folderName}
          </h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            新建卡片
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cards.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-400">此文件夹暂无卡片，点击"新建卡片"开始添加</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() =>
                    setFlippedCardId(flippedCardId === card.id ? null : card.id)
                  }
                  className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="text-xs text-gray-400">问题</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(card) }}
                        className="cursor-pointer rounded p-0.5 text-gray-400 hover:bg-blue-100 hover:text-blue-500"
                        title="编辑卡片"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id) }}
                        className="cursor-pointer rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-500"
                        title="删除卡片"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mb-3 text-sm font-medium text-gray-900">{card.question}</p>

                  {flippedCardId === card.id && (
                    <div className="border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-400">答案</span>
                      <p className="mt-1 text-sm text-gray-700">{card.answer}</p>
                    </div>
                  )}

                  {flippedCardId !== card.id && (
                    <p className="text-xs text-indigo-500">点击查看答案</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setQuestion(''); setAnswer('') }}
        title="新建卡片"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">问题</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder=""
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">答案</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder=""
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setCreateOpen(false); setQuestion(''); setAnswer('') }} className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">取消</button>
            <button onClick={handleCreate} disabled={!question.trim() || !answer.trim()} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">创建</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editCard}
        onClose={() => setEditCard(null)}
        title="编辑卡片"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">问题</label>
            <input
              type="text"
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              placeholder=""
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">答案</label>
            <textarea
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              placeholder=""
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditCard(null)} className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">取消</button>
            <button onClick={handleEdit} disabled={!editQuestion.trim() || !editAnswer.trim()} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">保存</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
