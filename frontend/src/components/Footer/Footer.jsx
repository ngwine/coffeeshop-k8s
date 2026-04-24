import React from "react";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="brand">
            <img src="/images/logo.png" alt="Monster Coffee" />
          </div>
          <p>
            Monster Coffee hopes to always bring our customers the best
            experiences and create unforgettable moments whenever you visit
            Monster.
          </p>
          <div className="footer-socials">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-block">
            <h3>STORE LOCATIONS</h3>
            <ul>
              <li>
                Branch 1: 6th Floor, A Building, 19 Nguyen Huu Tho, District 7, Ho Chi Minh City, Vietnam
              </li>
              <li>
                Branch 2: 98 Ngo Tat To, Ward 19, Binh Thanh District, Ho Chi Minh City, Vietnam
              </li>
            </ul>
          </div>
          <div className="footer-block">
            <h3>CONTACT</h3>
            <ul>
              <li>Order hotline: 19006750</li>
              <li>Email: CoffeShop@gmail.com</li>
              <li>Monday - Friday: 7am - 10pm</li>
              <li>Saturday - Sunday: 8am - 9pm</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <button
          className="back-to-top"
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          ↑
        </button>
      </div>
    </footer>
  );
};

export default Footer;
