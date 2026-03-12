import os
import httpx

class PagerDutyNotifier:
    def __init__(self, routing_key: str):
        self.routing_key = routing_key
        self.endpoint = "https://events.pagerduty.com/v2/enqueue"

    async def notify_critical(self, finding: dict):
        if not self.routing_key or finding.get("severity") != "critical":
            return

        payload = {
            "routing_key": self.routing_key,
            "event_action": "trigger",
            "dedup_key": f"vciso-finding-{finding.get('id')}",
            "payload": {
                "summary": finding.get("title", "Critical Security Finding"),
                "source": "Virtual CISO Platform",
                "severity": "critical",
                "custom_details": {
                    "risk_score": finding.get("risk_score"),
                    "workflow": finding.get("source_workflow"),
                    "link": f"https://vciso.example.com/findings/{finding.get('id')}"
                }
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                await client.post(self.endpoint, json=payload)
            except Exception as e:
                print(f"Failed to send PagerDuty alert: {e}")
