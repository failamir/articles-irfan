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

  React.useEffect(() => {
    if (!isControlled && defaultActive) setInternal(defaultActive)
  }, [defaultActive, isControlled])

  return (
    <div className="tabs">
      <div className="tab-list" role="tablist" aria-label="Kategori Artikel">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={tab.id}
            id={`btn-${tab.id}`}
            className={`tab-btn ${active === tab.id ? 'active' : ''}`}
            onClick={() => { if (!isControlled) setInternal(tab.id); onChange?.(tab.id) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
