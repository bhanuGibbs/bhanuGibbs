from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/exchange-rates", tags=["Exchange Rates"])

# In-memory cache for exchange rates
_cached_rates: dict[str, float] | None = None
_cached_at: datetime | None = None
_CACHE_DURATION = timedelta(hours=24)

# Currencies we support for conversion to INR
SUPPORTED_CURRENCIES = ["USD", "EUR"]


def _is_cache_valid() -> bool:
    """Check if the cached rates are still valid (less than 24 hours old)."""
    if _cached_rates is None or _cached_at is None:
        return False
    return (datetime.now(timezone.utc) - _cached_at) < _CACHE_DURATION


async def _fetch_rates_from_api() -> dict[str, float]:
    """Fetch latest exchange rates from ExchangeRate-API open endpoint (base=INR)."""
    # Fetch rates with INR as base, so we get how much 1 INR is worth in other currencies
    # Then we invert to get how much 1 USD/EUR is worth in INR
    url = "https://open.er-api.com/v6/latest/INR"
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        rates = data.get("rates", {})
        # The API returns how much 1 INR is worth in each currency
        # e.g., if 1 INR = 0.012 USD, then 1 USD = 1/0.012 = 83.33 INR
        inverted_rates = {}
        for currency in SUPPORTED_CURRENCIES:
            rate = rates.get(currency)
            if rate and rate > 0:
                inverted_rates[currency] = round(1.0 / rate, 4)
            else:
                inverted_rates[currency] = None
        inverted_rates["INR"] = 1.0
        return inverted_rates


# Fallback rates if the API is unreachable
FALLBACK_RATES = {
    "INR": 1.0,
    "USD": 83.5,
    "EUR": 91.0,
}


@router.get("")
async def get_exchange_rates():
    """
    Get current exchange rates to INR.
    Rates are fetched from ExchangeRate-API and cached for 24 hours.
    Returns rates for supported currencies (USD, EUR) converted to INR.
    """
    global _cached_rates, _cached_at

    # Use cached rates if still valid
    if _is_cache_valid() and _cached_rates:
        return {
            "status": "ok",
            "rates": _cached_rates,
            "source": "cache",
            "cached_at": _cached_at.isoformat(),
        }

    # Try to fetch fresh rates from the API
    try:
        fresh_rates = await _fetch_rates_from_api()
        # Validate that we got usable rates
        if all(fresh_rates.get(c) and fresh_rates[c] > 0 for c in SUPPORTED_CURRENCIES):
            _cached_rates = fresh_rates
            _cached_at = datetime.now(timezone.utc)
            logger.info("Exchange rates updated from ExchangeRate-API: %s", _cached_rates)
            return {
                "status": "ok",
                "rates": _cached_rates,
                "source": "live",
                "cached_at": _cached_at.isoformat(),
            }
        else:
            logger.warning("ExchangeRate-API returned invalid rates, using fallback")
    except Exception as e:
        logger.warning("ExchangeRate-API unreachable, using fallback rates: %s", str(e))

    # Fall back to hardcoded rates if API fails
    _cached_rates = FALLBACK_RATES
    _cached_at = datetime.now(timezone.utc)
    return {
        "status": "ok",
        "rates": _cached_rates,
        "source": "fallback",
        "cached_at": _cached_at.isoformat(),
    }
