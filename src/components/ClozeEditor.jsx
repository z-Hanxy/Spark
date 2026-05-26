import { useState, useRef, useMemo, useEffect, useCallback } from 'react'

const CLOZE_REGEX = /\{\{(.+?)\}\}/g

export function parseClozeSegments(text) {
  if (!text) return [{ type: 'text', content: '' }]
  const segments = []
  let lastIdx = 0
  CLOZE_REGEX.lastIndex = 0
  let match
  while ((match = CLOZE_REGEX.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', content: text.slice(lastIdx, match.index) })
    }
    segments.push({ type: 'cloze', content: match[1] })
    lastIdx = CLOZE_REGEX.lastIndex
  }
  if (lastIdx < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIdx) })
  }
  return segments
}

export default function ClozeEditor({ value, onChange }) {
  const text = value || ''
  const [popup, setPopup] = useState(null)
  const renderRef = useRef(null)
  const containerRef = useRef(null)
  const selTimerRef = useRef(null)

  const segments = useMemo(() => parseClozeSegments(text), [text])

  // close popup on outside click/touch
  useEffect(() => {
    if (!popup) return
    const handler = () => setPopup(null)
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [popup])

  const showPopup = useCallback(() => {
    // give browser time to finalize selection (especially on touch)
    const delay = 'ontouchstart' in window ? 250 : 10
    if (selTimerRef.current) clearTimeout(selTimerRef.current)
    selTimerRef.current = setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setPopup(null)
        return
      }
      const selectedText = sel.toString().trim()
      if (!selectedText) { setPopup(null); return }

      // check if the anchorNode is inside a cloze span
      let node = sel.anchorNode
      let insideCloze = false
      let clozeContent = ''
      while (node && node !== renderRef.current) {
        if (node.nodeType === 1 && node.dataset?.cloze !== undefined) {
          insideCloze = true
          clozeContent = node.dataset.cloze
          break
        }
        node = node.parentNode
      }

      const range = sel.getRangeAt(0)
      if (!range) { setPopup(null); return }
      const rect = range.getBoundingClientRect()

      setPopup({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        text: selectedText,
        insideCloze,
        clozeContent,
      })
    }, delay)
  }, [])

  const handleCloze = (e) => {
    e.stopPropagation()
    if (!popup) return
    let newText = text

    if (popup.insideCloze) {
      newText = text.replace(`{{${popup.clozeContent}}}`, popup.clozeContent)
    } else {
      const idx = text.indexOf(popup.text)
      if (idx !== -1) {
        newText = text.slice(0, idx) + `{{${popup.text}}}` + text.slice(idx + popup.text.length)
      }
    }

    onChange(newText)
    setPopup(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleTextChange = (e) => {
    onChange(e.target.value)
    setPopup(null)
  }

  // cleanup timer
  useEffect(() => {
    return () => { if (selTimerRef.current) clearTimeout(selTimerRef.current) }
  }, [])

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* textarea for raw editing */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">文本内容</label>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder={'请输入整段内容，使用 {{文字}} 标记挖空，例如：\n中国四大发明是指{{造纸术}}、指南针、{{火药}}和印刷术。'}
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
        />
      </div>

      {/* rendered preview with selection support */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          预览 <span className="font-normal text-gray-400">（选中文字后点"设为挖空"添加高亮）</span>
        </label>
        <div
          ref={renderRef}
          onMouseUp={showPopup}
          onTouchEnd={showPopup}
          className="relative min-h-[3rem] touch-pan-y rounded-lg border border-gray-200 bg-white px-4 py-3 text-base leading-relaxed text-gray-800 select-text"
          style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
        >
          {segments.map((seg, i) =>
            seg.type === 'cloze' ? (
              <span
                key={i}
                data-cloze={seg.content}
                className="inline rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 font-medium cursor-pointer select-text"
                style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
              >
                {seg.content}
              </span>
            ) : (
              <span key={i}>{seg.content}</span>
            )
          )}

          {/* popup bubble */}
          {popup && (
            <div
              className="absolute z-30 -translate-x-1/2"
              style={{
                left: popup.x - (renderRef.current?.getBoundingClientRect().left || 0),
                top: popup.y - (renderRef.current?.getBoundingClientRect().top || 0)
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloze}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg border whitespace-nowrap transition-colors touch-manipulation ${
                  popup.insideCloze
                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {popup.insideCloze ? '取消挖空' : '设为挖空'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
