import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { usePosts, usePost, useFilteredPosts } from '../hooks/usePosts'
import { WPPost } from '../services/api'
import { useStore } from '../store/useStore'

type Props = {
  categoryName?: string
  searchTerm?: string
}

export const AllArticleGrid: React.FC<Props> = ({ categoryName, searchTerm }) => {
  // Use Zustand store
  const { isMobile, modalPostId, setModalPostId } = useStore()

  // Feature toggle: set to true to use in-app modal reader; false to open posts in a new tab
  const ENABLE_MODAL = false

  // React Query for posts - fetch different amounts based on device
  const { data: allPosts, isLoading: loading, error } = usePosts({
    per_page: isMobile ? 3 : 12 // 3 items on mobile, 12 on desktop
  })

  // React Query for single post modal
  const { data: modalPost, isLoading: modalLoading } = usePost(modalPostId || 0)
  const [toast, setToast] = React.useState<string | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const [animOpen, setAnimOpen] = React.useState(false)
  const isDark = React.useMemo(() => new URLSearchParams(window.location.search).get('theme') === 'dark', [])

  // Carousel settings - responsive
  const ITEMS_PER_SLIDE = isMobile ? 1 : 3 // 1 item per slide on mobile, 3 on desktop
  const MAX_ITEMS = isMobile ? 3 : 9 // Max 3 items on mobile, 9 on desktop

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

  // Use filtered posts
  const items = useFilteredPosts(allPosts, {
    categoryName,
    searchTerm,
    limit: MAX_ITEMS,
  })

  const findIndexById = (id: number) => items.findIndex(x => x.id === id)
  const gotoSibling = (dir: 1 | -1) => {
    if (!modalPost) return
    const idx = findIndexById(modalPost.id)
    if (idx < 0) return
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= items.length) return
    const nextPost = items[nextIdx]
    setModalPostId(nextPost.id)
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

  // Close modal
  const closeModal = () => {
    setModalPostId(null)
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

  // Skeleton component
  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton-thumb"></div>
      <div className="skeleton-body">
        <div className="skeleton-badge"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-title-short"></div>
        <div className="skeleton-excerpt"></div>
        <div className="skeleton-excerpt"></div>
        <div className="skeleton-meta"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  )

  // Handle loading state
  if (loading) {
    return (
      <div className="carousel-container">
        <div className="skeleton-grid">
          {Array.from({ length: isMobile ? 1 : 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <style jsx>{`
          .carousel-container {
            position: relative;
            margin: 16px 0;
          }

          .skeleton-grid {
            display: grid;
            grid-template-columns: repeat(${isMobile ? 1 : 3}, 1fr);
            gap: 16px;
          }

          .skeleton-card {
            background: #fff;
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .skeleton-thumb {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 200px;
          }

          .skeleton-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .skeleton-badge {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 20px;
            width: 80px;
            border-radius: 6px;
          }

          .skeleton-title {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 20px;
            width: 100%;
            border-radius: 4px;
          }

          .skeleton-title-short {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 20px;
            width: 70%;
            border-radius: 4px;
          }

          .skeleton-excerpt {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 16px;
            width: 100%;
            border-radius: 4px;
          }

          .skeleton-meta {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 14px;
            width: 60%;
            border-radius: 4px;
          }

          .skeleton-button {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 40px;
            width: 100%;
            border-radius: 999px;
            margin-top: 8px;
          }

          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }

          @media (max-width: 900px) {
            .skeleton-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .skeleton-thumb {
              height: 160px;
            }
          }

          @media (max-width: 600px) {
            .skeleton-grid {
              grid-template-columns: 1fr;
            }
            .skeleton-thumb {
              height: 200px;
            }
          }
        `}</style>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return <p className="muted">Terjadi kesalahan: {error.message}</p>
  }

  // Calculate total slides (3 items per slide)
  const totalSlides = Math.ceil(items.length / ITEMS_PER_SLIDE)
  const needsCarousel = items.length > ITEMS_PER_SLIDE // Only show carousel if more than 3 items

  // Group items into slides
  const slides = []
  for (let i = 0; i < totalSlides; i++) {
    slides.push(items.slice(i * ITEMS_PER_SLIDE, (i + 1) * ITEMS_PER_SLIDE))
  }

  const renderArticleCard = (p: WPPost) => (
    <article key={p.id} className="carousel-card">
      {getThumb(p) ? (
        <img className="carousel-thumb-img" src={getThumb(p)!} alt="" loading="lazy" />
      ) : (
        <div className="carousel-thumb" />
      )}
      <div className="carousel-body">
        <h3 className="carousel-title" dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
        {p.excerpt?.rendered && (
          <p className="carousel-excerpt">{stripHtml(p.excerpt.rendered).slice(0, 120)}…</p>
        )}
        <p className="carousel-meta">{formatDate(p.date)} • 4 min read</p>
        <a
          className="link"
          href={p.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={async (e) => {
            if (!ENABLE_MODAL) return
            try {
              e.preventDefault()
              setModalPostId(p.id)
            } catch (err) {
              window.open(p.link, '_blank', 'noopener,noreferrer')
              return
            }
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
  )

  return (
    <div className="carousel-container">
      {needsCarousel ? (
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          allowTouchMove={true}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          pagination={{
            el: '.swiper-pagination-custom',
            clickable: true,
          }}
          className="articles-swiper"
        >
          {slides.map((slideItems, slideIndex) => (
            <SwiperSlide key={slideIndex}>
              <div className="slide-grid">
                {slideItems.map(renderArticleCard)}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="static-grid">
          {items.map(renderArticleCard)}
        </div>
      )}

      {/* Custom Controls */}
      {needsCarousel && (
        <div className="carousel-controls">
          <div className="swiper-pagination-custom"></div>
          <div className="navigation-buttons">
            <button className="swiper-button-prev-custom">‹</button>
            <button className="swiper-button-next-custom">›</button>
          </div>
        </div>
      )}

      {/* Modal same as ArticleGrid */}
      {modalPost && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
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
                  <button onClick={() => gotoSibling(1)} disabled={findIndexById(modalPost.id) >= items.length - 1}
                    style={{ background: 'transparent', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}>Berikutnya</button>
                  <button onClick={shareCurrent}
                    style={{ background: isDark ? '#111827' : '#f3f4f6', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}>Bagikan</button>
                  <button
                    aria-label="Tutup"
                    onClick={closeModal}
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
                  <p className="carousel-meta" style={{ marginTop: 0 }}>{formatDate(modalPost.date)} • 4 min read</p>
                  <div className="modal-content" style={{ lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: (modalPost.content?.rendered || modalPost.excerpt?.rendered || '') }} />
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

      <style jsx>{`
        .carousel-container {
          position: relative;
          margin: 16px 0;
        }

        .articles-swiper {
          overflow: hidden;
          margin: 0 -8px;
        }

        .slide-grid, .static-grid {
          display: grid;
          grid-template-columns: repeat(${isMobile ? 1 : 3}, 1fr);
          gap: 16px;
          padding: 0 8px;
        }

        .carousel-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .carousel-thumb {
          background: linear-gradient(135deg,#bae6fd,#93c5fd);
          height: 200px;
        }

        .carousel-thumb-img {
          display: block;
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .carousel-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
        }

        .carousel-title {
          margin: 0 0 8px;
          font-size: 16px;
          line-height: 1.3;
        }

        .carousel-excerpt {
          margin: 0 0 10px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.4;
        }

        .carousel-meta {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 12px;
        }

        .carousel-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }

        .navigation-buttons {
          display: flex;
          gap: 8px;
        }

        .swiper-button-prev-custom,
        .swiper-button-next-custom {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border);
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.2s ease;
          color: inherit;
        }

        .swiper-button-prev-custom:hover,
        .swiper-button-next-custom:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .swiper-button-prev-custom:disabled,
        .swiper-button-next-custom:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Custom pagination styles */
        .swiper-pagination-custom {
          display: flex;
          gap: 0px;
          align-items: center;
        }

        :global(.swiper-pagination-custom .swiper-pagination-bullet) {
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          border: none !important;
          background: #d1d5db !important;
          cursor: pointer;
          transition: all 0.3s ease !important;
          opacity: 1 !important;
          transform: scale(1) !important;
          margin: 0 !important;
        }

        :global(.swiper-pagination-custom .swiper-pagination-bullet-active) {
          background: #1e40af !important;
          width: 20px !important;
          height: 20px !important;
        }

        :global(.swiper-pagination-custom .swiper-pagination-bullet:hover) {
          background: #9ca3af !important;
        }

        :global(.swiper-pagination-custom .swiper-pagination-bullet-active:hover) {
          background: #1e40af !important;
        }

        .swiper-pagination-custom .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
        }

        .swiper-pagination-custom .swiper-pagination-bullet-active {
          width: 20px;
          height: 20px;
          background-color: #1A2080;
        }
          

        @media (max-width: 900px) {
          .slide-grid, .static-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .carousel-thumb,
          .carousel-thumb-img {
            height: 160px;
          }
        }

        @media (max-width: 600px) {
          .slide-grid, .static-grid {
            grid-template-columns: 1fr;
          }

          .carousel-thumb,
          .carousel-thumb-img {
            height: 200px;
          }

          .carousel-controls {
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }

          .swiper-button-prev-custom,
          .swiper-button-next-custom {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}