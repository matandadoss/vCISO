import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event
from app.core.context import org_id_ctx

# Get DB URL from env or fallback to docker-compose default
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite+aiosqlite:///./vciso_dev.db"
)

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True
)

@event.listens_for(engine.sync_engine, "checkout")
def set_tenant_context(dbapi_connection, connection_record, connection_proxy):
    # Only PostgreSQL supports custom config settings and RLS in this format
    if engine.name != "postgresql":
        return
        
    org_id = org_id_ctx.get()
    cursor = dbapi_connection.cursor()
    try:
        if org_id:
            cursor.execute(f"SET LOCAL rls.org_id = '{org_id}'")
        else:
            # Drop context configuration explicitly to prevent unauthorized carryovers on pooled connections
            cursor.execute("RESET rls.org_id")
    except Exception as e:
        pass
    finally:
        cursor.close()

SessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def get_db():
    """
    Dependency function to yield DB sessions.
    """
    async with SessionLocal() as session:
        yield session
