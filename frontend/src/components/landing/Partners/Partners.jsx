import React, { useRef, useEffect } from 'react';
import './partners.css';

const Partners = () => {
  const containerRef = useRef(null);

  const partners = [
    { id: 1, name: 'BuiVanNgo', logo: '/images/buivanngo.png' },
    { id: 2, name: 'Nescafe', logo: '/images/partners/nescafe.png' },
    { id: 3, name: 'TrungNguyen', logo: '/images/trungnguyen.png' },
    { id: 4, name: 'LaViet', logo: '/images/laviet.png' },
    { id: 5, name: 'HighLand', logo: '/images/highland.png' },
    { id: 6, name: 'Peet\'s Coffee', logo: '/images/partners/peets.png' },
    { id: 7, name: 'Dunkin\'', logo: '/images/partners/dunkin.png' },
    { id: 8, name: 'Tim Hortons', logo: '/images/partners/tim-hortons.png' },
    { id: 9, name: 'Costa Coffee', logo: '/images/partners/costa.png' },
    { id: 10, name: 'McCafe', logo: '/images/partners/mccafe.png' }
  ];


  // Auto-scroll effect like ProductCarousel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const itemWidth = () => {
      const first = container.querySelector('.partner-item');
      return first ? first.clientWidth + 32 : 0; // width + gap
    };

    let timer = setInterval(() => {
      const width = itemWidth();
      if (width === 0) return;
      const step = width * 1; // Scroll 1 item at a time
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft + step >= maxScroll) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 2500); // Scroll every 2.5 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="partners-section">
      <div className="partners-container">  
          <div className="partners-scroll" ref={containerRef}>
            {partners.map(partner => (
              <div key={partner.id} className="partner-item">
                <img src={partner.logo} alt={partner.name} />
              </div>
            ))}
          </div>
          
        </div>
      
    </section>
  );
};

export default Partners;