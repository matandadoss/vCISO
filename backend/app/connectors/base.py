import json
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

class ConnectorConfig(BaseModel):
    id: str
    org_id: str
    name: str
    connector_type: str  # e.g., "gcp_scc", "recorded_future", "qualys"
    enabled: bool = True
    credentials_secret_name: Optional[str] = None
    settings: Dict[str, Any] = {}
    last_sync: Optional[datetime] = None
    sync_interval_minutes: int = 60

class ConnectorStatus(BaseModel):
    connector_id: str
    status: str  # "success", "failed", "running"
    records_processed: int
    error_message: Optional[str] = None
    timestamp: datetime

class BaseConnector(ABC):
    """
    Abstract base class for all external system connectors.
    Connectors are responsible for fetching data from external systems
    and pushing it to the appropriate pub/sub topics for workflow engines.
    """
    
    def __init__(self, config: ConnectorConfig, pubsub_client=None):
        self.config = config
        self.pubsub = pubsub_client
        
    @property
    @abstractmethod
    def target_topic(self) -> str:
        """The Pub/Sub topic this connector publishes to (e.g., 'scc-findings-raw')"""
        pass

    @abstractmethod
    async def fetch_data(self, since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Fetch raw data from the external source."""
        pass

    async def execute(self) -> ConnectorStatus:
        """Main execution flow for the connector."""
        start_time = datetime.now(timezone.utc)
        try:
            # 1. Fetch data
            raw_data = await self.fetch_data(since=self.config.last_sync)
            
            # 2. Publish to Pub/Sub
            if self.pubsub and raw_data:
                 for item in raw_data:
                    # Inject org context
                    item["_src_org_id"] = self.config.org_id
                    item["_src_connector_id"] = self.config.id
                    
                    data_str = json.dumps(item).encode("utf-8")
                    self.pubsub.publish(self.target_topic, data_str)
                    
            status = ConnectorStatus(
                connector_id=self.config.id,
                status="success",
                records_processed=len(raw_data),
                timestamp=datetime.now(timezone.utc)
            )
            return status
            
        except Exception as e:
            return ConnectorStatus(
                connector_id=self.config.id,
                status="failed",
                records_processed=0,
                error_message=str(e),
                timestamp=datetime.now(timezone.utc)
            )
