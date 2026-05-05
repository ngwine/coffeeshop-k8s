import React from 'react';
import './hero.css';

const HeroBanner = () => {
  const handleScrollToProducts = () => {
    const section = document.getElementById('product-carousel');
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <section className="hero">
      <video 
        className="hero-video" 
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="/images/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="hero-content">
        <p className="subtitle">NOW YOU CAN FEEL THE ENERGY</p>
        <h1>Start your day with <br/> a black Coffee!</h1>
        <button className="btn-buy" onClick={handleScrollToProducts}>
          BUY NOW
        </button>
      </div>
    </section>
  );  
};

export default HeroBanner;
