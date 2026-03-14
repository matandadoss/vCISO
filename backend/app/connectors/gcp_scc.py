from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from app.connectors.base import BaseConnector

class GCPSCCConnector(BaseConnector):
    """
    Connector for Google Cloud Security Command Center.
    In a real implementation, this uses the google-cloud-securitycenter API.
    """
    
    @property
    def target_topic(self) -> str:
        # Route to the infrastructure or vulnerability workflow ingest stream
        return "projects/your-project-id/topics/scc-events-raw"

    async def fetch_data(self, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Fetches active findings from Google Cloud Security Command Center.
        """
        try:
            from google.cloud import securitycenter_v1
        except ImportError:
            # If the library isn't installed in the environment, fallback gracefully
            return []

        # In production this comes safely from self.config.settings securely
        organization_id = self.config.settings.get("gcp_organization_id")
        if not organization_id:
             print("GCP SCC Connector Error: Missing gcp_organization_id setting.")
             return []

        client = securitycenter_v1.SecurityCenterClient()
        source_name = f"organizations/{organization_id}/sources/-"

        # Build filter string
        # We only care about ACTIVE findings. If 'since' is provided, we filter by eventTime.
        filter_str = 'state="ACTIVE"'
        if since:
            # GCP SCC filter expects RFC 3339 timestamps
            time_str = since.isoformat()
            if time_str.endswith("+00:00"):
                time_str = time_str[:-6] + "Z"
            filter_str += f' AND eventTime > "{time_str}"'

        request = securitycenter_v1.ListFindingsResponse(
            request={
                "parent": source_name,
                "filter": filter_str,
            }
        )

        # To execute async, we run the synchronous GCP SDK call in a threadpool
        import asyncio
        loop = asyncio.get_running_loop()
        
        try:
            iterator = await loop.run_in_executor(
                None, 
                lambda: client.list_findings(request={"parent": source_name, "filter": filter_str})
            )
        except Exception as e:
            print(f"GCP API Error: {e}")
            return []

        raw_data = []
        for page in iterator:
             finding = page.finding
             # Map from Google's proto structure to a dict
             severity_map = {
                 0: "INFORMATIONAL", # SEVERITY_UNSPECIFIED
                 1: "CRITICAL",
                 2: "HIGH",
                 3: "MEDIUM",
                 4: "LOW"
             }
             severity = severity_map.get(finding.severity, "INFORMATIONAL")
             
             # Extract dict representations for JSON serialization
             marks = {}
             if finding.security_marks and hasattr(finding.security_marks, "marks"):
                  marks = dict(finding.security_marks.marks)
                  
             props = {}
             if finding.source_properties:
                  for key, val in finding.source_properties.items():
                       props[key] = str(val)

             raw_data.append({
                "name": finding.name,
                "parent": finding.parent,
                "resourceName": finding.resource_name,
                "state": "ACTIVE" if finding.state == 1 else "INACTIVE",
                "category": finding.category,
                "externalUri": finding.external_uri,
                "sourceProperties": props,
                "securityMarks": {
                    "marks": marks
                },
                "eventTime": finding.event_time.isoformat() if finding.event_time else datetime.now(timezone.utc).isoformat(),
                "severity": severity,
                "description": finding.description
             })

        return raw_data
