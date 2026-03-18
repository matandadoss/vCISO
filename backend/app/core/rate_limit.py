from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared global rate limiter for the FastAPI application
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
