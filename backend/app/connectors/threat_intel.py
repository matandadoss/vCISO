from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from app.connectors.base import BaseConnector

class ThreatIntelConnector(BaseConnector):
    """
    Connector for external Threat Intelligence feeds (e.g., Recorded Future, AlienVault OTX).
    """
    
    @property
    def target_topic(self) -> str:
        return "projects/your-project-id/topics/threat-intel-raw"

    async def fetch_data(self, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Fetches live pulses and indicators of compromise from AlienVault OTX.
        """
        try:
            import httpx
        except ImportError:
            print("Threat Intel Connector Error: httpx not installed.")
            return []

        # We can configure api_key in settings. For OTX, public feeds don't strictly require one for basic polling, 
        # but it's recommended.
        otx_api_key = self.config.settings.get("otx_api_key", "")
        headers = {}
        if otx_api_key:
             headers["X-OTX-API-KEY"] = otx_api_key

        # Let's poll for the most recent Pulses (Threat intelligence reports containing indicators)
        # Using a fixed limit for demonstration, in a real app this handles pagination
        url = "https://otx.alienvault.com/api/v1/pulses/subscribed" if otx_api_key else "https://otx.alienvault.com/api/v1/search/pulses?q=malware&sort=-modified&limit=5"
        
        # Determine how far back to look. OTX allows filtering by modified date
        if since:
             # Just a simple string format for OTX
             url += f"&modified_since={since.isoformat()}"

        raw_indicators = []
        
        try:
             async with httpx.AsyncClient(timeout=15.0) as client:
                 response = await client.get(url, headers=headers)
                 
                 if response.status_code != 200:
                      print(f"OTX API Error: Status {response.status_code}")
                      return []
                      
                 data = response.json()
                 pulses = data.get("results", [])
                 
                 for pulse in pulses:
                      pulse_id = pulse.get("id")
                      pulse_name = pulse.get("name", "Unknown Campaign")
                      tags = pulse.get("tags", [])
                      indicators = pulse.get("indicators", [])
                      
                      for ind in indicators:
                           ind_type = ind.get("type", "")
                           
                           # Map OTX type to our system's expected domain models
                           internal_type = "url"
                           if ind_type == "IPv4" or ind_type == "IPv6": internal_type = "ip"
                           elif ind_type == "domain": internal_type = "domain"
                           elif "hash" in ind_type.lower() or ind_type in ["FileHash-MD5", "FileHash-SHA256"]: internal_type = "file_hash"
                           else: continue # Skip indicators we don't track natively
                           
                           # Normalize severity (OTX doesn't always have strict severity per indicator, derive from Pulse)
                           raw_indicators.append({
                               "id": f"indicator--{ind.get('id', uuid.uuid4())}",
                               "type": "indicator",
                               "pattern_type": "stix", # Mocking stix format wrapper for our internal consumer
                               "pattern": f"[{internal_type}:value = '{ind.get('indicator', '')}']",
                               "valid_from": pulse.get("modified", datetime.now(timezone.utc).isoformat()),
                               "name": pulse_name,
                               "description": ind.get("description", "") or pulse.get("description", ""),
                               "labels": tags,
                               "confidence": 80, # Defaulting confidence
                               "severity": "high",
                               "source": "AlienVault OTX",
                               "otx_pulse_id": pulse_id
                           })

        except httpx.RequestError as e:
             print(f"Network error fetching from Threat Intel provider: {e}")
             
        return raw_indicators
