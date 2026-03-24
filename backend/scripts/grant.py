import asyncio
import sqlalchemy
from google.cloud.sql.connector import Connector, IPTypes

async def grant_permissions():
    connector = Connector()
    
    def getconn():
        return connector.connect(
            "gen-lang-client-0873796692:us-central1:ciso-postgres",
            "pg8000",
            user="postgres",
            password="TempPassword123!",
            db="vciso",
            ip_type=IPTypes.PUBLIC
        )
        
    engine = sqlalchemy.create_engine(
        "postgresql+pg8000://",
        creator=getconn,
    )
    
    with engine.begin() as conn:
        conn.execute(sqlalchemy.text('GRANT ALL ON SCHEMA public TO "vciso-backend-sa@gen-lang-client-0873796692.iam";'))
        conn.execute(sqlalchemy.text('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "vciso-backend-sa@gen-lang-client-0873796692.iam";'))
        conn.execute(sqlalchemy.text('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "vciso-backend-sa@gen-lang-client-0873796692.iam";'))
        
    connector.close()
    print("Permissions granted successfully.")

if __name__ == "__main__":
    asyncio.run(grant_permissions())
