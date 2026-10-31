from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limiter instance for authentication and other sensitive endpoints.
# Uses the client's remote address as the rate-limit key.
limiter = Limiter(key_func=get_remote_address)
