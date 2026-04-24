import React, { useState } from 'react';
import './contact.css';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    requirement: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for contacting us! We will get back to you soon.');
  };

  return (
    <div className="contact-page">
      {/* Fixed Background */}
      <div className="contact-bg"
        style={{ 
          backgroundImage: "url('/images/contact-bg.png')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}></div>
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Section - Form and Newsletter */}
        <div className="top-section">
          {/* Left - Contact Form */}
          <div className="contact-form-section">
            <h2>Email Us</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <textarea 
                    name="requirement" 
                    placeholder="Requirement Details"
                    value={formData.requirement}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit">Submit</button>
              </form>
          </div>

          {/* Right - Newsletter (custom markup) */}
          <div className="newsletter-section"
            style={{ 
              backgroundImage: "url('/images/contact-newletter.png')",
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
            <h3>JOIN OUR NEWSLETTER!</h3>
            <p>Don't miss out on exciting products and promotions</p>
            <form className="newsletter-custom-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email" required />
              <button type="submit">SUBSCRIBE</button>
            </form>
          </div>
        </div>

        {/* Google Map Section */}
        <div className="map-section">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5154.624312016488!2d106.69643206186231!3d10.731635920921004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528b2747a81a3%3A0x33c1813055acb613!2zxJDhuqFpIGjhu41jIFTDtG4gxJDhu6ljIFRo4bqvbmc!5e0!3m2!1svi!2s!4v1761026527746!5m2!1svi!2s"
            allowFullScreen=""
            loading="lazy"
            title="Google Map"
            
          ></iframe>
        </div>

        {/* Bottom Section - Hours and Contact Info */}
        <div className="bottom-section">
          {/* Business Hours */}
          <div className="business-hours-section">
            <h3>COME ON IN!</h3>
            <div className="business-hours">
              <div className="hours-item">
                <h4>MORNING</h4>
                <p>08PM - 12PM</p>
              </div>
              <div className="hours-item">
                <h4>AFTERNOON</h4>
                <p>13 PM – 21 PM</p>
              </div>
            </div>
            <button className="menu-button"><Link to = "/menu/roast-coffee">VIEW THE MENU</Link></button>

          </div>

          {/* Contact Info */}
          <div className="contact-info-section">
            <h3>CONTACT</h3>
            <div className="contact-item">
              <h4>PHONE</h4>
              <p>1900 1080</p>
            </div>
            <div className="contact-item">
              <h4>MAIL</h4>
              <p>VietRoast@gmail.com</p>
            </div>
            <div className="contact-item">
              <h4>ADDRESS</h4>
              <p> 19 Nguyen Huu Tho, District 7, TP.HCM</p>
            </div>
          </div>
        </div>

       
      </div>

      
    </div>
  );
};

export default ContactPage;

