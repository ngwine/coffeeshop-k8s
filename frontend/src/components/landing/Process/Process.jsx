import React from "react";
import "./process.css";

const steps = [
  {
    icon: "/images/coffee-farm.png",
    title: "Coffee Farm",
    text: "Located in Vietnam's Central Highlands, the fertile basalt soil provides excellent conditions for high-quality coffee cultivation."
  },
  {
    icon: "/images/dry-coffee.png",
    title: "Drying Beans",
    text: "After harvesting, beans are cleaned and sun-dried for 25–30 days until the moisture content reduces to 12–13%."
  },
  {
    icon: "/images/coffee-roast.png",
    title: "Roasting & Grinding",
    text: "The 5-step roasting process ensures consistent flavor and aroma while maintaining bean quality."
  },
  {
    icon: "/images/coffee-packing.png",
    title: "Packaging",
    text: "Beans are sealed in air-tight packaging, preserving quality and flavor to meet export standards."
  },
  {
    icon: "/images/coffee-inspection.png",
    title: "Inspection",
    text: "Every batch is checked to remove defective beans. Only products that meet all standards are delivered."
  },
  {
    icon: "/images/coffee-delivery.png",
    title: "Delivery",
    text: "Containers must be dry, with proper temperature and humidity to preserve the coffee during transport."
  }
];

export default function Process() {
  return (
      <div className="process-section">
        {/* Title section */}
        <div className="process-text">
          <h1 className="bg-text">Process</h1>
          <span className="pc-eyebrow">Our Process</span>
          <h2>FROM FARM TO CUP</h2>
          <div className="line"></div>
        </div>

        {/* Steps grid */}
        <div className="process">
          {/* Left side */}
          <div className="steps left">
            {steps.slice(0, 3).map((s, i) => (
              <div className="step" key={i}>
                <div className="icon">
                  <img src={s.icon} alt={s.title} />
                </div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Center image */}
          <div className="coffee-center">
            <img src="/images/coffee-cup.png" alt="Coffee cup" />
          </div>

          {/* Right side */}
          <div className="steps right">
            {steps.slice(3).map((s, i) => (
              <div className="step" key={i}>
                <div className="icon">
                  <img src={s.icon} alt={s.title} />
                </div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
}
