import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ClozeEditor from '../components/ClozeEditor.jsx'
import db from '../db.js'
import useMobileBack from '../hooks/useMobileBack.js'

function typeLabel(v) {
  const m = { qa: '问答题', cloze: '填空题', match: '连线题' }
  return m[v] || '问答题'
}

export default function CardDetail() {
  const { folderId: fId, cardId: cId } = useParams()
  const navigate = useNavigate()
  const folderId = Number(fId)
  const cardId = Number(cId)

  const [card, setCard] = useState(null)
  const [folder, setFolder] = useState(null)
  const [loading, setLoading] = useState(true)

  const [matchLeftText, setMatchLeftText] = useState('')
  const [matchRightText, setMatchRightText] = useState('')
  const [matchError, setMatchError] = useState('')
  const matchSaveTimer = useRef(null)

  useMobileBack()

  const load = useCallback(async () => {
    const c = await db.cards.get(cardId)
    const f = await db.folders.get(folderId)
    if (!c || !f) { navigate('/'); return }
    setCard(c)
    setFolder(f)
    setLoading(false)

    const pairs = c.matchPairs || []
    setMatchLeftText(pairs.map((p) => p.left).join('\n'))
    setMatchRightText(pairs.map((p) => p.right).join('\n'))
  }, [cardId, folderId, navigate])

  useEffect(() => { load() }, [load])

  const handleClozeChange = async (newVal) => {
    await db.cards.update(cardId, { clozeProcessedText: newVal })
    setCard((prev) => ({ ...prev, clozeProcessedText: newVal }))
  }

  const handleMatchSave = (leftText, rightText) => {
    setMatchLeftText(leftText)
    setMatchRightText(rightText)
    setMatchError('')

    const leftLines = leftText.split('\n').filter(Boolean)
    const rightLines = rightText.split('\n').filter(Boolean)
    if (leftLines.length === 0 && rightLines.length === 0) return
    if (leftLines.length !== rightLines.length) {
      setMatchError('左右数量不一致')
      return
    }

    const pairs = leftLines.map((left, i) => ({ left, right: rightLines[i] }))

    if (matchSaveTimer.current) clearTimeout(matchSaveTimer.current)
    matchSaveTimer.current = setTimeout(async () => {
      await db.cards.update(cardId, { matchPairs: pairs })
      setCard((prev) => ({ ...prev, matchPairs: pairs }))
    }, 400)
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  const isCloze = (card.cardType || 'qa') === 'cloze'
  const isMatch = (card.cardType || 'qa') === 'match'

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3">
        <button
          onClick={() => navigate(`/folder/${folderId}`)}
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
          <span className="text-sm text-gray-500">{folder.name}</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">{card.question}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 p-6">
        {/* Type badge */}
        <span className="inline-block w-fit rounded-full bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-600">
          {typeLabel(card.cardType || 'qa')}
        </span>

        {isCloze ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <ClozeEditor
              value={card.clozeProcessedText || card.clozeText || ''}
              onChange={handleClozeChange}
            />
          </div>
        ) : isMatch ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs font-medium text-gray-400">连线配对 · 左右按行匹配</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">左侧</label>
                <textarea
                  value={matchLeftText}
                  onChange={(e) => handleMatchSave(e.target.value, matchRightText)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">右侧</label>
                <textarea
                  value={matchRightText}
                  onChange={(e) => handleMatchSave(matchLeftText, e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
                />
              </div>
            </div>

            {matchError && (
              <p className="mt-2 text-xs font-medium text-red-500">{matchError}</p>
            )}

            {/* Preview */}
            {!matchError && matchLeftText.trim() && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="mb-2 text-xs text-gray-400">预览</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {(card.matchPairs || []).map((pair, i) => (
                    <div key={i} className="contents">
                      <div className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">{pair.left}</div>
                      <div className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">{pair.right}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-1 text-xs font-medium text-gray-400">问题</p>
              <p className="text-lg font-semibold text-gray-900">{card.question}</p>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-1 text-xs font-medium text-gray-400">答案</p>
              <p className="text-base text-gray-800 whitespace-pre-wrap">{card.answer}</p>
            </div>
          </>
        )}

        {/* Meta */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium text-gray-400">卡片信息</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>状态 <span className="ml-1 font-medium text-gray-800">{card.state || 'new'}</span></div>
            <div>重复次数 <span className="ml-1 font-medium text-gray-800">{card.repetition || 0}</span></div>
            <div>EF <span className="ml-1 font-medium text-gray-800">{((card.easeFactor || 2.5) * 100).toFixed(0)}%</span></div>
            <div>间隔 <span className="ml-1 font-medium text-gray-800">{((card.interval || 0) / (24 * 60 * 60 * 1000)).toFixed(1)} 天</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
