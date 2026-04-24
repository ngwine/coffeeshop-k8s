import React from "react";
import "./voucher.css";

const vouchers = [
  {
    id: 1,
    icon: "../images/free-delivery.svg",
    title: "MIỄN PHÍ VẬN CHUYỂN",
    desc: "Miễn phí vận chuyển cho đơn từ 100k",
    code: "VNR FREESHIP",
    date: "12/05/2024",
    expired: true,
  },
  {
    id: 2,
    icon: "../images/voucher-percent.svg",
    title: "Giảm 20.000",
    desc: "Giảm cho đơn từ 200k",
    code: "VNR 20",
    date: "03/08/2025",
    expired: true,
  },
  {
    id: 3,
    icon: "../images/voucher-percent.svg",
    title: "GIẢM 40%",
    desc: "Giảm tối đa 10k cho đơn từ 0đ",
    code: "VNR 40%",
    expired: false,
  },
    {
    id: 4,
    icon: "../images/free-delivery.svg",
    title: "MIỄN PHÍ VẬN CHUYỂN",
    desc: "Miễn phí vận chuyển cho đơn từ 0đ",
    code: "VNR FREESHIP",
    date: "30/09/2025",
    expired: false,
  },
];

const VoucherList = () => {
  return (
    <div className="voucher-container">
      {vouchers.map((v) => (
        <div className="voucher-ticket" key={v.id}>
          {/* SVG Ticket Shape */}
          <svg className="ticket-bg" viewBox="0 0 400 120" preserveAspectRatio="none">
            <path
              d="M0,20 a20,20 0 0,1 20,-20 h360 a20,20 0 0,1 20,20 v20 
                 a20,20 0 0,0 0,40 v20 a20,20 0 0,1 -20,20 h-360 
                 a20,20 0 0,1 -20,-20 v-20 a20,20 0 0,0 0,-40 z"
              fill="#fff"
              stroke="#ddd"
              strokeWidth="2"
            />
          </svg>

          <div className="ticket-content">
            {/* Icon bên trái */}
            <div className="ticket-left">
              <img src={v.icon} alt="icon" />
            </div>

            {/* Nội dung bên phải */}
            <div className="ticket-right">
              <h4>{v.title}</h4>
              <p>{v.desc}</p>
              <p>
                <b>Mã:</b> {v.code}
              </p>
              {v.date && <p>HSD: {v.date}</p>}

              {v.expired ? (
                <span className="expired">ĐÃ HẾT HẠN</span>
              ) : (
                <button className="copy-btn">Sao chép</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VoucherList;
