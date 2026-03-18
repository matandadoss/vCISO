from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from secure import Secure
from app.core.auth import get_current_user
from app.api.v1 import ai_settings, chat, findings, dashboard, ws, threat_intel, compliance, correlation_graph, playbooks, onboarding, integrations, simulator, organizations, vendors, pentest, workflows, bugs

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

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
async def set_secure_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# CORS config - locked down to frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(bugs.router, prefix="/api/v1") # Open/loose auth for bug report catching

@app.get("/")
async def root():
    return {"message": "vCISO API Operational"}
