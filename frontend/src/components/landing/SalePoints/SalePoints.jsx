import React from "react";
import "./salepoint.css";

const salePoints = [
  { icon: "/images/service.svg", text: "BEST SERVICE" },
  { icon: "/images/quality.svg", text: "QUALITY INGREDIENTS" },
  { icon: "/images/origin.svg", text: "AUTHENTIC FLAVORS" },
  { icon: "/images/delivery.svg", text: "FASTEST DELIVERY" },
];

const SalePoint = () => {
  return (
    <div className="sale-point-wrapper">
      <div className="sale-point-container">
        {salePoints.map((item, index) => (
          <div key={index} className="sale-point-item">
            <img src={item.icon} alt={item.text} className="sale-point-icon" />
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalePoint;
