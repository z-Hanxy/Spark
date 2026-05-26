import { useState, useEffect } from 'react'
import db from '../db.js'
import Heatmap from './Heatmap.jsx'

function todayStr() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export default function DashboardStats({ refreshKey }) {
  const [stats, setStats] = useState({
    mastered: 0,
    struggling: 0,
    dueToday: 0,
    doneToday: 0,
  })
  const [allLogs, setAllLogs] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [allCards, logs] = await Promise.all([
        db.cards.toArray(),
        db.reviewLogs.toArray(),
      ])

      if (cancelled) return

      const now = Date.now()
      const mastered = allCards.filter((c) => (c.repetitionCount || 0) >= 7).length
      const struggling = allCards.length - mastered
      const dueToday = allCards.filter((c) => (c.nextReviewDate || 0) <= now).length

      const todayDate = todayStr()

      // 今日完成 = 今天最后一次复习结果为 green 的卡片数量（按 cardId 去重）
      const todayLogs = logs.filter((l) => l.date === todayDate)

      // 按 cardId 分组，每组按 id 排序取最后一条（id 自增 = 写入顺序）
      const lastLogMap = new Map()
      for (const log of todayLogs) {
        const existing = lastLogMap.get(log.cardId)
        if (!existing || (log.id || 0) > (existing.id || 0)) {
          lastLogMap.set(log.cardId, log)
        }
      }

      let doneToday = 0
      for (const log of lastLogMap.values()) {
        if (log.result === 'good') {
          doneToday++
        }
      }

      setStats({ mastered, struggling, dueToday, doneToday })
      setAllLogs(logs)
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey])

  const items = [
    { label: '已掌握', value: stats.mastered, color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
    { label: '抗争中', value: stats.struggling, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
    { label: '今日待复习', value: stats.dueToday, color: 'bg-indigo-50 border-indigo-200', textColor: 'text-indigo-700' },
    { label: '今日完成', value: stats.doneToday, color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
  ]

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 px-6 py-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border ${item.color} p-4 text-center`}
          >
            <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
            <p className="mt-0.5 text-xs font-medium text-gray-600">{item.label}</p>
          </div>
        ))}
      </div>
      <Heatmap logs={allLogs} />
    </div>
  )
}
