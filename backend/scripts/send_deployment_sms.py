import sys
import asyncio
import os

# Add the parent directory to the path so we can import 'app' modules outside of fastapi
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_sms_via_email

async def main():
    if len(sys.argv) < 2:
        print("Usage: python send_deployment_sms.py \"Message to text\"")
        sys.exit(1)
        
    message_payload = sys.argv[1]
    
    try:
        # Utilize the core email infrastructure to SMS route
        await send_sms_via_email(
            phone_number="4807037722",
            carrier="verizon",
            message_text=message_payload
        )
        print(f"Deployment notification text successfully queued to 480-703-7722: '{message_payload}'")
    except Exception as e:
        print(f"Failed to transmit deployment SMS notification: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
