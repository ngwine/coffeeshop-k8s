import React from "react";
import './about.css';
import Footer from '../../components/Footer';

const AboutPage = () =>  {
  return (
    <div className="about-page">
      {/* Header */}
       <section
  className="about-hero"
  style={{
    backgroundImage: "url('/images/hero-about.png')",
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',      // cho hình fill hết khung
    backgroundPosition: 'center',
  }}
>

         <div className="container">
          <div className="hero-content">
             <h1>About Our Coffee Journey</h1>
             <p>From the highlands of Vietnam to your cup, we bring you the finest coffee experience</p>
           </div>
         </div>
       </section>

     
      <div className="story-box">
          <h2>Our Story</h2>
               <p>
                  Founded in 2025, our story begins with a heartfelt mission: to honor and 
                share the soul of Vietnamese coffee with the world. From the legendary highlands 
                and regions proudly known as Vietnam’s coffee capitals, we bring not just a drink, 
                but a cultural treasure — rich, bold, and deeply rooted in tradition.
               </p>
               <p>
                  We proudly collaborate with renowned corporations and heritage brands, 
                 combining decades of expertise with the timeless beauty of Vietnamese coffee. 
                 Together, we craft experiences that celebrate both innovation and authenticity.
               </p>
 
      </div>
      
     
      <div className="sections-wrapper">
        {/* Mission */}
        <div className="section">
        <img src="/images/coffeeAbout3.png"  />
          <div className="text-box dark">
            <h2>Mission</h2>
              <p>
                Every cup we create is a tribute — to the land, to the farmers, and to the enduring 
                spirit of Vietnam. Our commitment is simple yet profound: to let the world fall in love 
                with the true taste of Vietnam.
              </p>
          </div>
        </div>

        {/* Team */}
        <div className="section">
          <img src="/images/coffeeAbout2.png"  />
          <div className="text-box dark">
            <h2>Team</h2>
            <p>
             Behind every bean is a team united by passion and pride. We are dreamers, craftsmen, 
             and storytellers who believe Vietnamese coffee deserves a place on the world stage. 
             Together, we work hand in hand — from sourcing in the coffee capitals of Vietnam to 
             creating unforgettable experiences in every cup. Our team is not just building a brand, 
             but carrying the spirit of Vietnam to coffee lovers everywhere.
            </p>
          </div>
          
        </div>
      </div>  

      {/* Quote */}
      <div className="quote-overlay">
        <div className="highlight">
          <p>
            Each product is made from the best of its ingredients. It is a unique
            balance of tradition and skill of various generations, as well as
            modern innovation and state-of-the-art techniques passed on and
            perfected.
          </p>
        </div>
      </div>

        {/* Socials */}
        <div className="sections-wrapper">
          <div className="section">
            <img src="/images/coffeeAbout1.png"  />
            <div className="text-box dark">
              <h2>Socials</h2>
              <p>
                Coffee is more than a product — it is a bond between people, land, and culture. We are committed to supporting local farmers, 
                fostering fair and sustainable partnerships, and uplifting the communities that make Vietnamese coffee possible. By honoring 
                traditions and investing in people, we aim to create lasting value that goes beyond the cup — a movement where every sip 
                connects the world to Vietnam’s heritage.
              </p>
              
            </div>
          </div>
        </div>
      



      <Footer />
    </div>
  );
}

export default AboutPage;