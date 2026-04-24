export const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

export const formatCurrencyInput = (value: string | number) => {
  if (value === null || value === undefined) return '';
  const digitsOnly = value.toString().replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const generateSKU = (category: string): string => {
  const categoryPrefix: Record<string, string> = {
    'Roasted coffee': 'RC',
    'Coffee sets': 'CS',
    'Coffee makers and grinders': 'CM',
    'Cups & Mugs': 'MG',
  };

  const locationCodes = ['TN', 'HC', 'PL', 'TCH'];
  const prefix = categoryPrefix[category] || 'PR';
  const location = locationCodes[Math.floor(Math.random() * locationCodes.length)];
  const number = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');

  return `${prefix}-${location}-${number}`;
};

