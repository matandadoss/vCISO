from app.models.domain import Finding
from sqlalchemy import select

sort_by = "detected_at"
sort_dir = "desc"
stmt = select(Finding)
col = getattr(Finding, sort_by)
order_col = col.desc()
stmt = stmt.order_by(order_col)
print(stmt)
