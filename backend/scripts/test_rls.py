import asyncio
import httpx
import os
import sys

# Test the Production URL
PROD_URL = "https://vciso-backend-457240052356.us-central1.run.app"

async def run_tests():
    print("Beginning vCISO Verification Suite...")
    
    async with httpx.AsyncClient() as client:
        # 1. Test Health (No Auth)
        print("\n1. Testing Unauthenticated Health Check...")
        res = await client.get(f"{PROD_URL}/api/v1/health")
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text}")
        if res.status_code != 200:
            print("FAILED: Health check down.")
            sys.exit(1)
            
        # 2. Test Dashboard (Mock Token - Should simulate valid org)
        print("\n2. Testing Authenticated Query (Mock Token)...")
        headers = {"Authorization": "Bearer mock-token"}
        res = await client.get(f"{PROD_URL}/api/v1/dashboard/summary?org_id=3fa85f64-5717-4562-b3fc-2c963f66afa6", headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"Success! Retrieved dashboard metrics. Risk Score: {data.get('overall_risk_score')}")
        else:
            print(f"FAILED: {res.text}")
            
        # 3. Test Unauthorized Access (Missing Token)
        print("\n3. Testing Unauthorized Query (No Token)...")
        res = await client.get(f"{PROD_URL}/api/v1/dashboard/summary?org_id=3fa85f64-5717-4562-b3fc-2c963f66afa6")
        print(f"Status: {res.status_code}")
        if res.status_code == 401 or res.status_code == 403:
            print("Success! Request was successfully blocked.")
        else:
            print(f"FAILED: Expected 401/403, got {res.status_code}")
            
if __name__ == "__main__":
    asyncio.run(run_tests())
