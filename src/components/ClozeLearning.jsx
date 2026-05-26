import { useState, useMemo, useEffect, useRef } from 'react'
import { parseClozeSegments } from './ClozeEditor.jsx'

export default function ClozeLearning({ card, onRate }) {
  const text = card.clozeProcessedText || card.clozeText || ''
  const segments = useMemo(() => parseClozeSegments(text), [text])

  const clozeItems = useMemo(
    () => segments.filter((s) => s.type === 'cloze').map((s) => ({ answer: s.content })),
    [segments]
  )

  const [answers, setAnswers] = useState(() => clozeItems.map(() => ''))
  const [submitted, setSubmitted] = useState(false)

  // reset on card change
  const prevCardId = useRef(card.id)
  useEffect(() => {
    if (prevCardId.current !== card.id) {
      prevCardId.current = card.id
      setAnswers(clozeItems.map(() => ''))
      setSubmitted(false)
    }
  }, [card.id, clozeItems])

  const handleChange = (idx, val) => {
    const next = [...answers]
    next[idx] = val
    setAnswers(next)
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const handleRateWrap = (rating) => {
    setAnswers(clozeItems.map(() => ''))
    setSubmitted(false)
    onRate(rating)
  }

  const allCorrect = useMemo(() => {
    if (!submitted) return null
    return clozeItems.every(
      (item, i) => answers[i].trim().toLowerCase() === item.answer.trim().toLowerCase()
    )
  }, [submitted, answers, clozeItems])

  if (clozeItems.length === 0) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-400">暂无挖空内容</p>
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={() => handleRateWrap('again')} className="cursor-pointer rounded-xl border-2 border-red-300 bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">
            🔴 没记住
          </button>
          <button onClick={() => handleRateWrap('hard')} className="cursor-pointer rounded-xl border-2 border-yellow-300 bg-yellow-50 px-6 py-2.5 text-sm font-bold text-yellow-600 hover:bg-yellow-100">
            🟡 模糊
          </button>
          <button onClick={() => handleRateWrap('good')} className="cursor-pointer rounded-xl border-2 border-green-300 bg-green-50 px-6 py-2.5 text-sm font-bold text-green-600 hover:bg-green-100">
            🟢 记住
          </button>
        </div>
      </div>
    )
  }

  let clozeIdx = 0

  return (
    <div className="w-full max-w-lg sm:max-w-xl">
      {/* Rendered text with blanks */}
      <div className="rounded-xl bg-gray-50 p-4 sm:p-6">
        <span className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
          填空题
        </span>
        <div className="mt-3 space-y-2 text-sm sm:text-base leading-relaxed text-gray-900">
          {segments.map((seg, i) => {
            if (seg.type === 'text') {
              return <span key={i}>{seg.content}</span>
            }
            // cloze segment → render input blank
            const curIdx = clozeIdx++
            const isCorrect = submitted
              ? answers[curIdx].trim().toLowerCase() === seg.content.trim().toLowerCase()
              : null

            return (
              <span key={i} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  value={answers[curIdx]}
                  onChange={(e) => handleChange(curIdx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !submitted) handleSubmit()
                  }}
                  disabled={submitted}
                  className={`inline-block w-24 sm:w-28 rounded-md border-2 px-2 py-1 text-sm outline-none transition-colors ${
                    submitted
                      ? isCorrect
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-900 focus:border-indigo-400'
                  }`}
                  placeholder="..."
                  autoFocus={curIdx === 0}
                />
                {submitted && (
                  <span className="text-xs">
                    {isCorrect ? '✓' : <span className="text-red-500">（{seg.content}）</span>}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>

      {/* Check / Rate buttons */}
      <div className="mt-6 flex justify-center gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={answers.some((a) => !a.trim())}
            className="cursor-pointer rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            检查答案
          </button>
        ) : (
          <>
            <button onClick={() => handleRateWrap('again')} className="cursor-pointer rounded-xl border-2 border-red-300 bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">
              🔴 没记住
            </button>
            <button onClick={() => handleRateWrap('hard')} className="cursor-pointer rounded-xl border-2 border-yellow-300 bg-yellow-50 px-6 py-2.5 text-sm font-bold text-yellow-600 hover:bg-yellow-100">
              🟡 模糊
            </button>
            <button onClick={() => handleRateWrap('good')} className="cursor-pointer rounded-xl border-2 border-green-300 bg-green-50 px-6 py-2.5 text-sm font-bold text-green-600 hover:bg-green-100">
              🟢 记住
            </button>
          </>
        )}
      </div>
    </div>
  )
}
