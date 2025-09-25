import React from 'react'
import { Tabs } from './components/Tabs'
import { ArticleGrid } from './components/ArticleGrid'

export default function App() {
  const [activeTab, setActiveTab] = React.useState('tab-1')
  const [query, setQuery] = React.useState('')

  const categoryFromTab = (id: string): string | undefined => {
    if (id === 'tab-2') return 'Skincare Tips'
    if (id === 'tab-3') return 'Treatment Guide'
    if (id === 'tab-4') return 'Expert Opinion'
    return undefined
  }

  return (
    <div className="container">
      <main>
        <section className="hub-hero" aria-label="Knowledge Hub">
          <h1 className="hub-title">Explore Our Beauty Knowledge Hub</h1>
          <p className="hub-desc">Temukan artikel yang tepat untuk kebutuhan kecantikan Anda dari koleksi 200+ artikel yang ditulis oleh para expert</p>

          <div className="hub-controls">
            <Tabs tabs={[
              { id: 'tab-1', label: 'Semua Artikel' },
              { id: 'tab-2', label: 'Skincare Tips' },
              { id: 'tab-3', label: 'Treatment Guide' },
              { id: 'tab-4', label: 'Expert Opinion' },
            ]} defaultActive={activeTab} onChange={setActiveTab} />

            <form className="searchbar" role="search" onSubmit={(e) => e.preventDefault()}>
              <input
                className="search-input"
                type="search"
                placeholder="Cari topik, treatment, atau tips..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="search-btn" type="submit">Search</button>
            </form>
          </div>
        </section>

        <section aria-labelledby="artikel-terbaru" className="articles-section">
          <div className="section-head">
            <h2 id="artikel-terbaru">Artikel Terbaru</h2>
            <a href="#" className="see-all">Lihat Semua</a>
          </div>
          <ArticleGrid categoryName={categoryFromTab(activeTab)} searchTerm={query} />
        </section>

        <section aria-labelledby="skin-care-tips" className="articles-section">
          <div className="section-head">
            <h2 id="skin-care-tips">Skin Care Tips</h2>
            <a href="#" className="see-all">Lihat Semua</a>
          </div>
          <ArticleGrid categoryName="Skincare Tips" limit={6} />
        </section>

        <section aria-labelledby="treatment-guide" className="articles-section">
          <div className="section-head">
            <h2 id="treatment-guide">Treatment Guide</h2>
            <a href="#" className="see-all">Lihat Semua</a>
          </div>
          <ArticleGrid categoryName="Treatment Guide" limit={6} />
        </section>
      </main>
    </div>
  )
}
