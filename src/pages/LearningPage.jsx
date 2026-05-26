import { useState, useCallback, useEffect, useRef } from 'react'
import db from '../db.js'
import ClozeLearning from '../components/ClozeLearning.jsx'
import MatchLearning from '../components/MatchLearning.jsx'
import useMobileBack from '../hooks/useMobileBack.js'

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

const LEARNING_STEPS_MS = [
  1 * 60 * 1000,
  10 * 60 * 1000,
  1440 * 60 * 1000,
]

export default function LearningPage() {
  const [dueCards, setDueCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [totalDue, setTotalDue] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [allDone, setAllDone] = useState(false)

  // track which cards have been reviewed this session
  const reviewedIdsRef = useRef(new Set())

  useMobileBack()

  // ── queue empty → force-reset unreviewed cards due today ──
  const forceRef = useRef(false)

  useEffect(() => {
    if (!sessionStarted) { return }
    if (dueCards.length > 0) { setAllDone(false); return }
    if (allDone) return
    if (forceRef.current) return
    forceRef.current = true

    let cancelled = false
    ;(async () => {
      const now = Date.now()
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)
      const deadline = endOfToday.getTime()

      const all = await db.cards.toArray()
      if (cancelled) { forceRef.current = false; return }

      if (all.length === 0) { setAllDone(true); forceRef.current = false; return }

      const reviewedSet = reviewedIdsRef.current

      // unreviewed cards whose nextReviewDate is within today
      const upcoming = all.filter(
        (c) => c.nextReviewDate > now && c.nextReviewDate <= deadline && !reviewedSet.has(c.id)
      )

      if (upcoming.length === 0) {
        if (!cancelled) { setAllDone(true); forceRef.current = false }
        return
      }

      // reset their cooldown to now
      for (const c of upcoming) {
        if (cancelled) break
        await db.cards.update(c.id, { nextReviewDate: now, dueDate: now })
      }

      if (cancelled) { forceRef.current = false; return }

      const reloaded = await db.cards.toArray()
      const allDue = reloaded.filter((c) => c.nextReviewDate <= now)
      for (let i = allDue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[allDue[i], allDue[j]] = [allDue[j], allDue[i]]
      }

      if (!cancelled) {
        setDueCards(allDue)
        setCurrentIndex(0)
        setShowAnswer(false)
        setAllDone(false)
        forceRef.current = false
      }
    })()
    return () => { cancelled = true }
  }, [dueCards.length, sessionStarted, allDone])

  const loadDueCards = useCallback(async () => {
    const now = Date.now()
    const all = await db.cards.toArray()
    const due = all.filter((c) => c.nextReviewDate <= now)

    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[due[i], due[j]] = [due[j], due[i]]
    }

    reviewedIdsRef.current = new Set()
    setDueCards(due)
    setCurrentIndex(0)
    setShowAnswer(false)
    setTotalDue(due.length)
    setSessionStarted(true)
    setReviewedCount(0)
    setAllDone(false)
  }, [])

  const handleShowAnswer = () => { setShowAnswer(true) }

  const handleRate = async (rating) => {
    const card = dueCards[currentIndex]
    const now = Date.now()
    const fromState = card.state || 'new'

    let updates = {}
    let keepInQueue = false

    if (fromState === 'new' || fromState === 'learning' || fromState === 'relearning') {
      let stepIndex = card.stepIndex || 0

      if (rating === 'again') {
        stepIndex = 0
        updates = {
          state: 'learning',
          stepIndex: 0,
          dueDate: now + 60 * 1000,
          nextReviewDate: now + 60 * 1000,
        }
        keepInQueue = true
      } else if (rating === 'hard') {
        updates = {
          state: 'learning',
          stepIndex,
          dueDate: now + (LEARNING_STEPS_MS[stepIndex] || 60 * 1000),
          nextReviewDate: now + (LEARNING_STEPS_MS[stepIndex] || 60 * 1000),
        }
      } else {
        stepIndex++
        if (stepIndex < LEARNING_STEPS_MS.length) {
          updates = {
            state: 'learning',
            stepIndex,
            dueDate: now + LEARNING_STEPS_MS[stepIndex],
            nextReviewDate: now + LEARNING_STEPS_MS[stepIndex],
          }
        } else {
          const isRelearn = fromState === 'relearning'
          updates = {
            state: 'review',
            stepIndex,
            repetition: isRelearn ? (card.repetition || 1) : 1,
            interval: DAY_1,
            easeFactor: isRelearn ? (card.easeFactor || 2.5) : 2.5,
            lapseCount: isRelearn ? (card.lapseCount || 0) : 0,
            repetitionCount: isRelearn ? (card.repetition || 1) : 1,
            dueDate: now + DAY_1,
            nextReviewDate: now + DAY_1,
          }
        }
      }
    } else {
      const oldInterval = card.interval || DAY_1
      const intervalDays = oldInterval / DAY_1
      let easeFactor = card.easeFactor || 2.5
      let repetition = card.repetition || 0
      let lapseCount = card.lapseCount || 0
      let interval

      if (rating === 'again') {
        lapseCount += 1
        easeFactor = Math.max(1.3, easeFactor - 0.2)
        updates = {
          state: 'relearning',
          stepIndex: 0,
          easeFactor,
          lapseCount,
          repetitionCount: 0,
          dueDate: now + MIN_10,
          nextReviewDate: now + MIN_10,
        }
        keepInQueue = true
      } else if (rating === 'hard') {
        interval = Math.max(1, Math.round(intervalDays * 1.2))
        easeFactor = Math.max(1.3, easeFactor - 0.15)
        repetition += 1
        updates = {
          state: 'review',
          easeFactor,
          interval: interval * DAY_1,
          repetition,
          repetitionCount: repetition,
          dueDate: now + interval * DAY_1,
          nextReviewDate: now + interval * DAY_1,
        }
      } else {
        interval = Math.max(1, Math.round(intervalDays * easeFactor))
        repetition += 1
        updates = {
          state: 'review',
          easeFactor,
          interval: interval * DAY_1,
          repetition,
          repetitionCount: repetition,
          dueDate: now + interval * DAY_1,
          nextReviewDate: now + interval * DAY_1,
        }
      }
    }

    const toState = updates.state || fromState
    const oldEF = card.easeFactor || 2.5
    const newEF = updates.easeFactor !== undefined ? updates.easeFactor : oldEF
    const oldIv = card.interval || 0
    const newIv = updates.interval !== undefined ? updates.interval : oldIv

    await db.cards.update(card.id, updates)
    await db.reviewLogs.add({
      cardId: card.id,
      date: todayDateStr(),
      result: rating,
      fromState,
      toState,
      intervalChange: newIv - oldIv,
      easeFactorChange: Math.round((newEF - oldEF) * 100) / 100,
      timestamp: now,
    })

    // mark this card as reviewed this session
    reviewedIdsRef.current.add(card.id)

    setReviewedCount((c) => c + 1)

    const newCards = [...dueCards]
    if (keepInQueue) {
      const [moved] = newCards.splice(currentIndex, 1)
      Object.assign(moved, updates)
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

  // ── truly done ──
  if (isComplete && allDone) {
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
            onClick={() => { setSessionStarted(false); setDueCards([]); setAllDone(false) }}
            className="mt-6 cursor-pointer rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  // ── queue empty, auto-loading more ──
  if (isComplete && !allDone) {
    return null
  }

  if (!currentCard) return null

  const remaining = dueCards.length
  const isCloze = (currentCard.cardType || 'qa') === 'cloze'
  const isMatch = (currentCard.cardType || 'qa') === 'match'

  // ── match card ──
  if (isMatch) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-400">
          第 {reviewedCount + 1} 张 / 共 {totalDue} 张到期
          {remaining > 1 && <span className="ml-2 text-indigo-500">（队列剩余 {remaining} 张）</span>}
        </div>
        <MatchLearning card={currentCard} onRate={handleRate} />
      </div>
    )
  }

  // ── cloze card ──
  if (isCloze) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-400">
          第 {reviewedCount + 1} 张 / 共 {totalDue} 张到期
          {remaining > 1 && <span className="ml-2 text-indigo-500">（队列剩余 {remaining} 张）</span>}
        </div>
        <ClozeLearning card={currentCard} onRate={handleRate} />
      </div>
    )
  }

  // ── QA card ──
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
      <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-400">
        第 {reviewedCount + 1} 张 / 共 {totalDue} 张到期
        {remaining > 1 && <span className="ml-2 text-indigo-500">（队列剩余 {remaining} 张）</span>}
      </div>

      <div className={`flex w-full max-w-lg flex-col items-center rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl transition-all duration-500 ${showAnswer ? 'min-h-[320px]' : 'min-h-[220px]'}`}>
        <div className="mb-4 sm:mb-6 text-center">
          <span className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">Question</span>
          <p className="mt-2 text-lg sm:text-xl font-semibold text-gray-900 break-words">{currentCard.question}</p>
        </div>

        {!showAnswer ? (
          <button onClick={handleShowAnswer} className="mt-4 cursor-pointer rounded-xl bg-indigo-600 px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-[0.98]">
            显示答案
          </button>
        ) : (
          <>
            <div className="mb-6 sm:mb-8 w-full rounded-xl bg-gray-50 p-4 sm:p-6 text-center">
              <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-700">Answer</span>
              <p className="mt-2 text-base sm:text-lg text-gray-800 break-words">{currentCard.answer}</p>
            </div>

            <div className="flex w-full gap-2 sm:gap-3">
              <button onClick={() => handleRate('again')} className="flex-1 cursor-pointer rounded-xl border-2 border-red-300 bg-red-50 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-red-600 transition-all hover:bg-red-100 hover:shadow-md active:scale-[0.97]">
                <div className="text-sm sm:text-lg">🔴</div><div>没记住</div>
              </button>
              <button onClick={() => handleRate('hard')} className="flex-1 cursor-pointer rounded-xl border-2 border-yellow-300 bg-yellow-50 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-yellow-600 transition-all hover:bg-yellow-100 hover:shadow-md active:scale-[0.97]">
                <div className="text-sm sm:text-lg">🟡</div><div>模糊</div>
              </button>
              <button onClick={() => handleRate('good')} className="flex-1 cursor-pointer rounded-xl border-2 border-green-300 bg-green-50 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-green-600 transition-all hover:bg-green-100 hover:shadow-md active:scale-[0.97]">
                <div className="text-sm sm:text-lg">🟢</div><div>记住</div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
