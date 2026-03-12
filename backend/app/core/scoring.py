from app.core.constants import DATA_SENSITIVITY_WEIGHTS, ENVIRONMENT_WEIGHTS

def calculate_risk_score(
    threat_likelihood: float,       # 0.0 - 1.0
    vulnerability_exposure: float,  # 0.0 - 1.0
    control_effectiveness: float,   # 0.0 - 1.0
    business_impact: float          # 0.0 - 1.0
) -> float:
    """Risk = Threat_Likelihood × Vulnerability_Exposure × (1 - Control_Effectiveness) × Business_Impact × 100"""
    return min(100.0, max(0.0, threat_likelihood * vulnerability_exposure * (1.0 - control_effectiveness) * business_impact * 100.0))

def calculate_threat_likelihood(
    active_campaigns_targeting: bool, 
    threat_actor_sophistication: str,
    epss_score: float, 
    dark_web_signals: int, 
    days_since_exploit_published: int
) -> float:
    """Weights: epss_score * 0.35, active_campaigns * 0.30, dark_web_signals_normalized * 0.20, sophistication_factor * 0.10, recency_factor * 0.05"""
    epss = epss_score or 0.0
    campaigns = 1.0 if active_campaigns_targeting else 0.0
    dw_normalized = min(1.0, dark_web_signals / 10.0)
    
    sophistication_map = {
        "nation_state": 1.0,
        "organized_crime": 0.8,
        "advanced": 0.6,
        "intermediate": 0.4,
        "basic": 0.2
    }
    soph = sophistication_map.get(threat_actor_sophistication, 0.1)
    
    recency = 1.0 if days_since_exploit_published <= 7 else \
              0.8 if days_since_exploit_published <= 30 else \
              0.5 if days_since_exploit_published <= 180 else 0.2
              
    score = (epss * 0.35) + (campaigns * 0.30) + (dw_normalized * 0.20) + (soph * 0.10) + (recency * 0.05)
    return min(1.0, max(0.0, score))

def calculate_vulnerability_exposure(
    cvss_base: float, 
    exploit_availability: str,
    network_exposure: str, 
    affected_asset_count: int
) -> float:
    """Weights: network_exposure_factor * 0.40, exploit_availability_factor * 0.35, cvss_normalized * 0.15, scale_factor * 0.10"""
    cvss_norm = (cvss_base or 0.0) / 10.0
    
    exploit_map = {
        "actively_exploited": 1.0,
        "weaponized": 0.8,
        "poc": 0.4,
        "none": 0.1
    }
    exp_factor = exploit_map.get(exploit_availability, 0.1)
    
    network_map = {
        "internet_facing": 1.0,
        "internal_shared": 0.6,
        "internal_segmented": 0.2
    }
    net_factor = network_map.get(network_exposure, 0.1)
    
    scale = min(1.0, affected_asset_count / 100.0)
    
    score = (net_factor * 0.40) + (exp_factor * 0.35) + (cvss_norm * 0.15) + (scale * 0.10)
    return min(1.0, max(0.0, score))

def calculate_control_effectiveness(
    relevant_controls: list[dict], 
    defense_depth: int, 
    last_validation_days: int
) -> float:
    """Weighted average of control effectiveness scores, penalized for stale validation"""
    if not relevant_controls:
        return 0.0
        
    avg_score = sum(c.get("effectiveness_score", 0.0) for c in relevant_controls) / len(relevant_controls)
    
    # Penalize if stale
    stale_penalty = 1.0
    if last_validation_days > 180:
        stale_penalty = 0.5
    elif last_validation_days > 90:
        stale_penalty = 0.8
        
    # Bonus for defense in depth
    depth_bonus = min(1.2, 1.0 + (defense_depth * 0.05))
    
    score = (avg_score / 100.0) * stale_penalty * depth_bonus
    return min(1.0, max(0.0, score))

def calculate_business_impact(
    data_classification: str, 
    environment: str, 
    asset_criticality: str,
    regulatory_scope: list[str], 
    revenue_impact_estimate: float
) -> float:
    """Uses DATA_SENSITIVITY_WEIGHTS and ENVIRONMENT_WEIGHTS"""
    data_weight = DATA_SENSITIVITY_WEIGHTS.get(data_classification, 0.1)
    env_weight = ENVIRONMENT_WEIGHTS.get(environment, 0.1)
    
    crit_map = {
        "critical": 1.0,
        "high": 0.8,
        "medium": 0.5,
        "low": 0.2
    }
    crit_weight = crit_map.get(asset_criticality, 0.1)
    
    reg_factor = 1.0 if regulatory_scope else 0.8
    # Normalize revenue estimate against an arbitrary 1M threshold for score
    rev_factor = min(1.0, max(0.1, revenue_impact_estimate / 1000000.0))
    
    score = (data_weight * 0.30) + (env_weight * 0.25) + (crit_weight * 0.25) + (reg_factor * 0.10) + (rev_factor * 0.10)
    return min(1.0, max(0.0, score))
