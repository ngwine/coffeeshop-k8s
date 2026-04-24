import React from "react";
import "./newsletter.css";

const BG_IMAGE_URL = "/images/contact-newletter.png";

const Newsletter = () => {
  return (
    <section className="newsletter"
      style={{ 
        backgroundImage: `url('${BG_IMAGE_URL}')`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      <div className="newsletter-container">
        <div className="newsletter-text">
          <h2 className="main-heading">
            Subscribe newsletter
            <span className="discount-text">and get -20% off</span>
          </h2>
          <p className="description">
            It is the most popular hot drink in the world. Seeds of the Coffea plant's fruits are separated to produce unroasted green coffee beans.
          </p>
          <form className="newsletter-form">
            <input
              type="email"
              placeholder="Enter email address..."
              aria-label="Enter email address"
              required
            />
            <button type="submit">SUBSCRIBE</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
