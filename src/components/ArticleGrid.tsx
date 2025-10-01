import React from 'react'
import { API_URLS } from '../constants/api'
import { usePosts, usePostsByCategory, useFilteredPosts } from '../hooks/usePosts'
import type { WPPost } from '../services/api'

// Feature toggle: set to true to use in-app modal reader; false to open posts in a new tab
const ENABLE_MODAL = false

type Props = {
  categoryId?: number
  categoryName?: string
  limit?: number
  searchTerm?: string
}

export const ArticleGrid: React.FC<Props> = ({ categoryId, categoryName, limit, searchTerm }) => {
  // Data fetching via React Query
  const {
    data: apiPosts,
    isLoading: loading,
    error,
  } = categoryId
    ? usePostsByCategory(categoryId, { per_page: 10 })
    : usePosts({ per_page: 10 })

  const posts = useFilteredPosts(apiPosts, { categoryName: categoryId ? undefined : categoryName, searchTerm, limit: undefined })
  const [modalPost, setModalPost] = React.useState<WPPost | null>(null)
  const [modalLoading, setModalLoading] = React.useState(false)
  const [toast, setToast] = React.useState<string | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const [animOpen, setAnimOpen] = React.useState(false)
  const isDark = React.useMemo(() => new URLSearchParams(window.location.search).get('theme') === 'dark', [])

  // When modal open/close or loading changes, ask parent to resize iframe
  React.useEffect(() => {
    const sendHeight = () => {
      try {
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
          window.parent.postMessage({ type: 'REACT_APP_HEIGHT', height, isExpanded: true }, '*')
        }
      } catch {}
    }
    // Post now and shortly after to ensure images/content settled
    sendHeight()
    const t = setTimeout(sendHeight, 500)
    return () => clearTimeout(t)
  }, [modalPost, modalLoading])

  // Observe size changes of the modal panel to keep parent height in sync
  React.useEffect(() => {
    if (!modalPost || !panelRef.current) return
    const send = () => {
      try {
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
          window.parent.postMessage({ type: 'REACT_APP_HEIGHT', height, isExpanded: true }, '*')
        }
      } catch {}
    }
    const ro = new ResizeObserver(() => send())
    ro.observe(panelRef.current)
    const timer = setInterval(send, 1500)
    return () => { ro.disconnect(); clearInterval(timer) }
  }, [modalPost])

  // Close with ESC
  React.useEffect(() => {
    if (!modalPost) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalPost(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalPost])

  // Animate open
  React.useEffect(() => {
    if (modalPost) {
      requestAnimationFrame(() => setAnimOpen(true))
    } else {
      setAnimOpen(false)
    }
  }, [modalPost])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const findIndexById = (id: number) => posts.findIndex(x => x.id === id)
  const gotoSibling = async (dir: 1 | -1) => {
    if (!modalPost) return
    const idx = findIndexById(modalPost.id)
    if (idx < 0) return
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= posts.length) return
    const base = posts[nextIdx]
    setModalLoading(true)
    try {
      if (!base.content || !base.content.rendered) {
        const res = await fetch(API_URLS.getSinglePost(base.id))
        if (res.ok) {
          const full = await res.json()
          setModalPost(full as WPPost)
        } else {
          setModalPost(base)
        }
      } else {
        setModalPost(base)
      }
    } finally {
      setModalLoading(false)
    }
  }

  const shareCurrent = async () => {
    if (!modalPost) return
    const url = modalPost.link
    const title = stripHtml(modalPost.title?.rendered || 'Artikel')
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        showToast('Tautan disalin')
      } else {
        const ta = document.createElement('textarea')
        ta.value = url
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        showToast('Tautan disalin')
      }
    } catch {}
  }


  const getThumb = (p: WPPost) => p._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const getCategory = (p: WPPost) => {
    const terms = p._embedded?.['wp:term']?.flat() || []
    const cat = terms.find(t => t.taxonomy === 'category')
    return cat?.name || 'Artikel'
  }

  const stripHtml = (html?: string) => {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').trim()
  }

  const formatDate = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch {
      return ''
    }
  }

  if (loading) return <p className="muted">Memuat artikel…</p>
  if (error) return <p className="muted">Terjadi kesalahan: {error.message}</p>

  // Apply client-side limit last
  const items = (limit ? posts.slice(0, limit) : posts)

  return (
    <div className="grid">
      {items.map((p) => (
        <article key={p.id} className="grid-card">
          {getThumb(p) ? (
            <img className="grid-thumb-img" src={getThumb(p)!} alt="" loading="lazy" />
          ) : (
            <div className="grid-thumb" />
          )}
          <div className="grid-body">
            <p className="badge">{getCategory(p)}</p>
            <h3 className="grid-title" dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
            {p.excerpt?.rendered && (
              <p className="grid-excerpt">{stripHtml(p.excerpt.rendered).slice(0, 120)}…</p>
            )}
            <p className="grid-meta">{formatDate(p.date)} • 4 min read</p>
            <a
              className="link"
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={async (e) => {
                // If modal feature is disabled, let the default behavior open a new tab
                if (!ENABLE_MODAL) return
                try {
                  e.preventDefault()
                  setModalLoading(true)
                  // If content already present, open directly; else fetch the single post for full content
                  if (!p.content || !p.content.rendered) {
                    const res = await fetch(API_URLS.getSinglePost(p.id))
                    if (res.ok) {
                      const full = await res.json()
                      setModalPost(full as WPPost)
                    } else {
                      // Fallback: open external if fetch fails
                      window.open(p.link, '_blank', 'noopener,noreferrer')
                      return
                    }
                  } else {
                    setModalPost(p)
                  }
                } catch (err) {
                  // If anything goes wrong, fall back to navigating
                  window.open(p.link, '_blank', 'noopener,noreferrer')
                  return
                } finally {
                  setModalLoading(false)
                }
                // Try notifying parent to adjust iframe height
                try {
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
                    window.parent.postMessage({ type: 'REACT_APP_HEIGHT', height, isExpanded: true }, '*')
                  }
                } catch {}
              }}
            >
              Baca selengkapnya
            </a>
          </div>
        </article>
      ))}
      {modalPost && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalPost(null)
          }}
          style={{
            position: 'fixed', inset: 0,
            background: isDark ? '#0b0f14' : '#ffffff',
            display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', zIndex: 9999,
            opacity: animOpen ? 1 : 0,
            transition: 'opacity 180ms ease',
          }}
        >
          <div
            className="modal-panel"
            ref={panelRef}
            style={{
              background: isDark ? '#0b0f14' : '#fff', width: '100%', height: '100vh',
              color: isDark ? '#e6edf3' : '#111827',
              overflow: 'auto', WebkitOverflowScrolling: 'touch' as any,
              transform: animOpen ? 'translateY(0)' : 'translateY(8px)',
              transition: 'transform 220ms ease',
            }}
          >
            <div style={{ position: 'sticky', top: 0, zIndex: 2, background: isDark ? '#0b0f14' : '#fff', borderBottom: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', gap: 8 }}>
                <h3 style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: modalPost.title?.rendered || 'Artikel' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => gotoSibling(-1)} disabled={findIndexById(modalPost.id) <= 0}
                    style={{ background: 'transparent', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}>Sebelumnya</button>
                  <button onClick={() => gotoSibling(1)} disabled={findIndexById(modalPost.id) >= posts.length - 1}
                    style={{ background: 'transparent', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}>Berikutnya</button>
                  <button onClick={shareCurrent}
                    style={{ background: isDark ? '#111827' : '#f3f4f6', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}>Bagikan</button>
                  <button
                    aria-label="Tutup"
                    onClick={() => setModalPost(null)}
                    style={{ background: 'transparent', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}
                  >Tutup ✕</button>
                </div>
              </div>
            </div>
            <div style={{ padding: 16, maxWidth: 860, margin: '0 auto' }}>
              {modalLoading ? (
                <p>Memuat…</p>
              ) : (
                <div>
                  {getThumb(modalPost) && (
                    <img src={getThumb(modalPost)!} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} onLoad={() => setModalLoading(false)} />
                  )}
                  <p className="badge" style={{ marginBottom: 8 }}>{getCategory(modalPost)}</p>
                  <p className="grid-meta" style={{ marginTop: 0 }}>{formatDate(modalPost.date)} • 4 min read</p>
                  <div className="modal-content" style={{ lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: (modalPost.content?.rendered || modalPost.excerpt?.rendered || '') }} />
                  {/* Content styles */}
                  <style>
                    {`
                    .modal-content h1,.modal-content h2,.modal-content h3{margin:1.2em 0 .6em}
                    .modal-content p{margin:0 0 1em}
                    .modal-content img{max-width:100%;height:auto;border-radius:8px;margin:12px 0}
                    .modal-content ul{padding-left:1.25rem;margin:0 0 1em}
                    .modal-content ol{padding-left:1.25rem;margin:0 0 1em}
                    .modal-content blockquote{border-left:4px solid #e5e7eb;padding:.5em 1em;margin:1em 0;color:#4b5563}
                    ${isDark ? `.modal-content blockquote{border-left-color:#374151;color:#9ca3af}` : ''}
                    .modal-content a{color:#2563eb;text-decoration:underline}
                    ${isDark ? `.modal-content a{color:#60a5fa}` : ''}
                    `}
                  </style>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', borderRadius: 9999, padding: '8px 14px', fontSize: 14, zIndex: 10000, opacity: 0.95 }}>{toast}</div>
      )}
    </div>
  )
}
