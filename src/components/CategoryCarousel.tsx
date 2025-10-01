import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { usePostsByCategory, useFilteredPosts } from '../hooks/usePosts'
import { WPPost } from '../services/api'
import { useStore } from '../store/useStore'

type Props = {
  categoryId: number
  categorySlug: string
  categoryName: string
  searchTerm?: string
}

export const CategoryCarousel: React.FC<Props> = ({ categoryId, categorySlug, categoryName, searchTerm }) => {
  const { isMobile, categoryExpanded, setCategoryExpanded, setModalPostId } = useStore()

  // Feature toggle: set to true to use in-app modal reader; false to open posts in a new tab
  const ENABLE_MODAL = false

  // Get expansion state for this specific category
  const isExpanded = categoryExpanded[categorySlug] || false

  // Fetch posts for this category
  const { data: allPosts, isLoading: loading, error } = usePostsByCategory(categoryId, {
    per_page: 10 // Only fetch 3 items for category sections
  })

  // Carousel settings - responsive
  const ITEMS_PER_SLIDE = isMobile ? 1 : 3
  const MAX_ITEMS = 10 // Maximum 3 items for category sections

  // Use filtered posts (for search)
  const items = useFilteredPosts(allPosts, {
    searchTerm,
    limit: MAX_ITEMS,
  })

  // Show carousel on mobile (1 item per slide), static grid on desktop
  const needsCarousel = isMobile && items.length > 1

  // Group items into slides for mobile carousel
  const slides = []
  if (needsCarousel) {
    for (let i = 0; i < items.length; i++) {
      slides.push([items[i]]) // 1 item per slide on mobile
    }
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
        <div className="skeleton-title"></div>
        <div className="skeleton-title-short"></div>
        <div className="skeleton-excerpt"></div>
        <div className="skeleton-excerpt"></div>
        <div className="skeleton-meta"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  )

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
          onClick={(e) => {
            if (!ENABLE_MODAL) return
            e.preventDefault()
            setModalPostId(p.id)
          }}
        >
          Baca selengkapnya
        </a>
      </div>
    </article>
  )

  // Handle loading state
  if (loading) {
    return (
      <section className="category-section">
        <div className="section-head">
          <h2>{categoryName}</h2>
        </div>
        <div className="carousel-container">
          <div className="skeleton-grid">
            {Array.from({ length: isMobile ? 1 : 3 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
        <style>{`
          .category-section {
            margin: 24px 0;
          }
          .section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }
          .section-head h2 {
            margin: 0;
            font-size: 20px;
          }
          .carousel-container {
            position: relative;
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
            height: 160px;
          }
          .skeleton-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .skeleton-title, .skeleton-title-short, .skeleton-excerpt, .skeleton-meta, .skeleton-button {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
          .skeleton-title {
            height: 18px;
            width: 100%;
          }
          .skeleton-title-short {
            height: 18px;
            width: 70%;
          }
          .skeleton-excerpt {
            height: 14px;
            width: 100%;
          }
          .skeleton-meta {
            height: 12px;
            width: 60%;
          }
          .skeleton-button {
            height: 36px;
            width: 100%;
            border-radius: 999px;
            margin-top: 8px;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </section>
    )
  }

  // Handle error state
  if (error) {
    return (
      <section className="category-section">
        <div className="section-head">
          <h2>{categoryName}</h2>
        </div>
        <p className="muted">Terjadi kesalahan: {error.message}</p>
      </section>
    )
  }

  // Don't render if no items
  if (!items.length) {
    return null
  }

  return (
    <section className="category-section">
      <div className="section-head">
        <h2>{categoryName}</h2>
        <div className="section-actions">
          <a
            href={`https://sozo.treonstudio.com/category/${categorySlug}`}
            className={`see-all category-link ${needsCarousel ? 'desktop-only' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Lihat Semua
          </a>
        </div>
      </div>

      <div className="carousel-container">
        {needsCarousel ? (
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            allowTouchMove={true}
            navigation={{
              nextEl: `.swiper-button-next-${categorySlug}`,
              prevEl: `.swiper-button-prev-${categorySlug}`,
            }}
            pagination={{
              el: `.swiper-pagination-${categorySlug}`,
              clickable: true,
            }}
            className="category-swiper"
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

        {/* Custom Controls for Mobile Carousel */}
        {needsCarousel && (
          <div className="carousel-controls">
            <div className={`swiper-pagination-${categorySlug}`}></div>
            <div className="navigation-buttons">
              <button className={`swiper-button-prev-${categorySlug}`}>‹</button>
              <button className={`swiper-button-next-${categorySlug}`}>›</button>
            </div>
          </div>
        )}

        {/* Mobile Lihat Semua Button */}
        {needsCarousel && (
          <div className="mobile-see-all">
            <a
              href={`https://sozo.treonstudio.com/category/${categorySlug}`}
              className="see-all category-link mobile-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lihat Semua
            </a>
          </div>
        )}
      </div>

      <style>{`
        .category-section {
          margin: 0 0 3rem 0;
        }

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .section-head h2 {
          margin: 0;
          font-size: 20px;
        }

        .section-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .see-all {
          color: var(--brand);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          transition: all 0.2s ease;
        }

        .see-all:hover {
          background-color: rgba(24, 32, 132, 0.1);
        }

        .category-link {
          background: transparent !important;
          color: var(--brand) !important;
          border: none !important;
        }

        .category-link:hover {
          background: rgba(24, 32, 132, 0.1) !important;
          color: var(--brand) !important;
        }

        .expand-toggle {
          border: 1px solid var(--brand);
        }

        .carousel-container {
          position: relative;
        }

        .category-swiper {
          overflow: hidden;
          margin: 0 -8px;
        }

        .slide-grid, .static-grid {
          display: grid;
          grid-template-columns: repeat(${isMobile ? 1 : 3}, 1fr);
          gap: 16px;
          padding: 0 8px;
        }

        .carousel-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 16px;
          gap: 16px;
        }

        .mobile-see-all {
          display: none;
        }

        .desktop-only {
          display: inline-block;
        }

        .navigation-buttons {
          display: flex;
          gap: 8px;
        }

        .navigation-buttons button {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
          color: inherit;
        }

        .navigation-buttons button:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .navigation-buttons button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Custom pagination styles */
        :global([class*="swiper-pagination-"] .swiper-pagination-bullet) {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          border: none !important;
          background: #d1d5db !important;
          cursor: pointer;
          transition: all 0.3s ease !important;
          opacity: 1 !important;
          transform: scale(1) !important;
          margin: 0 4px !important;
        }

        :global([class*="swiper-pagination-"] .swiper-pagination-bullet-active) {
          background: #1e40af !important;
          width: 12px !important;
          height: 12px !important;
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
          height: 160px;
        }

        .carousel-thumb-img {
          display: block;
          width: 100%;
          height: 160px;
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
          font-size: 20px;
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

        .navigation-buttons button {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
          color: inherit;
        }

        .navigation-buttons button:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .navigation-buttons button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Custom pagination styles */
        :global([class*="swiper-pagination-"] .swiper-pagination-bullet) {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          border: none !important;
          background: #d1d5db !important;
          cursor: pointer;
          transition: all 0.3s ease !important;
          opacity: 1 !important;
          transform: scale(1) !important;
          margin: 0 4px !important;
        }

        :global([class*="swiper-pagination-"] .swiper-pagination-bullet-active) {
          background: #1e40af !important;
          width: 12px !important;
          height: 12px !important;
        }

        @media (max-width: 600px) {
          .section-head {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .section-actions {
            display: flex;
          }

          .desktop-only {
            display: none !important;
          }

          .mobile-see-all {
            display: block;
            margin-top: 16px;
            text-align: center;
          }

          .mobile-link {
            display: inline-block;
            width: 100%;
            max-width: 200px;
            text-align: center;
            padding: 12px 24px !important;
            border: 1px solid var(--brand) !important;
            border-radius: 999px !important;
            font-weight: 600;
          }

          .see-all {
            font-size: 13px;
            padding: 5px 10px;
          }

          .slide-grid, .static-grid {
            grid-template-columns: 1fr;
          }

          .carousel-thumb,
          .carousel-thumb-img {
            height: 200px;
          }

          .carousel-controls {
            justify-content: center;
            gap: 16px;
            margin-top: 16px;
          }

          .navigation-buttons button {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }

        .carousel-controls {
          display: flex;
          flex-direction: row;
        }

        .carousel-controls .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
        }

        .carousel-controls .swiper-pagination-bullet-active {
          width: 20px;
          height: 20px;
          background-color: #1A2080;
        }

        .carousel-controls .swiper-pagination-bullets {
          display: flex;
          align-items: center;
        }
        
        }
      </style>
    </section>
  )
}