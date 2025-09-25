import React from 'react'

export const Hero: React.FC = () => {
  return (
    <section className="hero" aria-label="Hero">
      <div className="hero-content">
        <p className="eyebrow">Beauty Tips & Expert Insights</p>
        <h1 className="hero-title">Dapatkan tips kecantikan terbaru, panduan treatment, dan insight dari para dokter ahli Sozo untuk perjalanan beauty Anda</h1>
        <div className="hero-actions">
          <a className="btn" href="#semua-artikel">Explore Articles</a>
        </div>
      </div>
      <div className="hero-visual" aria-hidden>
        <div className="hero-img" />
      </div>
    </section>
  )
}
