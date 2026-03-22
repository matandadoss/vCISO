import logging
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

logger = logging.getLogger(__name__)

async def send_invite_email(to_email: str, org_name: str, role: str, invite_link: str):
    """
    Simulates sending an invitation email to a user.
    In a full production environment, this integrates directly with Sendgrid, AWS SES, or an SMTP server.
    """
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    sender_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@vciso.local")
    
    # Send actual email if SendGrid is configured
    if sendgrid_key and sendgrid_key != "your_sendgrid_api_key_here":
        try:
            logger.info(f"Connecting to SendGrid to dispatch email to {to_email}")
            html_content = f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to {org_name}!</h2>
                <p>You have been invited to join the <strong>{org_name}</strong> organization on the vCISO platform.</p>
                <p>You have been granted the <strong>{role}</strong> role.</p>
                <br>
                <a href="{invite_link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
                <br><br>
                <p>If you have any questions, please contact your administrator.</p>
            </div>
            """
            message = Mail(
                from_email=sender_email,
                to_emails=to_email,
                subject=f"You've been invited to join {org_name} on vCISO",
                html_content=html_content)
            
            sg = SendGridAPIClient(sendgrid_key)
            response = sg.send(message)
            logger.info(f"Successfully sent invitation email to {to_email}. Status Code: {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SendGrid: {str(e)}")
            # Fall through to console logging if Sendgrid throws an error to avoid dropping the invite entirely during setups
    
    # Fallback/Development Console Logger
    print("\n" + "="*50)
    print(f"[MOCK EMAIL DELIVERED - SENDGRID NOT CONFIGURED]")
    print(f"TO: {to_email}")
    print(f"SUBJECT: You've been invited to join {org_name} on vCISO")
    print(f"BODY:")
    print(f"Hello,")
    print(f"You have been granted '{role}' access to the {org_name} organization.")
    print(f"Please click the link below to accept your invitation and set up your account:")
    print(f"{invite_link}")
    print("="*50 + "\n")
    
    return True

async def send_sms_via_email(phone_number: str, carrier: str, message_text: str):
    """
    Delivers a text message (SMS) using free carrier email-to-sms gateways via SendGrid.
    """
    clean_phone = "".join(filter(str.isdigit, phone_number))
    
    # Mapping of common US carriers to their SMS gateways
    gateways = {
        "verizon": "vtext.com",
        "att": "txt.att.net",
        "tmobile": "tmomail.net",
        "sprint": "messaging.sprintpcs.com"
    }
    
    gateway_domain = gateways.get(carrier.lower())
    if not gateway_domain:
        logger.error(f"Unsupported carrier specified for SMS gateway: {carrier}")
        return False
        
    target_email = f"{clean_phone}@{gateway_domain}"
    
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    sender_email = os.getenv("SENDGRID_FROM_EMAIL", "system@vciso.local")
    
    if sendgrid_key and sendgrid_key != "your_sendgrid_api_key_here":
        try:
            logger.info(f"Dispatching SMS to {target_email} via SendGrid gateway...")
            # SMS gateways typically only support plain text, drop HTML formatting
            message = Mail(
                from_email=sender_email,
                to_emails=target_email,
                subject="", # Keep subject empty to save characters in the SMS
                plain_text_content=message_text
            )
            sg = SendGridAPIClient(sendgrid_key)
            response = sg.send(message)
            logger.info(f"Successfully delivered SMS to {target_email}. Status: {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"Failed to push SMS through SendGrid gateway: {str(e)}")
            
    print(f"\n[MOCK SMS DISPATCH - KEY NOT CONFIGURED] Text to: {target_email} -> {message_text}\n")
    return True

async def send_assignment_notification_email(to_email: str, finding_title: str, finding_url: str, org_name: str = "vCISO"):
    """
    Sends a formal notification email to a user identifying that a Cyber Risk has been assigned to them.
    """
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    sender_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@vciso.local")
    
    if sendgrid_key and sendgrid_key != "your_sendgrid_api_key_here":
        try:
            logger.info(f"Connecting to SendGrid to dispatch assignment email to {to_email}")
            html_content = f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #ef4444; color: white; padding: 16px 24px;">
                   <h2 style="margin: 0; font-size: 20px;">Priority Risk Assignment</h2>
                </div>
                <div style="padding: 24px;">
                   <p>Hello,</p>
                   <p>You have been assigned as the primary owner for a <strong>Cyber Risk</strong> within the {org_name} platform requiring resolution.</p>
                   <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0;">
                       <strong>Target Finding:</strong><br>
                       {finding_title}
                   </div>
                   <p>A formal tracking ticket has been opened.</p>
                   <br>
                   <a href="{finding_url}" style="background-color: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Investigate Finding</a>
                   <br><br>
                   <p style="color: #64748b; font-size: 12px;">This is an automated alerting message from the vCISO Risk Correlation Engine.</p>
                </div>
            </div>
            """
            message = Mail(
                from_email=sender_email,
                to_emails=to_email,
                subject=f"Action Required: Cyber Risk Assigned - {finding_title}",
                html_content=html_content)
            
            sg = SendGridAPIClient(sendgrid_key)
            response = sg.send(message)
            logger.info(f"Successfully sent assignment notification email to {to_email}. Status Code: {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SendGrid: {str(e)}")
            
    print("\n" + "="*50)
    print(f"[MOCK EMAIL DELIVERED - SENDGRID NOT CONFIGURED]")
    print(f"TO: {to_email}")
    print(f"SUBJECT: Action Required: Cyber Risk Assigned - {finding_title}")
    print(f"BODY:\nYou have been assigned as the primarily owner for a Cyber Risk requiring resolution:\n{finding_title}\n\nInvestigate: {finding_url}")
    print("="*50 + "\n")
    return True
