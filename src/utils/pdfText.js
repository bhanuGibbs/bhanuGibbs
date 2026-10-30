export const sanitizePdfText = (value) => value
  .replace(/₹\s*/g, 'INR ')
  .replace(/[^\u0000-\u00ff\u2010-\u203a\u20ac\u2122]/g, '?');

export const sanitizePdfData = (value) => {
  if (typeof value === 'string') return sanitizePdfText(value);
  if (Array.isArray(value)) return value.map(sanitizePdfData);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizePdfData(entry)]));
  }
  return value;
};
