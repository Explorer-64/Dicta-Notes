"""Email helper using Resend API for transactional emails."""

import logging
import resend
from typing import Optional
from app.apis.gemini_client import get_gemini_client
from firebase_admin import firestore
from app.apis.firebase import get_firestore_db
from app.libs.secret_manager import get_secret

logger = logging.getLogger("dicta.email_helper")

# Initialize Resend with API key (lazy to avoid import-time errors)
def _get_resend_key():
    return get_secret("RESEND_API_KEY")



def get_user_language_preference(user_email: str) -> str:
    """
    Get user's language preference from Firestore by email.
    
    Args:
        user_email: User's email address
        
    Returns:
        Language code (e.g., 'en', 'es', 'fr') - defaults to 'en' if not found
    """
    try:
        db_client = get_firestore_db()
        if not db_client:
            logger.warning("Could not get Firestore client, defaulting to English")
            return 'en'
        
        # Query users collection to find user by email
        users_ref = db_client.collection('users')
        query = users_ref.where('email', '==', user_email).limit(1)
        results = query.get()
        
        if not results:
            logger.info(f"No user found for {user_email}, defaulting to English")
            return 'en'
        
        # Get user ID from first result
        user_doc = list(results)[0]
        user_id = user_doc.id
        
        # Get user preferences
        prefs_ref = db_client.collection('userPreferences').document(user_id)
        prefs_doc = prefs_ref.get()
        
        if prefs_doc.exists:
            prefs_data = prefs_doc.to_dict()
            language = prefs_data.get('preferredLanguage', 'en')
            logger.info(f"Found language preference for {user_email}: {language}")
            return language
        else:
            logger.info(f"No preferences found for {user_email}, defaulting to English")
            return 'en'
            
    except Exception as e:
        logger.warning("Error getting language preference for %s: %s", user_email, e)
        return 'en'  # Default to English on error


def translate_email_content(subject: str, html: str, target_language: str) -> dict:
    """
    Translate email subject and HTML content using Google Gemini 2.5.
    
    Args:
        subject: Email subject line
        html: HTML email content
        target_language: Target language code (e.g., 'es', 'fr', 'de')
        
    Returns:
        Dict with 'subject' and 'html' keys containing translated content
    """
    try:
        _configure_genai()
        # Language code to full name mapping for better translation quality
        language_names = {
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'pt': 'Portuguese',
            'it': 'Italian',
            'nl': 'Dutch',
            'pl': 'Polish',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'tr': 'Turkish',
        }
        
        language_name = language_names.get(target_language, target_language)
        
        prompt = f"""You are a professional email translator. Translate the following email content to {language_name}.

IMPORTANT RULES:
1. Preserve ALL HTML tags, attributes, and structure exactly as they are
2. Only translate the text content between tags
3. Keep URLs, email addresses, and company names unchanged
4. Maintain the same tone and formality
5. Keep any placeholder variables like {{user_name}} unchanged
6. Output ONLY the translated content, no explanations

---SUBJECT---
{subject}

---HTML BODY---
{html}

---OUTPUT FORMAT---
Provide the translation in this exact format:
SUBJECT: [translated subject]
HTML: [translated html with preserved formatting]
"""
        
        model = get_gemini_client('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        # Parse the response
        response_text = response.text
        
        # Extract subject and HTML from response
        translated_subject = subject  # fallback
        translated_html = html  # fallback
        
        if 'SUBJECT:' in response_text and 'HTML:' in response_text:
            parts = response_text.split('HTML:', 1)
            subject_part = parts[0].replace('SUBJECT:', '').strip()
            html_part = parts[1].strip()
            
            translated_subject = subject_part
            translated_html = html_part
        else:
            # If parsing fails, try to use the full response as HTML
            logger.warning("Could not parse Gemini response properly, using fallback")
            translated_html = response_text
        
        logger.info(f"Successfully translated email to {language_name}")
        return {
            'subject': translated_subject,
            'html': translated_html
        }
        
    except Exception as e:
        logger.error("Translation failed: %s", e)
        logger.info("Falling back to original English content")
        return {
            'subject': subject,
            'html': html
        }


def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    from_email: str = "Dicta-Notes <support@dicta-notes.com>",
    reply_to: Optional[str] = None,
    skip_translation: bool = False,
) -> dict:
    """
    Send an email using Resend API with automatic translation.
    
    Args:
        to: Email address or list of email addresses
        subject: Email subject line (in English)
        html: HTML content of the email (in English)
        from_email: Sender email (default: info@dicta-notes.com)
        reply_to: Optional reply-to email address
        skip_translation: If True, skip language detection and translation
        
    Returns:
        Response from Resend API
        
    Raises:
        Exception: If email sending fails
    """
    try:
        resend.api_key = _get_resend_key()

        # Handle list of recipients - for now, only translate for single recipients
        recipient_email = to if isinstance(to, str) else to[0]

        # Auto-translate if not skipped and single recipient
        final_subject = subject
        final_html = html

        if not skip_translation and isinstance(to, str):
            # Get user's language preference
            user_language = get_user_language_preference(recipient_email)
            
            # Only translate if not English
            if user_language != 'en':
                logger.info(f"Translating email for {recipient_email} to {user_language}")
                translated = translate_email_content(subject, html, user_language)
                final_subject = translated['subject']
                final_html = translated['html']
        
        params = {
            "from": from_email,
            "to": to if isinstance(to, list) else [to],
            "subject": final_subject,
            "html": final_html,
        }
        
        if reply_to:
            params["reply_to"] = reply_to
            
        response = resend.Emails.send(params)
        logger.info(f"Email sent successfully to {to}")
        logger.info(f"Email ID: {response.get('id')}")
        return response
        
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        raise


def send_beta_announcement(
    to: str,
    user_name: str,
    beta_end_date: str,
    is_test: bool = False,
) -> dict:
    """
    Send the beta end announcement email (30-day notice).
    
    Args:
        to: Recipient email address
        user_name: User's display name
        beta_end_date: Human-readable beta end date (e.g., "November 15, 2025")
        is_test: If True, adds [TEST] to subject line
        
    Returns:
        Response from Resend API
    """
    subject = f"{'[TEST] ' if is_test else ''}🎉 Thank You for Beta Testing Dicta-Notes - Important Update"
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beta End Announcement</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Dicta-Notes</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">Hi {user_name},</p>
                            
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                Thank you for being an early supporter of Dicta-Notes! Your feedback during our beta period has been invaluable in shaping the product.
                            </p>
                            
                            <div style="background-color: #fff4e6; border-left: 4px solid #ff9500; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: 600;">
                                    📅 Important Date: {beta_end_date}
                                </p>
                                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                    Our beta period ends on this date, and we'll be transitioning to our paid tier structure.
                                </p>
                            </div>
                            
                            <h2 style="margin: 30px 0 20px; color: #333333; font-size: 20px; font-weight: 600;">
                                🎁 Your Exclusive Beta Discount
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                As a thank you, we're offering all beta users a <strong>10% lifetime discount</strong> on any paid plan. This discount will apply automatically when you upgrade - no code needed!
                            </p>
                            
                            <div style="background-color: #f0f9ff; padding: 20px; margin: 30px 0; border-radius: 4px; text-align: center;">
                                <p style="margin: 0 0 10px; color: #333333; font-size: 18px; font-weight: 600;">
                                    Your Discounted Pricing:
                                </p>
                                <p style="margin: 10px 0; color: #666666; font-size: 14px;">
                                    <strong>Individual:</strong> $4.49/mo <span style="text-decoration: line-through; color: #999;">(was $4.99)</span><br>
                                    <strong>Professional:</strong> $8.99/mo <span style="text-decoration: line-through; color: #999;">(was $9.99)</span><br>
                                    <strong>Business:</strong> $44.99/mo <span style="text-decoration: line-through; color: #999;">(was $49.99)</span>
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://dicta-notes.com/pricing" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                    View Pricing & Upgrade
                                </a>
                            </div>
                            
                            <h2 style="margin: 30px 0 20px; color: #333333; font-size: 20px; font-weight: 600;">
                                What happens next?
                            </h2>
                            
                            <ul style="margin: 0 0 20px; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                                <li style="margin-bottom: 10px;">Your account and all your sessions are completely safe</li>
                                <li style="margin-bottom: 10px;">If you don't upgrade, you'll automatically move to our Free plan (30 min/month)</li>
                                <li style="margin-bottom: 10px;">Your 10% lifetime discount will be waiting whenever you're ready to upgrade</li>
                                <li style="margin-bottom: 10px;">We'll send you reminders at 14 days, 7 days, and 1 day before the beta ends</li>
                            </ul>
                            
                            <p style="margin: 30px 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                Thank you again for being part of our journey. We're excited to continue serving you!
                            </p>
                            
                            <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Best regards,<br>
                                <strong>The Dicta-Notes Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; color: #666666; font-size: 12px; text-align: center;">
                                Questions? Reply to this email or visit our <a href="https://dicta-notes.com/contact" style="color: #667eea; text-decoration: none;">contact page</a>
                            </p>
                            <p style="margin: 0 0 15px; color: #999999; font-size: 11px; text-align: center;">
                                © 2025 Dicta-Notes. All rights reserved.
                            </p>
                            <!-- Legal Unsubscribe Section -->
                            <div style="margin: 20px 0 0; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                                <p style="margin: 0 0 8px; color: #999999; font-size: 11px; text-align: center;">
                                    You're receiving this because you signed up for Dicta-Notes beta.
                                </p>
                                <p style="margin: 0; color: #999999; font-size: 11px; text-align: center;">
                                    <a href="https://dicta-notes.com/unsubscribe?email={to}" style="color: #667eea; text-decoration: underline;">Unsubscribe from marketing emails</a> | 
                                    <a href="https://dicta-notes.com/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    return send_email(
        to=to,
        subject=subject,
        html=html,
        reply_to="info@dicta-notes.com",
    )
