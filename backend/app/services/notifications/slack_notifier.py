import os
import httpx
from pydantic import BaseModel

class SlackNotifier:
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    async def notify_finding(self, finding: dict):
        if not self.webhook_url:
            return

        severity_emoji = {
            "critical": "🚨",
            "high": "🔴",
            "medium": "🟡",
            "low": "🔵",
            "informational": "ℹ️"
        }.get(finding.get("severity", "low"), "🔵")

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{severity_emoji} New {finding.get('severity', '').capitalize()} Finding"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{finding.get('title', 'Unknown')}*\nRisk Score: *{finding.get('risk_score', 'N/A')}*\nWorkflow: `{finding.get('source_workflow', 'N/A')}`\n\n<https://vciso.example.com/findings/{finding.get('id', '')}|View Details>"
                }
            }
        ]

        async with httpx.AsyncClient() as client:
            try:
                await client.post(self.webhook_url, json={"blocks": blocks})
            except Exception as e:
                print(f"Failed to send Slack notification: {e}")

    async def notify_budget_alert(self, org_id: str, message: str):
        if not self.webhook_url:
             return
            
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "⚠️ AI Budget Alert"
                }
            },
            {
                "type": "section",
                "text": {
                     "type": "mrkdwn",
                     "text": message
                }
            }
        ]
        async with httpx.AsyncClient() as client:
             try:
                 await client.post(self.webhook_url, json={"blocks": blocks})
             except Exception as e:
                 print(f"Failed to send budget alert Slack: {e}")
