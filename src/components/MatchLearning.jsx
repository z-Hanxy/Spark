import { useState, useMemo, useEffect, useRef } from 'react'

export default function MatchLearning({ card, onRate }) {
  const pairs = card.matchPairs || []

  const leftItems = useMemo(() => pairs.map((p) => ({ text: p.left, correctRight: p.right })), [pairs])

  const rightItems = useMemo(() => {
    const items = pairs.map((p) => p.right)
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[items[i], items[j]] = [items[j], items[i]]
    }
    return items
  }, [pairs])

  const [selectedLeft, setSelectedLeft] = useState(null)
  const [connections, setConnections] = useState(() => new Map())
  const [submitted, setSubmitted] = useState(false)

  const prevCardId = useRef(card.id)
  useEffect(() => {
    if (prevCardId.current !== card.id) {
      prevCardId.current = card.id
      setSelectedLeft(null)
      setConnections(new Map())
      setSubmitted(false)
    }
  }, [card.id])

  const connectedLeft = new Set(connections.keys())
  const connectedRight = new Set(connections.values())

  const allConnected = connections.size === pairs.length

  const handleLeftClick = (idx) => {
    if (submitted) return
    if (connectedLeft.has(idx)) {
      const newMap = new Map(connections)
      newMap.delete(idx)
      setConnections(newMap)
      setSelectedLeft(null)
    } else {
      setSelectedLeft(idx)
    }
  }

  const handleRightClick = (idx) => {
    if (submitted) return
    if (selectedLeft === null) return
    if (connectedRight.has(idx)) return

    const newMap = new Map(connections)
    newMap.set(selectedLeft, idx)
    setConnections(newMap)
    setSelectedLeft(null)
  }

  const handleRateWrap = (rating) => {
    setSelectedLeft(null)
    setConnections(new Map())
    setSubmitted(false)
    onRate(rating)
  }

  if (pairs.length === 0) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-400">无配对数据</p>
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={() => handleRateWrap('again')} className="cursor-pointer rounded-xl border-2 border-red-300 bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">🔴 没记住</button>
          <button onClick={() => handleRateWrap('hard')} className="cursor-pointer rounded-xl border-2 border-yellow-300 bg-yellow-50 px-6 py-2.5 text-sm font-bold text-yellow-600 hover:bg-yellow-100">🟡 模糊</button>
          <button onClick={() => handleRateWrap('good')} className="cursor-pointer rounded-xl border-2 border-green-300 bg-green-50 px-6 py-2.5 text-sm font-bold text-green-600 hover:bg-green-100">🟢 记住</button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg sm:max-w-xl">
      <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
        <span className="mb-3 inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
          连线题 · {connections.size}/{pairs.length} 已连接
        </span>

        <div className="mt-3 flex items-start gap-2 sm:gap-4">
          {/* Left column */}
          <div className="flex-1 space-y-1.5 sm:space-y-2">
            {leftItems.map((item, i) => {
              const isConnected = connectedLeft.has(i)
              const isSelected = selectedLeft === i
              let bgClass = 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 cursor-pointer'
              let marker = ''
              if (submitted) {
                const rightIdx = connections.get(i)
                const rightText = rightItems[rightIdx]
                const correct = item.correctRight === rightText
                bgClass = correct
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
                marker = correct ? ' ✓' : ' ✗'
              } else if (isConnected) {
                bgClass = 'bg-indigo-50 border-indigo-300 text-indigo-700 cursor-pointer'
              } else if (isSelected) {
                bgClass = 'bg-indigo-100 border-indigo-400 text-indigo-700 ring-2 ring-indigo-300 cursor-pointer'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleLeftClick(i)}
                  disabled={submitted}
                  className={`block w-full rounded-lg border px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-left transition-colors ${bgClass}`}
                >
                  {item.text}{marker}
                </button>
              )
            })}
          </div>

          {/* Connector visual */}
          <div className="flex shrink-0 flex-col items-center justify-center pt-1">
            {leftItems.map((_, i) => {
              const isConnected = connectedLeft.has(i)
              return (
                <div key={i} className="flex items-center justify-center" style={{ height: '2.5rem' }}>
                  <svg className={`h-3 w-3 sm:h-4 sm:w-4 ${isConnected ? 'text-indigo-400' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )
            })}
          </div>

          {/* Right column */}
          <div className="flex-1 space-y-1.5 sm:space-y-2">
            {rightItems.map((text, i) => {
              const isConnected = connectedRight.has(i)
              let bgClass = 'bg-white border-gray-200 text-gray-700 hover:border-amber-300 cursor-pointer'
              let marker = ''
              if (submitted) {
                let leftIdx = -1
                for (const [l, r] of connections.entries()) {
                  if (r === i) { leftIdx = l; break }
                }
                const leftItem = leftIdx !== -1 ? leftItems[leftIdx] : null
                const correct = leftItem && leftItem.correctRight === text
                bgClass = correct
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
                marker = correct ? ' ✓' : ' ✗'
              } else if (isConnected) {
                bgClass = 'bg-amber-50 border-amber-300 text-amber-700 cursor-pointer'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleRightClick(i)}
                  disabled={submitted}
                  className={`block w-full rounded-lg border px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-left transition-colors ${bgClass}`}
                >
                  {text}{marker}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2 sm:gap-3">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allConnected}
            className="cursor-pointer rounded-xl bg-indigo-600 px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allConnected ? '检查答案' : `请完成所有配对 (${connections.size}/${pairs.length})`}
          </button>
        ) : (
          <>
            <button onClick={() => handleRateWrap('again')} className="cursor-pointer rounded-xl border-2 border-red-300 bg-red-50 px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-100">
              🔴 没记住
            </button>
            <button onClick={() => handleRateWrap('hard')} className="cursor-pointer rounded-xl border-2 border-yellow-300 bg-yellow-50 px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-yellow-600 hover:bg-yellow-100">
              🟡 模糊
            </button>
            <button onClick={() => handleRateWrap('good')} className="cursor-pointer rounded-xl border-2 border-green-300 bg-green-50 px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-green-600 hover:bg-green-100">
              🟢 记住
            </button>
          </>
        )}
      </div>
    </div>
  )
}
