// backend/utils/loyalty.js

/**
 * Loyalty Program Utility Functions
 *
 * - Khách được 10% giá trị đơn hàng dưới dạng điểm
 * - 100 points = 100,000 VND  (1 point = 1,000 VND)
 * - Điểm dùng cho các đơn sau, không giới hạn số lần, không hạn sử dụng
 */

function normalizeMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizePoints(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Tính điểm tích được từ đơn hàng
 * - orderTotal nên là: subtotal + shippingFee (TRƯỚC giảm giá)
 * - Ví dụ: 1.000.000 VND → 10% = 100.000 → 100 điểm
 */
function calculatePointsEarned(orderTotal) {
  const total = normalizeMoney(orderTotal);
  if (!total) return 0;
  // 10% giá trị tiền, 1 điểm = 1.000 VND
  return Math.floor((total * 0.1) / 1000);
}

/**
 * Quy đổi điểm thành tiền giảm giá
 * 1 điểm = 1.000 VND
 */
function calculateDiscountFromPoints(pointsUsed) {
  const p = normalizePoints(pointsUsed);
  if (!p) return 0;
  return p * 1000;
}

/**
 * Tính tối đa số điểm có thể dùng cho 1 order
 * - Không vượt quá availablePoints
 * - Không vượt quá giá trị order (tránh giảm > tổng tiền)
 */
function calculateMaxPointsUsable(availablePoints, orderTotal) {
  const available = normalizePoints(availablePoints);
  const total = normalizeMoney(orderTotal);
  if (!available || !total) return 0;

  const maxByTotal = Math.floor(total / 1000); // vì 1 điểm = 1.000 VND
  return Math.max(0, Math.min(available, maxByTotal));
}

/**
 * Validate + chuẩn hoá việc dùng điểm trên 1 order
 *
 * @param {object} params
 * @param {number} params.pointsToUse     - số điểm khách muốn dùng
 * @param {number} params.availablePoints - điểm hiện có
 * @param {number} params.orderTotal      - tổng tiền (subtotal + shippingFee) TRƯỚC giảm
 *
 * @returns {{
 *  ok: boolean,
 *  pointsToUse: number,
 *  discount: number,
 *  reason?: string
 * }}
 */

function validatePointsUsage({ availablePoints, pointsToUse, orderTotal }) {
  const safeAvailable =
    Math.max(0, Number(availablePoints) || 0);
  let safePoints =
    Math.max(0, Math.floor(Number(pointsToUse) || 0));

  // Không dùng điểm thì coi như ok, discount = 0
  if (safePoints === 0) {
    return { ok: true, pointsToUse: 0, discount: 0 };
  }

  // Không cho vượt quá số điểm hiện có
  if (safePoints > safeAvailable) {
    safePoints = safeAvailable;
  }

  // Không cho giảm quá tổng tiền (tránh total âm)
  if (orderTotal && orderTotal > 0) {
    const maxPointsByOrderTotal = Math.floor(orderTotal / 1000);
    safePoints = Math.min(safePoints, maxPointsByOrderTotal);
  }

  const discount = calculateDiscountFromPoints(safePoints);

  return {
    ok: true,
    pointsToUse: safePoints,
    discount,
  };
}


/**
 * Format message hiển thị cho khách
 * Ví dụ: "Bạn nhận được 100 points (trị giá 100.000₫)."
 */
function formatPointsEarnedMessage(points) {
  const p = normalizePoints(points);
  if (!p) return "";
  const valueInVND = p * 1000;
  return `Bạn nhận được ${p} points (trị giá ${valueInVND.toLocaleString(
    "vi-VN"
  )}₫).`;
}

module.exports = {
  calculatePointsEarned,
  calculateDiscountFromPoints,
  calculateMaxPointsUsable,
  validatePointsUsage,
  formatPointsEarnedMessage,
};
