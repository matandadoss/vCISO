import logging
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

def _send_email_smtp(to_email: str, subject: str, text_content: str = "", html_content: str = ""):
    """Helper connection function for sending via Google Workspace SMTP."""
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_FROM_EMAIL", "noreply@vciso.local")

    # If using App Passwords, user/pass are needed. If using SMTP Relay, they might be empty.
    # We just ensure we have an SMTP server configured.
    if not smtp_server or (smtp_server == "smtp.gmail.com" and smtp_pass == "your_app_password"):
        logger.warning(f"[MOCK EMAIL - SMTP NOT CONFIGURED] To: {to_email} | Subject: {subject}")
        # Fallback/Development Console Logger
        print("\n" + "="*50)
        print(f"[MOCK EMAIL DELIVERED - SMTP NOT CONFIGURED]")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        if text_content:
            print(f"BODY:\n{text_content}")
        print("="*50 + "\n")
        return True

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email

    if text_content:
        msg.attach(MIMEText(text_content, 'plain'))
    if html_content:
        msg.attach(MIMEText(html_content, 'html'))

    try:
        # Connect to Google Workspace SMTP
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls() # Secure the connection
            # Only login if credentials were provided (SMTP Relay uses IP whitelisting instead)
            if smtp_user and smtp_pass and smtp_pass != "your_app_password":
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info(f"Successfully sent email to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via SMTP: {str(e)}")
        # Fall through to console logging to avoid dropping during setups
        print("\n" + "="*50)
        print(f"[MOCK EMAIL DELIVERED - SMTP FAILED]")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        if text_content:
            print(f"BODY:\n{text_content}")
        print("="*50 + "\n")
        return True

async def send_invite_email(to_email: str, org_name: str, role: str, invite_link: str):
    """
    Simulates sending an invitation email to a user.
    Uses Google Workspace SMTP (or standard SMTP).
    """
    logger.info(f"Connecting to SMTP to dispatch email to {to_email}")
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
    subject = f"You've been invited to join {org_name} on vCISO"
    
    # Text fallback
    text_content = f"You have been granted '{role}' access to the {org_name} organization.\nPlease click this link to accept: {invite_link}"
    
    _send_email_smtp(to_email, subject, text_content, html_content)
    return True

async def send_sms_via_email(phone_number: str, carrier: str, message_text: str):
    """
    Delivers a text message (SMS) using free carrier email-to-sms gateways via SMTP.
    """
    clean_phone = "".join(filter(str.isdigit, phone_number))
    
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
    
    logger.info(f"Dispatching SMS to {target_email} via Google Workspace...")
    
    # Send empty subject and plain text content for SMS gateways
    _send_email_smtp(target_email, subject="", text_content=message_text, html_content="")
    return True

async def send_assignment_notification_email(to_email: str, finding_title: str, finding_url: str, org_name: str = "vCISO"):
    """
    Sends a formal notification email to a user identifying that a Cyber Risk has been assigned to them.
    """
    logger.info(f"Connecting to SMTP to dispatch assignment email to {to_email}")
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
    subject = f"Action Required: Cyber Risk Assigned - {finding_title}"
    text_content = f"You have been assigned as the primary owner for a Cyber Risk requiring resolution:\n{finding_title}\n\nInvestigate: {finding_url}"
    
    _send_email_smtp(to_email, subject, text_content, html_content)
    return True
