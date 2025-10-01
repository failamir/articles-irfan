import React from 'react'
import { Tabs } from './components/Tabs'
import { ArticleGrid } from './components/ArticleGrid'
import { AllArticleGrid } from './components/AllArticleGrid'
import { useCategoriesAsTabs, useCategories } from './hooks/usePosts'
import { useStore } from './store/useStore'

export default function App() {
  const [activeTab, setActiveTab] = React.useState('all')
  const [query, setQuery] = React.useState('')

  // Use Zustand store
  const {
    isMobile,
    setIsMobile,
    latestExpanded,
    setLatestExpanded,
    categoryExpanded,
    setCategoryExpanded
  } = useStore()

  // Get dynamic tabs from WordPress categories
  const { tabs, isLoading: tabsLoading, error: tabsError } = useCategoriesAsTabs()

  // Get all categories for carousel sections
  const { data: categories } = useCategories()

  // Track expanded state for the current category tab
  const isCategoryExpanded = React.useMemo(() => !!categoryExpanded[activeTab], [categoryExpanded, activeTab])

  // Set up mobile detection
  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 600)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [setIsMobile])

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

  const categoryFromTab = (id: string): string | undefined => {
    if (id === 'all') return undefined // Show all articles

    // Find category name from tabs
    const tab = tabs.find(t => t.id === id)
    return tab?.label
  }

  // Sync with URL hash
  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && tabs.some(t => t.id === hash)) {
      setActiveTab(hash)
    }
    const onHashChange = () => {
      const h = window.location.hash.replace('#', '')
      if (h && tabs.some(t => t.id === h)) setActiveTab(h)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [tabs])

  React.useEffect(() => {
    if (window.location.hash.replace('#','') !== activeTab) {
      history.replaceState(null, '', `#${activeTab}`)
    }
  }, [activeTab])

  // Reset category expanded when switching tabs
  React.useEffect(() => {
    // Note: Individual category expanded states are managed in Zustand store
    // No need to reset here as each category has its own state
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
          setLatestExpanded(!latestExpanded)
        }
        if (event.data.type === 'IFRAME_READY') {
          // Parent indicates iframe wrapper is ready; send current height
          const height = document.documentElement.scrollHeight
          if (window.self !== window.top) {
            console.log('[RAD][React] parent ready detected, posting current height', { height, latestExpanded })
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
              <div className="tabs-skeleton">
                <div className="skeleton-tab"></div>
                <div className="skeleton-tab"></div>
                <div className="skeleton-tab"></div>
                <div className="skeleton-tab"></div>
              </div>
            ) : tabsError ? (
              <div className="tabs-error">Error loading categories</div>
            ) : (
              <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
            )}

            <form className="searchbar" role="search" onSubmit={(e) => e.preventDefault()}>
              <input
                className="search-input"
                type="search"
                placeholder="Cari topik, treatment, atau tips..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          </div>
        </section>

        {activeTab === 'all' && (
          <section aria-labelledby="featured-articles" className="articles-section">
            <div className="section-head">
              <h2 id="featured-articles">Artikel Terbaru</h2>
            </div>
            <AllArticleGrid searchTerm={query} />
          </section>
        )}

        {activeTab !== 'all' && (
          <section aria-labelledby="category-section" className="articles-section fade-in">
            <div className="section-head">
              <h2 id="category-section">{categories?.find(c => c.slug === activeTab)?.name || categoryFromTab(activeTab)}</h2>
              <a
                href={`https://sozo.treonstudio.com/category/${activeTab}`}
                className="see-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lihat Semua
              </a>
            </div>
            <ArticleGrid
              categoryId={categories?.find(c => c.slug === activeTab)?.id}
              searchTerm={query}
              limit={3}
            />
          </section>
        )}
      </main>
    </div>
  )
}
