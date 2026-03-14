from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.simulation_engine import SimulationEngine

router = APIRouter(prefix="/simulator", tags=["simulator"])

class SimulationRequest(BaseModel):
    query: str

@router.post("/simulate")
async def run_simulation(request: SimulationRequest):
    """
    Takes a natural language query describing an architecture change and returns a simulated future state
    via the dynamic pathfinding engine.
    """
    result = await SimulationEngine.run_simulation(request.query)
    return result
