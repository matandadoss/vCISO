from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import ai_settings, chat, findings, dashboard, ws, threat_intel, compliance, correlation_graph

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

# Include Routers
app.include_router(ai_settings.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(findings.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(ws.router, prefix="/api/v1")
app.include_router(threat_intel.router, prefix="/api/v1")
app.include_router(compliance.router, prefix="/api/v1")
app.include_router(correlation_graph.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "vCISO API Operational"}
