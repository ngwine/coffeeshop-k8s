import React from "react";
import "./testimonial.css";



const AVATAR_URL = "https://randomuser.me/api/portraits/women/44.jpg";
const BG_IMAGE_URL = "/images/testimonial-img.jpg";

function TestimonialSection() {
  return (
    <section
      className="testimonial-section testimonial-footer-font testimonial-section-bg"
      style={{
        backgroundImage: `linear-gradient(rgba(6,58,52,0.1), rgba(6,58,52,0.1)), url('${BG_IMAGE_URL}')`,
      }}
    >
      <div className="testimonial-container">
      <div className="testimonial-content">
        
        <img
          src={AVATAR_URL}
          alt="Customer Avatar"
          className="testimonial-avatar"
        />
        
        <div className="testimonial-name">Hồng Liễm</div>
        <div className="testimonial-role">Nhân Viên Văn Phòng</div>
        <blockquote className="testimonial-quote">
          "Thức ăn ở đây rất ngon, phục vụ tận tình và không gian ấm cúng. Tôi sẽ quay lại nhiều lần nữa!"
          
        </blockquote>

      </div>
      <div className="testimonial-dots">
          <span className="testimonial-dot active"></span>
          <span className="testimonial-dot"></span>
          <span className="testimonial-dot"></span>
        </div>
      </div>
    </section>
  );
}

export default function TestimonialFooterSection() {
  return (
    <div className="testimonial-footer-font">
      <TestimonialSection />
 
    </div>
  );
} 