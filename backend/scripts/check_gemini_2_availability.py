import os
import sys
import asyncio
import logging

# Add the project root to the python path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_sms_via_email
from app.core.ai_provider_config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def check_gemini_availability():
    """
    Pings the Vertex AI endpoint for Gemini 2.0. If it succeeds, it sends an SMS alert.
    Can be run continuously on a cron job.
    """
    logger.info("Initializing Vertex AI environment check...")
    
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
        
        if settings.VERTEX_PROJECT_ID and settings.VERTEX_LOCATION:
            vertexai.init(project=settings.VERTEX_PROJECT_ID, location=settings.VERTEX_LOCATION)
        else:
            vertexai.init()
            
        model = GenerativeModel("gemini-2.0-flash")
        
        logger.info("Testing gemini-2.0-flash endpoint generation...")
        # A simple generation request to test availability
        response = model.generate_content("Respond with a single word: OK")
        
        if response and response.text:
            logger.info("SUCCESS! Gemini 2.0 Flash answered the prompt.")
            message = "vCISO Alert: Gemini 2.0 Flash is now LIVE in your GCP region! You can update the backend router to use the new model."
            
            # Send the SMS via Verizon email-to-sms gateway
            await send_sms_via_email(
                phone_number="4807037722",
                carrier="verizon",
                message_text=message
            )
            return True
            
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg or "not found" in error_msg.lower():
            logger.warning("Gemini 2.0 Flash is still not available in this region (404).")
        else:
            logger.error(f"Test failed with unexpected error: {error_msg}")
            
    return False

if __name__ == "__main__":
    asyncio.run(check_gemini_availability())
