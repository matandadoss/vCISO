import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event
from app.core.context import org_id_ctx
try:
    from google.cloud.sql.connector import Connector, IPTypes
except ImportError:
    Connector = None

is_production = os.getenv("ENV") == "production"

if getattr(os, 'is_production', is_production):
    import google.auth
    from google.auth.transport.requests import Request
    import asyncpg

    GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "gen-lang-client-0873796692")
    DB_HOST = os.getenv("DB_HOST", "34.60.5.109")
    DB_USER = os.getenv("DB_USER", f"vciso-backend-sa@{GOOGLE_CLOUD_PROJECT}.iam")
    DB_NAME = os.getenv("DB_NAME", "vciso")

    async def getconn():
        # Exchange Google Cloud runtime identity for a short-lived Postgres IAM Token
        credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/sqlservice.login"])
        credentials.refresh(Request())
        
        # Dial directly using asyncpg and require SSL
        conn = await asyncpg.connect(
            user=DB_USER,
            password=credentials.token,
            database=DB_NAME,
            host=DB_HOST,
            ssl="require"
        )
        return conn

    engine = create_async_engine(
        "postgresql+asyncpg://",
        async_creator=getconn,
        echo=False,
        future=True,
        pool_pre_ping=True
    )
else:
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
