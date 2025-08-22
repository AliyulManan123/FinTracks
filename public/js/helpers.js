window.numberFormat = function numberFormat(n) {
  const num = typeof n === 'object' ? Number(n) : Number(n);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};
