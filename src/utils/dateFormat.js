const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export const formatAppDate = (value, fallback = '—') => {
  if (!value) return fallback;
  const match = DATE_ONLY.exec(String(value));
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
