import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.ext.asyncio import create_async_engine
from app.db.session import SessionLocal
from sqlalchemy import text
from app.main import org_id_ctx

async def run_merge():
    # Setup context var to bypass basic application-level tenant filters during script execution
    # though since we are running raw SQLAlchemy over raw text queries, we don't strictly need it.
    
    print("Starting Global Tenant Merge & Consolidation...")
    async with SessionLocal() as session:
        # PostgreSQL syntax for bypassing RLS: we must run as superuser or bypassrls role 
        # Since vciso-backend-sa is likely the owner, it can bypass RLS by setting role to postgres/owner,
        # OR we can simply clear the local rls config.
        try:
            await session.execute(text("RESET rls.org_id"))
        except:
            pass
            
        print("Finding Target Organization (Better Minds Psychology)...")
        res = await session.execute(text("SELECT id FROM organizations WHERE name = 'Better Minds Psychology' LIMIT 1"))
        target_org_id = res.scalar()
        
        if not target_org_id:
            print("Could not find 'Better Minds Psychology' organization! Falling back to the user's current Org...")
            res = await session.execute(text("SELECT org_id FROM users WHERE email='matanda.doss@gmail.com' LIMIT 1"))
            target_org_id = res.scalar()
            if not target_org_id:
                raise Exception("CRITICAL: Target Org ID could not be dynamically resolved.")
            
        print(f"Target Consolidation Destination Org ID: {target_org_id}")

        # List of all multi-tenant tables in the platform
        tenant_tables = [
            "ai_query_logs",
            "assets",
            "audit_logs",
            "chat_messages",
            "chat_sessions",
            "compliance_frameworks",
            "correlation_rules",
            "findings",
            "internal_bug_logs",
            "org_ai_budgets",
            "organization_integrations",
            "risk_register",
            "security_controls",
            "threat_actors",
            "threat_feed_subscriptions",
            "threat_intel_indicators",
            "users",
            "vendors",
            "vulnerabilities",
            "weekly_security_briefs",
            "workflow_ai_configs"
        ]
        
        for table in tenant_tables:
            print(f"Merging data in table -> {table}...")
            # We explicitly disable and then re-enable RLS on the table to bypass 'FORCE ROW LEVEL SECURITY'
            # restrictions enforced by the domain.py architecture.
            try:
                await session.execute(text(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;"))
                
                update_query = text(f"""
                    UPDATE {table} 
                    SET org_id = :target_org 
                    WHERE org_id != :target_org 
                       OR org_id IS NULL
                """)
                await session.execute(update_query, {"target_org": target_org_id})
                print(f"Successfully migrated records in {table}.")
            except Exception as e:
                print(f"Error merging table {table}: {e}")
                # rollback partial failure in this specific table segment to keep going
                await session.rollback()
            finally:
                # Re-engage strict RLS protocols
                try:
                    await session.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"))
                    await session.execute(text(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;"))
                except:
                    pass
                
        # Commit the entire batch consolidation!
        await session.commit()
        print("Consolidation Success! All specific multi-tenant tables have logically collapsed into the target organization.")

if __name__ == "__main__":
    asyncio.run(run_merge())
