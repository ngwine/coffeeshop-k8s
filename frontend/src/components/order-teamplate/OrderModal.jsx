import React from "react";
import "./styles/modal.css";

const OrderModal = ({
  selectedProduct,
  tempQty,
  setTempQty,
  tempSize,
  setTempSize,
  onAdd,
  onClose,
}) => {
  if (!selectedProduct) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-left">
          <img src="/images/coffee-sample.png" alt={selectedProduct?.name} />
        </div>
        <div className="modal-right">
          <h2>{selectedProduct?.name}</h2>
          <p className="price">
            {selectedProduct?.price
              ? selectedProduct.price.toLocaleString() + "đ"
              : "Liên hệ"}
          </p>

          <div className="option-block">
            <h4>Kích thước:</h4>
            <div className="size-options">
              {["S", "M", "L"].map((size) => (
                <label key={size} className={`size-btn ${tempSize === size ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="size"
                    value={size}
                    checked={tempSize === size}
                    onChange={(e) => setTempSize(e.target.value)}
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>

          <div className="option-block">
            <h4>Số lượng:</h4>
            <div className="qty-actions">
              <button onClick={() => setTempQty(tempQty > 1 ? tempQty - 1 : 1)}>-</button>
              <span>{tempQty}</span>
              <button onClick={() => setTempQty(tempQty + 1)}>+</button>
            </div>
          </div>

          <div className="option-block">
            <h4>Đường:</h4>
            <select>
              <option>0% - Không đường</option>
              <option>50% - Ít đường</option>
              <option>100% - Bình thường</option>
            </select>
          </div>

          <div className="option-block">
            <h4>Đá:</h4>
            <select>
              <option>0% - Không đá</option>
              <option>50% - Ít đá</option>
              <option>100% - Bình thường</option>
            </select>
          </div>

          <div className="option-block">
            <h4>Ghi chú:</h4>
            <textarea placeholder="Ví dụ: ít ngọt, thêm sữa..."></textarea>
          </div>

          <div className="modal-actions">
            <button className="btn-buy">MUA NGAY</button>
            <button className="btn-add" onClick={onAdd}>THÊM VÀO GIỎ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;


