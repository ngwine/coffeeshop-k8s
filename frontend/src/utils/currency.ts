export function formatVND(value?: number, suffix: string = ' đ'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return `0${suffix}`;
  const rounded = Math.round(Number(value));
  return new Intl.NumberFormat('vi-VN').format(rounded) + suffix;
}



















