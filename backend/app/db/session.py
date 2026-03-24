import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event
from app.core.context import org_id_ctx
try:
    import google.auth
    from google.auth.transport.requests import Request
    import asyncpg
except ImportError:
    pass

is_production = os.getenv("ENV") == "production"

if is_production:
    GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "gen-lang-client-0873796692")
    REGION = os.getenv("GCP_REGION", "us-central1")
    INSTANCE_NAME = os.getenv("DB_INSTANCE_NAME", "ciso-postgres")
    INSTANCE_CONNECTION_NAME = f"{GOOGLE_CLOUD_PROJECT}:{REGION}:{INSTANCE_NAME}"

    DB_USER = os.getenv("DB_USER", f"vciso-backend-sa@{GOOGLE_CLOUD_PROJECT}.iam")
    DB_NAME = os.getenv("DB_NAME", "vciso")

    async def getconn():
        # Authenticate via default IAM execution scope
        credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/sqlservice.login"])
        credentials.refresh(Request())
        
        # Connect asynchronously over the Cloud Run managed Unix Socket (bypass Connector loops entirely)
        conn = await asyncpg.connect(
            user=DB_USER,
            password=credentials.token,
            database=DB_NAME,
            host=f"/cloudsql/{INSTANCE_CONNECTION_NAME}"
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
    if engine.name != "postgresql":
        return
        
    org_id = org_id_ctx.get()
    cursor = dbapi_connection.cursor()
    try:
        if org_id:
            cursor.execute(f"SET LOCAL rls.org_id = '{org_id}'")
        else:
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
    async with SessionLocal() as session:
        yield session
