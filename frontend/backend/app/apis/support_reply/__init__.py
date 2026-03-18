import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

logger = logging.getLogger("dicta.support_reply")
from app.auth import AuthorizedUser
from app.libs.email_helper import send_email

router = APIRouter()

# --- Pydantic Models ---
class SupportReplyRequest(BaseModel):
    to: EmailStr
    subject: str
    message: str  # Write in English, will auto-translate
    reply_to: EmailStr | None = None

class SupportReplyResponse(BaseModel):
    success: bool
    message: str
    translated_to: str | None = None

# --- API Endpoint ---
@router.post("/send-support-reply", response_model=SupportReplyResponse)
async def send_support_reply(request: SupportReplyRequest, user: AuthorizedUser):
    """
    Send a support reply email. 
    Write in English and it will automatically translate to the recipient's preferred language.
    Only accessible by authenticated users (admin).
    """
    
    try:
        # Prepare HTML email (write in English)
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dicta-Notes Support</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 40px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; margin: 0;">Dicta-Notes Support</h1>
        </div>
        
        <div style="line-height: 1.6; color: #333;">
            {request.message.replace(chr(10), '<br>')}
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px;">
            <p>Best regards,<br>
            <strong>The Dicta-Notes Support Team</strong></p>
            
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Need more help? Reply to this email or visit 
                <a href="https://dicta-notes.com/contact" style="color: #667eea;">dicta-notes.com/contact</a>
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        logger.info("Sending support reply to %s, subject: %s (will auto-translate if needed)", request.to, request.subject)
        
        # Use send_email which handles auto-translation
        result = send_email(
            to=request.to,
            subject=request.subject,
            html=html_content,
            reply_to=request.reply_to or "support@stackapps.com"
        )
        
        return SupportReplyResponse(
            success=True,
            message=f"Support reply sent successfully to {request.to}",
            translated_to=result.get('translated_to')
        )
        
    except Exception as e:
        logger.error("Error sending support reply: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send support reply: {str(e)}"
        )
