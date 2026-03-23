from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from secure import Secure
from app.core.auth import get_current_user
from app.api.v1 import ai_settings, chat, findings, dashboard, ws, threat_intel, compliance, correlation_graph, playbooks, onboarding, integrations, simulator, organizations, vendors, pentest, workflows, bugs, users, risk_register, tiers, billing, reports
from app.api.v1.admin import customers as admin_customers, tiers as admin_tiers
from app.db.session import get_db
import base64
import json
from app.core.context import org_id_ctx

# Initialize Rate Limiter
from app.core.rate_limit import limiter

# Initialize Security Headers
secure_headers = Secure()

app = FastAPI(
    title="Virtual CISO API",
    description="AI-driven Virtual Chief Information Security Officer platform",
    version="0.1.0"
)

# Bind rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Apply Security Headers Middleware
@app.middleware("http")
async def tenant_isolation_middleware(request: Request, call_next):
    """
    Extracts the org_id from the incoming JWT (unverified) and injects it into contextvars.
    Cryptographic verification still happens in the get_current_user dependency,
    protecting this fast-path metadata extraction from forgery.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        if token == "mock-token":
            org_id_ctx.set("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        else:
            try:
                payload_b64 = token.split(".")[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                payload = json.loads(base64.urlsafe_b64decode(payload_b64))
                if "org_id" in payload:
                    org_id_ctx.set(payload["org_id"])
            except Exception:
                pass 
                
    return await call_next(request)

@app.middleware("http")
async def set_secure_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "https://vciso.web.app",
        "https://vciso.firebaseapp.com",
        "https://vciso-frontend-457240052356.us-central1.run.app",
        "https://gen-lang-client-0873796692.web.app",
        "https://gen-lang-client-0873796692.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
app.include_router(users.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(risk_register.router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(tiers.router, prefix="/api/v1/tiers", dependencies=[Depends(get_current_user)])
app.include_router(billing.router, prefix="/api/v1/billing", dependencies=[Depends(get_current_user)])
app.include_router(reports.router, prefix="/api/v1/reports", dependencies=[Depends(get_current_user)])
app.include_router(bugs.router, prefix="/api/v1") # Open/loose auth for bug report catching


# Admin Routes
app.include_router(admin_customers.router, prefix="/api/v1/admin/customers", dependencies=[Depends(get_current_user)])
app.include_router(admin_tiers.router, prefix="/api/v1/admin/tiers", dependencies=[Depends(get_current_user)])

@app.get("/")
async def root():
    return {"message": "vCISO API Operational"}
@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy"}
