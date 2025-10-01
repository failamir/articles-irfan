import React from 'react'

type Tab = { id: string; label: string }

export const Tabs: React.FC<{
  tabs: Tab[];
  defaultActive?: string;
  value?: string;
  onChange?: (id: string) => void;
}> = ({ tabs, defaultActive, value, onChange }) => {
  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState<string>(defaultActive ?? tabs[0]?.id)
  const active = isControlled ? (value as string) : internal

  // Horizontal scroll management for the tab list
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const btnRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const [canScrollRight, setCanScrollRight] = React.useState(false)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)

  const updateScrollState = React.useCallback(() => {
    const el = listRef.current
    if (!el) return
    const remaining = el.scrollWidth - (el.scrollLeft + el.clientWidth)
    setCanScrollRight(remaining > 8)
    setCanScrollLeft(el.scrollLeft > 8)
  }, [])

  React.useEffect(() => {
    updateScrollState()
    const el = listRef.current
    if (!el) return
    const onScroll = () => updateScrollState()
    el.addEventListener('scroll', onScroll)
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  // Ensure the active tab is centered into view
  React.useEffect(() => {
    const container = listRef.current
    const el = active ? btnRefs.current[active] : null
    if (!container || !el) return
    const elLeft = el.offsetLeft
    const elWidth = el.offsetWidth
    const containerWidth = container.clientWidth
    let target = elLeft - (containerWidth - elWidth) / 2
    const max = container.scrollWidth - container.clientWidth
    if (target < 0) target = 0
    if (target > max) target = max
    container.scrollTo({ left: target, behavior: 'smooth' })
  }, [active, tabs])

  const scrollRight = () => {
    const el = listRef.current
    if (!el) return
    el.scrollBy({ left: Math.max(160, el.clientWidth * 0.6), behavior: 'smooth' })
  }

  const scrollLeft = () => {
    const el = listRef.current
    if (!el) return
    el.scrollBy({ left: -Math.max(160, el.clientWidth * 0.6), behavior: 'smooth' })
  }

  React.useEffect(() => {
    if (!isControlled && defaultActive) setInternal(defaultActive)
  }, [defaultActive, isControlled])

  return (
    <div className="tabs">
      <div
        className="tab-list"
        role="tablist"
        aria-label="Kategori Artikel"
        ref={listRef}
        style={{ overflowX: 'auto', whiteSpace: 'nowrap', scrollBehavior: 'smooth', display: 'flex', flexWrap: 'nowrap', gap: 8, paddingRight: 44, paddingLeft: 44 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={tab.id}
            id={`btn-${tab.id}`}
            className={`tab-btn ${active === tab.id ? 'active' : ''}`}
            ref={(el) => { btnRefs.current[tab.id] = el }}
            onClick={() => { if (!isControlled) setInternal(tab.id); onChange?.(tab.id) }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* gradients removed as requested */}
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll kiri"
          className="tabs-scroll-left"
          onClick={scrollLeft}
        >
          <span aria-hidden>←</span>
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll kanan"
          className="tabs-scroll-right"
          onClick={scrollRight}
        >
          <span aria-hidden>→</span>
        </button>
      )}

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={tab.id}
          aria-labelledby={`btn-${tab.id}`}
          hidden={active !== tab.id}
          className="tab-panel"
        >
          <p className="muted">Konten untuk: {tab.label}</p>
        </div>
      ))}
    </div>
  )
}
