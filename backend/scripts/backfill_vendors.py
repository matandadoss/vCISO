import asyncio
import uuid
import datetime
from sqlalchemy import select
from dotenv import load_dotenv
load_dotenv()

from app.db.session import async_session
from app.models.domain import Vendor
from app.api.v1.vendors import infer_tech_stack

async def backfill():
    print("Starting vendor backfill...")
    async with async_session() as db:
        result = await db.execute(select(Vendor))
        db_vendors = result.scalars().all()
        vendor_name_map = {v.name.lower(): v for v in db_vendors}
        
        product_map = {
            "s3": "AWS", "ec2": "AWS", "rds": "AWS", "lambda": "AWS", "dynamodb": "AWS", "cloudfront": "AWS",
            "mongodb": "MongoDB", "atlas": "MongoDB",
            "azure ad": "Microsoft", "active directory": "Microsoft", "office 365": "Microsoft", "azure": "Microsoft",
            "gcp": "Google", "g suite": "Google", "workspace": "Google", "bigquery": "Google", "cloud sql": "Google", "google": "Google",
            "cloudflare": "Cloudflare",
            "salesforce": "Salesforce",
            "github": "GitHub", "actions": "GitHub",
            "gitlab": "GitLab",
            "datadog": "Datadog",
            "splunk": "Splunk",
            "slack": "Slack",
            "jira": "Atlassian", "confluence": "Atlassian", "bitbucket": "Atlassian",
            "okta": "Okta", "auth0": "Okta",
            "postgresql": "PostgreSQL",
            "mysql": "Oracle"
        }
        
        updated_count = 0
        for vendor in db_vendors:
            if vendor.parent_vendor_id is not None:
                continue
                
            name_l = vendor.name.lower()
            parent_name = None
            if name_l in product_map:
                parent_name = product_map[name_l]
            else:
                for prod, p_name in product_map.items():
                    if prod == name_l or prod in name_l.split() or f"{prod} " in name_l or f" {prod}" in name_l:
                        parent_name = p_name
                        break
                        
            if parent_name and parent_name.lower() != name_l:
                if parent_name.lower() in vendor_name_map:
                    parent_vendor = vendor_name_map[parent_name.lower()]
                    vendor.parent_vendor_id = parent_vendor.id
                    vendor.vendor_type = "Product"
                    updated_count += 1
                else:
                    new_parent = Vendor(
                        org_id=vendor.org_id,
                        name=parent_name,
                        risk_score=95,
                        status="Safe",
                        tech_stack=infer_tech_stack(parent_name),
                        vendor_type="Vendor",
                        tier="basic",
                        data_access_level="low",
                        assessment_status="Safe",
                        last_assessment_date=datetime.datetime.utcnow()
                    )
                    db.add(new_parent)
                    await db.flush()
                    vendor_name_map[parent_name.lower()] = new_parent
                    
                    vendor.parent_vendor_id = new_parent.id
                    vendor.vendor_type = "Product"
                    updated_count += 1

        if updated_count > 0:
            await db.commit()
            print(f"Successfully backfilled {updated_count} products with parent relationships.")
        else:
            print("No existing products needed backfilling.")

if __name__ == "__main__":
    asyncio.run(backfill())
