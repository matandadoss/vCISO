from contextvars import ContextVar
from typing import Optional

org_id_ctx: ContextVar[Optional[str]] = ContextVar("org_id_ctx", default=None)
