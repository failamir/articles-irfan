import React from 'react'
import { Tabs } from './components/Tabs'
import { ArticleGrid } from './components/ArticleGrid'
import { useCategoriesAsTabs } from './hooks/usePosts'

export default function App() {
  // Build tabs dynamically from WP categories API
  const { tabs, isLoading: tabsLoading, error: tabsError } = useCategoriesAsTabs()
  const [activeTab, setActiveTab] = React.useState('all')
  const [query, setQuery] = React.useState('')
  const [latestExpanded, setLatestExpanded] = React.useState(false)
  const [categoryExpanded, setCategoryExpanded] = React.useState(false)

  const parentOrigin = React.useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const fromParam = params.get('wpOrigin') || params.get('parent')
      if (fromParam) return new URL(fromParam).origin
    } catch {}
    try {
      if (document.referrer) return new URL(document.referrer).origin
    } catch {}
    // Optional: fallback to env if provided
    // @ts-ignore
    const envOrigin = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WP_ORIGIN) ? import.meta.env.VITE_WP_ORIGIN : ''
    if (envOrigin) {
      try { return new URL(envOrigin).origin } catch {}
    }
    return ''
  }, [])

  const postHeightToWordPress = React.useCallback((height: number, isExpanded: boolean) => {
    try {
      if (!parentOrigin) {
        console.warn('[RAD][React] cannot POST to WP because parentOrigin is unknown')
        return
      }
      const url = parentOrigin.replace(/\/$/, '') + '/wp-json/react-articles/v1/height'
      const payload = { height: Math.round(height), isExpanded, ts: String(Date.now()) }
      console.log('[RAD][React] POST to WP', { url, payload })
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}))
          console.log('[RAD][React] WP REST response', { status: res.status, data })
        })
        .catch((err) => {
          console.error('[RAD][React] WP REST POST error', err)
        })
    } catch (e) {
      console.error('[RAD][React] WP REST POST exception', e)
    }
  }, [parentOrigin])

  const getCategoryNameByTab = (id: string): string | undefined => {
    if (!tabs || !tabs.length) return undefined
    if (id === 'all') return undefined
    const t = tabs.find(t => t.id === id)
    return t?.label
  }

  // Sync with URL hash using dynamic tab IDs
  React.useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (!hash) return
      // Only apply if hash exists in current tabs
      if (tabs && tabs.some(t => t.id === hash)) {
        setActiveTab(hash)
      }
    }
    applyHash()
    const onHashChange = () => applyHash()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [tabs])

  React.useEffect(() => {
    if (window.location.hash.replace('#','') !== activeTab) {
      history.replaceState(null, '', `#${activeTab}`)
    }
  }, [activeTab])

  // Ensure activeTab is valid when tabs change
  React.useEffect(() => {
    if (!tabs || tabs.length === 0) return
    const currentValid = tabs.some(t => t.id === activeTab) || activeTab === 'all'
    if (!currentValid) {
      setActiveTab(tabs[0]?.id || 'all')
    }
  }, [tabs])

  // Reset category expanded when switching tabs
  React.useEffect(() => {
    setCategoryExpanded(false)
  }, [activeTab])

  // Listen for messages from parent (WordPress) to toggle expansion
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Optionally validate origin
      // if (event.origin !== 'https://YOUR_WORDPRESS_DOMAIN') return;
      console.log('[RAD][React] message received from parent:', {
        origin: event.origin,
        data: event.data,
      })
      // if (event.origin !== 'https://sozo.treonstudio.com') {
      //   console.log('[RAD][React] ignored message due to origin mismatch')
      //   return
      // }

      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'TOGGLE_EXPAND') {
          console.log('[RAD][React] toggling latestExpanded via parent request')
          setLatestExpanded((prev: boolean): boolean => !prev)
        }
        if (event.data.type === 'IFRAME_READY') {
          // Parent indicates iframe wrapper is ready; send current height
          const height = document.documentElement.scrollHeight
          if (window.self !== window.top) {
            window.parent.postMessage({
              type: 'REACT_APP_HEIGHT',
              height,
              isExpanded: latestExpanded,
            }, parentOrigin)
          }
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [latestExpanded])

  // Send height to parent whenever latestExpanded changes (only when embedded),
  // but always POST to WordPress if parentOrigin is known
  React.useEffect(() => {
    const doWork = () => {
      const sendHeight = () => {
        const doc = document
        const height = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight,
          doc.documentElement.offsetHeight,
          doc.body.clientHeight,
          doc.documentElement.clientHeight,
        )
        if (window.self !== window.top) {
          console.log('[RAD][React] posting height to parent', { height, latestExpanded, parentOrigin })
          window.parent.postMessage({ type: 'REACT_APP_HEIGHT', height, isExpanded: latestExpanded }, parentOrigin || '*')
        } else {
          console.log('[RAD][React] not embedded, skipping postMessage, will still POST to WP if parentOrigin known')
        }
        // Also notify WordPress via REST for server-side observability
        postHeightToWordPress(height, latestExpanded)
      }
      sendHeight()
      const timer = setTimeout(sendHeight, 500)
      return () => clearTimeout(timer)
    }
    return doWork()
  }, [latestExpanded, activeTab, query])

  return (
    <div className="container">
      <main>
        <section className="hub-hero" aria-label="Knowledge Hub">
          <h1 className="hub-title">Explore Our Beauty Knowledge Hub</h1>
          <p className="hub-desc">Temukan artikel yang tepat untuk kebutuhan kecantikan Anda dari koleksi 200+ artikel yang ditulis oleh para expert</p>

          <div className="hub-controls">
            {tabsLoading ? (
              <div className="tabs-skeleton" aria-hidden>
                <div className="skeleton-tab" />
                <div className="skeleton-tab" />
                <div className="skeleton-tab" />
                <div className="skeleton-tab" />
              </div>
            ) : tabsError ? (
              <div className="tabs-error">Gagal memuat kategori</div>
            ) : (
              <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
            )}

            <form className="searchbar" role="search" onSubmit={(e: React.FormEvent) => e.preventDefault()}>
              <input
                className="search-input"
                type="search"
                placeholder="Cari topik, treatment, atau tips..."
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              />
            </form>
          </div>
        </section>

        {activeTab === 'all' && (
          <section aria-labelledby="artikel-terbaru" className="articles-section">
            <div className="section-head">
              <h2 id="artikel-terbaru">Artikel Terbaru</h2>
              <a href="#" className="see-all" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                setLatestExpanded((v: boolean) => !v)
                // Immediately post height after toggle using rAF to wait for DOM update
                const postSoon = () => {
                  const doc = document
                  const height = Math.max(
                    doc.body.scrollHeight,
                    doc.documentElement.scrollHeight,
                    doc.body.offsetHeight,
                    doc.documentElement.offsetHeight,
                    doc.body.clientHeight,
                    doc.documentElement.clientHeight,
                  )
                  if (window.self !== window.top) {
                    console.log('[RAD][React] immediate post after click -> postMessage', { height, parentOrigin })
                    window.parent.postMessage({ type: 'REACT_APP_HEIGHT', height, isExpanded: !latestExpanded }, parentOrigin || '*')
                  } else {
                    console.log('[RAD][React] immediate post after click (not embedded)')
                  }
                  // Always also POST to WordPress for observability
                  postHeightToWordPress(height, !latestExpanded)
                }
                if (typeof requestAnimationFrame === 'function') {
                  requestAnimationFrame(() => requestAnimationFrame(postSoon))
                } else {
                  setTimeout(postSoon, 0)
                }
              }}>
                {latestExpanded ? 'Tutup' : 'Lihat Semua'}
              </a>
            </div>
            <ArticleGrid
              searchTerm={query}
              limit={latestExpanded ? undefined : 8}
              sliderMode={!latestExpanded}
            />
          </section>
        )}

        {activeTab !== 'all' && (
          <section aria-labelledby="category-section" className="articles-section fade-in">
            <div className="section-head">
              <h2 id="category-section">{getCategoryNameByTab(activeTab)}</h2>
              <a href="#" className="see-all" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); setCategoryExpanded((v: boolean) => !v) }}>
                {categoryExpanded ? 'Tutup' : 'Lihat Semua'}
              </a>
            </div>
            <ArticleGrid categoryName={getCategoryNameByTab(activeTab)} limit={categoryExpanded ? undefined : 3} />
          </section>
        )}
      </main>
    </div>
  )
}
