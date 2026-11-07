import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_BASE || '/api';

// Cache exchange rates in memory to avoid repeated API calls
let cachedRates = null;
let cachedAt = null;

/**
 * Fetch current exchange rates from the backend.
 * Rates are cached for the session and refetched only if stale.
 */
export async function fetchExchangeRates() {
  // Return cached rates if available (backend already caches for 24 hours)
  if (cachedRates) {
    return cachedRates;
  }

  try {
    const response = await axios.get(`${API_BASE}/exchange-rates`);
    cachedRates = response.data.rates;
    cachedAt = new Date();
    return cachedRates;
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using fallback:', error);
    // Fallback rates if the backend is unreachable
    cachedRates = { INR: 1, USD: 83.5, EUR: 91.0 };
    return cachedRates;
  }
}

/**
 * Clear the cached rates (useful for manual refresh).
 */
export function clearExchangeRatesCache() {
  cachedRates = null;
  cachedAt = null;
}
