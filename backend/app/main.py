from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.auth import get_current_user
from app.api.v1 import ai_settings, chat, findings, dashboard, ws, threat_intel, compliance, correlation_graph, playbooks, onboarding, integrations, simulator, organizations, vendors, pentest, workflows, bugs, workflow_instances

app = FastAPI(
    title="Virtual CISO API",
    description="AI-driven Virtual Chief Information Security Officer platform",
    version="0.1.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be constrained in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with global authentication
app.include_router(ai_settings.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(chat.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(findings.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(dashboard.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(ws.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(threat_intel.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(compliance.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(correlation_graph.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(playbooks.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(onboarding.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(integrations.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(simulator.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(organizations.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(vendors.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(pentest.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(workflows.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(workflow_instances.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(bugs.router, prefix="/api/v1") # Open/loose auth for bug report catching

@app.get("/")
async def root():
    return {"message": "vCISO API Operational"}
