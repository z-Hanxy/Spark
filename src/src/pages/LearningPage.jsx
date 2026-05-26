import { useState, useCallback } from 'react'
import db from '../db.js'

function todayDateStr() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

const MIN_10 = 10 * 60 * 1000
const DAY_1 = 24 * 60 * 60 * 1000
const DAY_3 = 3 * DAY_1

export default function LearningPage() {
  const [dueCards, setDueCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [totalDue, setTotalDue] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const loadDueCards = useCallback(async () => {
    const now = Date.now()
    const all = await db.cards.toArray()
    const due = all.filter((c) => c.nextReviewDate <= now)

    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[due[i], due[j]] = [due[j], due[i]]
    }

    setDueCards(due)
    setCurrentIndex(0)
    setShowAnswer(false)
    setTotalDue(due.length)
    setSessionStarted(true)
    setReviewedCount(0)
  }, [])

  const handleShowAnswer = () => { setShowAnswer(true) }

  const handleRate = async (rating) => {
    const card = dueCards[currentIndex]
    const now = Date.now()
    const prevInterval = card.interval || 0
    let easeFactor, interval, repetitionCount, nextReviewDate

    if (rating === 'again') {
      repetitionCount = 0
      easeFactor = Math.max(1.3, (card.easeFactor || 2.5) - 0.2)
      interval = MIN_10
      nextReviewDate = now + MIN_10
    } else if (rating === 'hard') {
      repetitionCount = (card.repetitionCount || 0) + 1
      easeFactor = Math.max(1.3, (card.easeFactor || 2.5) - 0.15)
      interval = (repetitionCount === 1) ? DAY_1 : prevInterval * 1.2
      nextReviewDate = now + interval
    } else {
      repetitionCount = (card.repetitionCount || 0) + 1
      easeFactor = (card.easeFactor || 2.5) + 0.15
      if (repetitionCount === 1) interval = DAY_1
      else if (repetitionCount === 2) interval = DAY_3
      else interval = prevInterval * easeFactor
      nextReviewDate = now + interval
    }

    await db.cards.update(card.id, { easeFactor, interval, repetitionCount, nextReviewDate })
    await db.reviewLogs.add({ cardId: card.id, date: todayDateStr(), result: rating })

    setReviewedCount((c) => c + 1)

    const newCards = [...dueCards]
    if (rating === 'again') {
      const [moved] = newCards.splice(currentIndex, 1)
      moved.easeFactor = easeFactor
      moved.interval = interval
      moved.repetitionCount = repetitionCount
      moved.nextReviewDate = nextReviewDate
      newCards.push(moved)
    } else {
      newCards.splice(currentIndex, 1)
    }

    setDueCards(newCards)
    setShowAnswer(false)

    if (newCards.length === 0) setCurrentIndex(0)
  }

  const currentCard = dueCards[currentIndex]
  const isComplete = sessionStarted && dueCards.length === 0

  if (!sessionStarted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <button
          onClick={loadDueCards}
          className="cursor-pointer rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-indigo-700"
        >
          今日待复习
        </button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="rounded-2xl bg-green-50 p-12 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-2xl font-bold text-green-700">今日已完成</p>
          <p className="mt-2 text-sm text-green-600">
            {totalDue > 0 ? `共复习 ${reviewedCount} 张卡片` : '暂无到期卡片需要复习'}
          </p>
          <button
            onClick={() => { setSessionStarted(false); setDueCards([]) }}
            className="mt-6 cursor-pointer rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  if (!currentCard) return null

  const remaining = dueCards.length

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="mb-6 text-sm text-gray-400">
        第 {reviewedCount + 1} 张 / 共 {totalDue} 张到期
        {remaining > 1 && <span className="ml-2 text-indigo-500">（队列剩余 {remaining} 张）</span>}
      </div>

      <div className={`flex w-full max-w-lg flex-col items-center rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-500 ${showAnswer ? 'min-h-[320px]' : 'min-h-[240px]'}`}>
        <div className="mb-6 text-center">
          <span className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">Question</span>
          <p className="mt-2 text-xl font-semibold text-gray-900">{currentCard.question}</p>
        </div>

        {!showAnswer ? (
          <button onClick={handleShowAnswer} className="mt-4 cursor-pointer rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]">
            显示答案
          </button>
        ) : (
          <>
            <div className="mb-8 w-full rounded-xl bg-gray-50 p-6 text-center">
              <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-700">Answer</span>
              <p className="mt-2 text-lg text-gray-800">{currentCard.answer}</p>
            </div>

            <div className="flex w-full gap-3">
              <button onClick={() => handleRate('again')} className="flex-1 cursor-pointer rounded-xl border-2 border-red-300 bg-red-50 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100 hover:shadow-md active:scale-[0.97]">
                <div className="text-lg">🔴</div><div>没记住</div>
              </button>
              <button onClick={() => handleRate('hard')} className="flex-1 cursor-pointer rounded-xl border-2 border-yellow-300 bg-yellow-50 py-3 text-sm font-bold text-yellow-600 transition-all hover:bg-yellow-100 hover:shadow-md active:scale-[0.97]">
                <div className="text-lg">🟡</div><div>模糊</div>
              </button>
              <button onClick={() => handleRate('good')} className="flex-1 cursor-pointer rounded-xl border-2 border-green-300 bg-green-50 py-3 text-sm font-bold text-green-600 transition-all hover:bg-green-100 hover:shadow-md active:scale-[0.97]">
                <div className="text-lg">🟢</div><div>记住</div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
