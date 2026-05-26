import { useState, useMemo, useEffect } from 'react'

/* ---- helpers ---- */

function dateKey(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function colorClass(count) {
  if (count === 0) return 'bg-gray-100'
  if (count <= 3) return 'bg-green-200'
  if (count <= 8) return 'bg-green-400'
  return 'bg-green-600'
}

function buildDoneMap(logs) {
  if (!logs || !logs.length) return {}
  const byDate = {}
  for (const log of logs) {
    if (!log.date || log.cardId == null) continue
    if (!byDate[log.date]) byDate[log.date] = {}
    const prev = byDate[log.date][log.cardId]
    if (!prev || (log.id || 0) > (prev.id || 0)) {
      byDate[log.date][log.cardId] = log
    }
  }
  const map = {}
  for (const [date, cardMap] of Object.entries(byDate)) {
    let n = 0
    for (const log of Object.values(cardMap)) {
      if (log.result === 'good') n++
    }
    map[date] = n
  }
  return map
}

/* ---- component ---- */

export default function Heatmap({ logs }) {
  const doneMap = useMemo(() => buildDoneMap(logs), [logs])

  const [year, setYear] = useState(() => {
    try { const v = localStorage.getItem('shanliang_heatmap_year'); return v ? Number(v) : new Date().getFullYear() }
    catch { return new Date().getFullYear() }
  })
  const [month, setMonth] = useState(() => {
    try { const v = localStorage.getItem('shanliang_heatmap_month'); return v ? Number(v) : new Date().getMonth() + 1 }
    catch { return new Date().getMonth() + 1 }
  })
  useEffect(() => { localStorage.setItem('shanliang_heatmap_year', String(year)) }, [year])
  useEffect(() => { localStorage.setItem('shanliang_heatmap_month', String(month)) }, [month])

  const [activeCell, setActiveCell] = useState(null)

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else { setMonth(m => m - 1) }
    setActiveCell(null)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else { setMonth(m => m + 1) }
    setActiveCell(null)
  }
  function goToday() {
    const n = new Date()
    setYear(n.getFullYear())
    setMonth(n.getMonth() + 1)
    setActiveCell(null)
  }

  /* build calendar-aligned cells */
  const { cells, label, todayKey } = useMemo(() => {
    const total = daysInMonth(year, month)

    // 1st of month weekday: 0=Sun … 6=Sat
    // Our header: 一(Mon=col0) … 六(Sat=col5) 日(Sun=col6)
    const raw = new Date(year, month - 1, 1).getDay()  // 0=Sun
    const leadingCount = raw === 0 ? 6 : raw - 1       // Mon slots before 1st

    // date cells
    const dates = []
    for (let d = 1; d <= total; d++) {
      dates.push({ day: d, key: dateKey(year, month, d), count: doneMap[dateKey(year, month, d)] || 0 })
    }

    // build flat array: leading empties + dates + trailing empties
    const flat = []
    for (let i = 0; i < leadingCount; i++) flat.push(null)
    for (const d of dates) flat.push(d)

    // pad trailing empties so the grid ends on a full row
    const tail = flat.length % 7
    if (tail !== 0) {
      for (let i = 0; i < 7 - tail; i++) flat.push(null)
    }

    const tk = dateKey(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
    return { cells: flat, label: `${year}年${month}月`, todayKey: tk }
  }, [year, month, doneMap])

  useEffect(() => {
    if (!activeCell) return
    const handler = () => setActiveCell(null)
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [activeCell])

  return (
    <div className="px-6 py-3">
      {/* nav */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">本月热力图</span>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="cursor-pointer rounded px-2 py-0.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700">‹</button>
          <span className="min-w-[100px] text-center text-sm font-semibold text-gray-700">{label}</span>
          <button onClick={nextMonth} className="cursor-pointer rounded px-2 py-0.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700">›</button>
          <button onClick={goToday} className="cursor-pointer rounded px-2 py-0.5 text-xs text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700">今天</button>
        </div>
      </div>

      {/* grid — single grid-cols-7, header + cells */}
      <div className="relative inline-block rounded-lg border border-gray-200 bg-white p-3">
        <div className="grid grid-cols-7 gap-1">
          {['一', '二', '三', '四', '五', '六', '日'].map(h => (
            <div key={h} className="flex h-6 w-10 items-center justify-center text-[11px] font-medium text-gray-400">{h}</div>
          ))}

          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} className="h-10 w-10" />

            const isToday = cell.key === todayKey
            const isActive = activeCell?.key === cell.key
            return (
              <div
                key={cell.key}
                onClick={e => { e.stopPropagation(); setActiveCell(isActive ? null : cell) }}
                onMouseEnter={() => setActiveCell(cell)}
                onMouseLeave={() => setActiveCell(null)}
                className={`h-10 w-10 cursor-pointer rounded-md transition-transform hover:scale-110 ${colorClass(cell.count)}${isToday ? ' ring-2 ring-indigo-500' : ''}${isActive ? ' ring-2 ring-indigo-400' : ''}`}
              />
            )
          })}
        </div>
      </div>

      {/* tooltip */}
      {activeCell && (
        <div className="mt-1 flex justify-center">
          <div className="rounded-lg bg-gray-800 px-3 py-2 text-center text-xs text-white shadow-lg">
            <div className="font-semibold">{month}月{activeCell.day}日</div>
            <div className="text-gray-300">完成 {activeCell.count} 张</div>
          </div>
        </div>
      )}

      {/* legend */}
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400">少</span>
        <div className="h-4 w-4 rounded-sm bg-gray-100" />
        <div className="h-4 w-4 rounded-sm bg-green-200" />
        <div className="h-4 w-4 rounded-sm bg-green-400" />
        <div className="h-4 w-4 rounded-sm bg-green-600" />
        <span className="text-[10px] text-gray-400">多</span>
      </div>
    </div>
  )
}
