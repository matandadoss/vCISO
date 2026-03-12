import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_dashboard_summary():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/summary?org_id=test-org-123")
    assert response.status_code == 200
    data = response.json()
    assert "overall_risk_score" in data
    assert "open_critical_findings" in data

@pytest.mark.asyncio
async def test_get_findings():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/findings?org_id=test-org-123")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)

@pytest.mark.asyncio
async def test_ai_settings():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/ai/models")
    assert response.status_code == 200
    assert "models" in response.json()
