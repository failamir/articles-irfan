import React from 'react'

export const BrighteningSection: React.FC = () => {
  return (
    <section className="section" aria-labelledby="brightening-heading">
      <div className="section-header">
        <h2 id="brightening-heading">Brightening Solution</h2>
        <p className="section-desc">Solusi lengkap untuk masalah rambut rontok, penipisan, dan pertumbuhan rambut dengan
          teknologi terdepan</p>
      </div>

      <div className="cards">
        {[1,2,3].map((i) => (
          <article key={i} className="card">
            <div className="card-img" />
            <div className="card-body">
              <h3 className="card-title">Judul Artikel {i}</h3>
              <p className="card-text">Ringkasan singkat artikel mengenai brightening dan perawatan kulit.</p>
              <button className="link">Baca selengkapnya</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
