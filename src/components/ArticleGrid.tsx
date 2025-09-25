import React from 'react'

// Shapes from WP REST API when using ?_embed
type WPPost = {
  id: number
  link: string
  date?: string
  title: { rendered: string }
  excerpt?: { rendered: string }
  categories?: number[]
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string }>
    'wp:term'?: Array<Array<{ taxonomy: string; name: string }>>
  }
}

const API_URL = 'https://sozo.treonstudio.com//wp-json/wp/v2/posts?_embed&per_page=12'

type Props = {
  categoryName?: string
  limit?: number
  searchTerm?: string
}

let CACHE: WPPost[] | null = null
let CACHE_ERR: string | null = null

export const ArticleGrid: React.FC<Props> = ({ categoryName, limit, searchTerm }) => {
  const [posts, setPosts] = React.useState<WPPost[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const ctrl = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        if (!CACHE && !CACHE_ERR) {
          const res = await fetch(API_URL, { signal: ctrl.signal })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          CACHE = await res.json()
        }
        if (CACHE_ERR) throw new Error(CACHE_ERR)
        setPosts(CACHE || [])
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          const msg = e.message || 'Gagal memuat artikel'
          CACHE_ERR = msg
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => ctrl.abort()
  }, [])

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
  if (error) return <p className="muted">Terjadi kesalahan: {error}</p>

  // Filter and limit
  let items = posts
  if (categoryName) {
    items = posts.filter((p) => {
      const terms = p._embedded?.['wp:term']?.flat() || []
      return terms.some(t => t.taxonomy === 'category' && t.name?.toLowerCase() === categoryName.toLowerCase())
    })
  }
  if (searchTerm) {
    const q = searchTerm.toLowerCase().trim()
    if (q) {
      items = items.filter((p) => {
        const title = (p.title?.rendered || '').toLowerCase()
        const excerpt = stripHtml(p.excerpt?.rendered || '').toLowerCase()
        return title.includes(q) || excerpt.includes(q)
      })
    }
  }
  if (limit) items = items.slice(0, limit)

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
            <a className="link" href={p.link} target="_blank" rel="noreferrer">Baca selengkapnya</a>
          </div>
        </article>
      ))}
    </div>
  )
}
