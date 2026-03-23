import httpx
from typing import Dict, Any, Optional
import os
import logging

FLUIDPAY_API_KEY = os.environ.get("FLUIDPAY_API_KEY", "")
FLUIDPAY_API_URL = os.environ.get("FLUIDPAY_API_URL", "https://sandbox.fluidpay.com/api")

logger = logging.getLogger(__name__)

class FluidpayClient:
    """
    SDK wrapper handling secure API vaulting and transactions with FluidPay.
    Ensures vCISO remains strictly SAQ-A PCI compliant by isolating raw data transmission.
    """
    def __init__(self):
        self.api_key = FLUIDPAY_API_KEY
        self.base_url = FLUIDPAY_API_URL
        self.headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }

    async def vault_and_charge(self, amount_cents: int, payment_token: str, description: str, email: str = "") -> Dict[str, Any]:
        """
        Executes a secure transaction utilizing FluidPay's token vault mechanism. 
        `payment_token` represents the secure string minted directly by fluidpay.js on the frontend.
        """
        if not self.api_key:
            logger.warning("No FLUIDPAY_API_KEY detected. Simulating a mock transaction approved.")
            return {
                "status": "success",
                "msg": "approved",
                "data": {
                    "id": "mock_txn_12345",
                    "status": "authorized",
                    "vault_id": "mock_vault_67890"
                }
            }
            
        async with httpx.AsyncClient() as client:
            payload = {
                "type": "sale",
                "amount": amount_cents,
                "description": description,
                "create_vault_record": True, # Instructs Fluidpay to store this for future recurring use
                "payment_method": {
                    "token": payment_token
                }
            }
            
            try:
                response = await client.post(
                    f"{self.base_url}/transaction",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Fluidpay API Connection Error: {e}")
                raise Exception("Failed to communicate securely with the Payment Gateway.")
