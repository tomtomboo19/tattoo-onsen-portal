import React, { useState } from 'react'

type Filters = Record<string, string[]>

const DEFAULT_OPTIONS: Record<string, string[]> = {
  '性別': ['男性が入れる', '女性が入れる'],
  '男女で入れる': ['裸で入れる', '水着着用', '館内着'],
  '主なカテゴリ': ['温泉', 'サウナ'],
  '施設タイプ': [
    '温浴施設', '銭湯', 'ホテル・旅館', 'カプセルホテル', '一棟貸し宿泊施設', 'ゴルフ場',
    'スポーツジム', 'プライベートサウナ', 'キャンプ場', 'ラブホテル', 'その他'
  ],
  '利用タイプ': ['日帰り入浴可', '宿泊者のみ', '会員のみ'],
  '宿泊': ['宿泊予約有り'],
  'サウナタイプ': ['ドライサウナ', '塩サウナ', 'スチームサウナ', 'ミストサウナ', '薬草サウナ', '韓国式サウナ']
}

export default function FilterModal({
  open,
  initial = {},
  onApply,
  onClose,
  focusCategory,
}: {
  open: boolean
  initial?: Filters
  onApply: (selected: Filters) => void
  onClose: () => void
  focusCategory?: string | null
}) {
  const [selected, setSelected] = useState<Filters>(initial)
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

  React.useEffect(() => {
    setSelected(initial)
  }, [initial, open])

  React.useEffect(() => {
    if (!open || !focusCategory) return
    const el = sectionRefs.current[focusCategory]
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('highlight')
        setTimeout(() => el.classList.remove('highlight'), 1400)
      }, 80)
    }
  }, [open, focusCategory])

  if (!open) return null

  function toggle(category: string, value: string) {
    setSelected(prev => {
      const cur = prev[category] ?? []
      const exists = cur.includes(value)
      const next = exists ? cur.filter(x => x !== value) : [...cur, value]
      return { ...prev, [category]: next }
    })
  }

  function clearCategory(category: string) {
    setSelected(prev => ({ ...prev, [category]: [] }))
  }

  function handleApply() {
    onApply(selected)
  }

  return (
    <div className="filter-modal-backdrop" onClick={onClose}>
      <div className="filter-modal-card" onClick={e => e.stopPropagation()}>
        <div className="filter-modal-header">
          <h3>条件絞り込み</h3>
          <button className="filter-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="filter-modal-body">
          {Object.entries(DEFAULT_OPTIONS).map(([category, options]) => (
            <div
              key={category}
              className="filter-section"
              ref={el => (sectionRefs.current[category] = el)}
            >
              <div className="filter-section-header">
                <strong>{category}</strong>
                <button className="btn small" onClick={() => clearCategory(category)} type="button">クリア</button>
              </div>
              <div className="filter-grid">
                {options.map(opt => {
                  const checked = (selected[category] ?? []).includes(opt)
                  return (
                    <label key={opt} className="filter-option">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(category, opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="filter-modal-footer">
          <button className="btn" onClick={handleApply}>適用</button>
          <button className="btn" onClick={onClose} style={{ marginLeft: 8 }}>閉じる</button>
        </div>
      </div>
    </div>
  )
}
