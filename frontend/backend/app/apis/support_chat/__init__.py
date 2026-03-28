import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger("dicta.support_chat")
from app.apis.gemini_client import get_gemini_client
from typing import List, Optional
import time
from datetime import datetime
from app.libs.secret_manager import get_secret
from app.libs.email_helper import send_email

try:
    from firebase_admin import firestore
    from app.apis.firebase import get_firestore_db
    FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    FIREBASE_ADMIN_AVAILABLE = False

router = APIRouter()

try:
    gemini_api_key = get_secret("GEMINI_API_KEY")
except Exception:
    gemini_api_key = None

# Rate limiting configuration
RATE_LIMIT_REQUESTS = 30  # Max requests per hour per IP (conservative for AI chat)
rate_limit_store = {}  # In-memory store for rate limiting

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None

class SupportChatRequest(BaseModel):
    message: str
    current_page: Optional[str] = None
    chat_history: List[ChatMessage] = []

class SupportChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    escalate_to_support: Optional[bool] = False
    detected_language: Optional[str] = None

class SupportEscalationRequest(BaseModel):
    user_name: str
    user_email: str
    conversation_context: str
    current_issue: str

class SupportEscalationResponse(BaseModel):
    success: bool
    message: str

def check_rate_limit(client_ip: str) -> bool:
    """Check if client IP is within rate limits"""
    current_time = time.time()
    hour_ago = current_time - 3600  # 1 hour ago
    
    # Clean old entries
    if client_ip in rate_limit_store:
        rate_limit_store[client_ip] = [req_time for req_time in rate_limit_store[client_ip] if req_time > hour_ago]
    else:
        rate_limit_store[client_ip] = []
    
    # Check if within limit
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    
    # Record this request
    rate_limit_store[client_ip].append(current_time)
    return True

# Language detection helper
async def detect_language(text: str) -> str:
    """Detect the language of user text using Gemini"""
    try:
        if not gemini_api_key:
            return "en"  # Default to English
            
        model = get_gemini_client('gemini-2.5-flash')
        prompt = f"""Identify the language of this text and return ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'zh', 'fr').
Don't include any explanations, just the code.

Text: {text}"""
        
        response = model.generate_content(prompt)
        detected_lang = response.text.strip().lower()
        
        # Validate it's a reasonable language code (2-3 chars)
        if len(detected_lang) in [2, 3] and detected_lang.isalpha():
            return detected_lang
        return "en"  # Fallback
        
    except Exception as e:
        logger.warning("Language detection error: %s", e)
        return "en"  # Fallback to English

# Check if escalation is needed
def should_escalate_to_support(message: str, chat_history: List[ChatMessage]) -> bool:
    """Determine if the conversation should be escalated to human support"""
    escalation_keywords = [
        "speak to human", "human support", "contact support", "escalate", "transfer",
        "talk to human", "talk to a human", "speak to someone", "real person", "human agent",
        "speak with human", "speak with someone", "talk with human", "talk with someone",
        "human help", "person help", "live support", "live agent",
        "not helping", "doesn't work", "still broken", "frustrated",
        "billing", "account problem", "can't login", "payment",
        "delete account", "cancel subscription", "refund",
        "bug report", "technical issue", "not working"
    ]
    
    message_lower = message.lower()
    
    # Check for escalation keywords
    for keyword in escalation_keywords:
        if keyword in message_lower:
            return True
    
    # Check if user has asked the same question multiple times
    if len(chat_history) >= 4:
        recent_user_messages = [msg.content.lower() for msg in chat_history[-4:] if msg.role == 'user']
        if len(set(recent_user_messages)) <= 2:  # Repeated similar questions
            return True
    
    return False

@router.post("/chat")
async def support_chat(request: SupportChatRequest, client_request: Request) -> SupportChatResponse:
    """Handle support chat requests with Gemini AI"""
    
    # Rate limiting check
    client_ip = client_request.client.host if client_request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per hour. Please try again later."
        )
    
    if not gemini_api_key:
        return SupportChatResponse(
            response="I'm sorry, but the chat service is currently unavailable. Please contact support directly.",
            suggestions=[],
            escalate_to_support=True
        )
    
    try:
        # Detect user's language
        detected_language = await detect_language(request.message)
        
        # Check if escalation is needed
        needs_escalation = should_escalate_to_support(request.message, request.chat_history)
        
        # Create Gemini model
        model = get_gemini_client('gemini-2.5-flash')
        
        # Build context-aware system prompt with language instruction
        system_prompt = f"""
You are Dicta, a helpful support assistant for Dicta-Notes, an AI-powered transcription app.

IMPORTANT: The user is communicating in language code '{detected_language}'. You MUST respond in the same language as the user's message.

Introduce yourself as "Dicta" when greeting users or when it feels natural in conversation.

Key features of Dicta-Notes:

**DUAL-LAYER RECORDING ARCHITECTURE:**
- **Layer 1 - Browser Speech (UX)**: Real-time visual feedback during recording so you can follow along with the conversation as it happens. This is for UX only, not the final transcript.
- **Layer 2 - Traditional Recording (Backbone)**: Captures the complete audio of your meeting and saves it to secure cloud storage for processing.
- When you record, you see instant text feedback while the system reliably captures everything in the background.

**ON-DEMAND TRANSCRIPTION:**
- After recording, navigate to your session detail page to process the audio
- Powered by Google Gemini 2.5 (Flash and Pro models) for extremely accurate transcription in virtually all languages
- Automatic speaker identification and labeling
- Edit speaker names after transcription is complete
- View transcript, play audio, and take notes all in one place

**TRANSLATION (130+ LANGUAGES):**
- Translate any transcription to 130+ languages using Google Translation
- Available on session detail page after transcription
- Supports both common and rare languages worldwide

**EXPORT OPTIONS:**
- PDF: Professional formatted document
- Word: Editable .docx format for further editing
- Text: Plain text export
- Markdown: Formatted markdown file

**SESSION MANAGEMENT:**
- View all saved recordings in /sessions page
- Filter by Client, Project, Tags, or Notes
- Three tabs: All Sessions, With Documents, With Audio
- Click "View Details" to see individual session

**FREELANCER FEATURES:**
- Set user type to "Freelancer" in Settings → Profile
- Track sessions by client name
- Add client-specific notes during recording
- Organize work by client projects

**PWA INSTALLATION:**
- Install Dicta-Notes as a desktop or mobile app
- Works offline with service workers
- Faster performance and app-like experience
- Platform-specific guides available at /install

**USER SETTINGS:**
- Features: Enable/disable specific modules
- Profile: Set user type (Standard/Freelancer)
- Security: Change password
- Appearance: Theme selection (Light/Dark/System)

Current page context: {request.current_page or 'Unknown'}

Common issues and solutions:
1. Recording Problems:
   - Check microphone permissions in browser
   - Ensure microphone is not being used by other apps
   - Try refreshing the page if audio doesn't start
   - Choose between Microphone or System/Tab Audio source

2. Transcription Quality:
   - Browser speech (live feedback) is for following along only
   - Final transcription uses Google Gemini 2.5 (Flash and Pro models) for high accuracy
   - Speak clearly and at moderate pace
   - Minimize background noise
   - Ensure good microphone quality

3. Speaker Identification:
   - Google Gemini 2.5 automatically identifies speakers during on-demand transcription
   - Allow a few seconds between different speakers for better accuracy
   - Use "Edit Speakers" feature on session detail page to rename speakers after transcription
   - Speaker names can be updated anytime

4. Session Management:
   - All recordings saved to /sessions page
   - Use filters to find specific sessions
   - Click "View Details" to process and view transcription
   - Delete old sessions to free up storage

5. Browser Compatibility:
   - Works best with Chrome, Edge, Brave, Firefox, Safari
   - Requires modern browser with audio recording support
   - Enable microphone permissions when prompted

6. Translation:
   - Available after transcription is complete
   - Supports 130+ languages via Google Translation
   - Translate button appears on session detail page

7. Account Management:
   - You can delete your account permanently from the Settings page
   - Go to Settings -> Delete Account (in the Danger Zone at the bottom)
   - This action is irreversible and immediately deletes all your sessions and data
   - If you have an active subscription, remember to cancel it in PayPal to avoid future charges

Escalation Guidelines:
- When users need human support, you can:
  1. Trigger the escalation form (set escalate_to_support to true)
  2. Direct them to the contact page at: /contact
- Never use placeholder text like "[Link to form]"

Provide helpful, concise responses in the user's language. If the user asks about features not yet implemented, explain that they're planned for future releases. Always be friendly and professional.
"""
        
        # Build conversation history for Gemini
        conversation = []
        
        # Add recent chat history (last 5 messages to keep context manageable)
        recent_history = request.chat_history[-5:] if request.chat_history else []
        for msg in recent_history:
            if msg.role == 'user':
                conversation.append({"role": "user", "parts": [msg.content]})
            elif msg.role == 'assistant':
                conversation.append({"role": "model", "parts": [msg.content]})
        
        # Ask Gemini to respond and decide on escalation
        chat = model.start_chat(history=conversation)
        full_response = chat.send_message(f"{system_prompt}\n\nUser: {request.message}")
        ai_response = full_response.text.strip()
        
        # Let Gemini decide if escalation is needed based on its response
        escalation_indicators = [
            "contact page", "support team", "human support", "support form",
            "trigger the form", "fill out", "escalate", "/contact"
        ]
        gemini_wants_escalation = any(indicator.lower() in ai_response.lower() for indicator in escalation_indicators)
        
        # Use Gemini's decision, fallback to automatic detection for obvious cases
        should_escalate = gemini_wants_escalation or needs_escalation
        
        # Generate contextual suggestions based on current page and language
        suggestions = []
        if request.current_page:
            if "record" in request.current_page.lower() or "home" in request.current_page.lower():
                suggestions = [
                    "How do I start recording?",
                    "Microphone not working",
                    "Speaker identification issues"
                ]
            elif "session" in request.current_page.lower():
                suggestions = [
                    "How to export transcription?",
                    "Edit speaker names",
                    "Transcription accuracy"
                ]
            else:
                suggestions = [
                    "How does Dicta-Notes work?",
                    "Recording troubleshooting",
                    "Browser compatibility"
                ]
        else:
            suggestions = [
                "Getting started guide",
                "Common recording issues",
                "Feature overview"
            ]
        
        # Add escalation suggestion if needed
        if should_escalate:
            if detected_language == "es":
                suggestions.append("Hablar con soporte humano")
            elif detected_language == "fr":
                suggestions.append("Parler au support humain")
            elif detected_language == "de":
                suggestions.append("Mit menschlichem Support sprechen")
            else:
                suggestions.append("Speak to human support")
        
        return SupportChatResponse(
            response=ai_response,
            suggestions=suggestions,
            escalate_to_support=should_escalate,
            detected_language=detected_language
        )
        
    except Exception as e:
        logger.error("Error in support chat: %s", str(e))
        return SupportChatResponse(
            response="I'm experiencing some technical difficulties right now. Please try again in a moment or contact support if the issue persists.",
            suggestions=[
                "Try refreshing the page",
                "Contact support directly",
                "Check our FAQ"
            ],
            escalate_to_support=True
        )

@router.post("/escalate")
async def escalate_to_support(request: SupportEscalationRequest) -> SupportEscalationResponse:
    """Forward conversation to human support via contact form"""
    try:
        # Prepare escalation email
        subject = f"Support Chat Escalation - {request.current_issue}"
        message = f"""A user has requested escalation from the AI support chat.

User Details:
Name: {request.user_name}
Email: {request.user_email}
Current Issue: {request.current_issue}

Conversation Context:
{request.conversation_context}

Please follow up with this user directly."""
        
        support_email = get_secret("SUPPORT_EMAIL")
        if not support_email:
            return SupportEscalationResponse(
                success=False,
                message="Support escalation is currently unavailable. Please contact us directly."
            )

        # Send email to support team
        send_email(
            to=support_email,
            subject=subject,
            html=f"<pre>{message}</pre>",
            skip_translation=True,
        )
        
        return SupportEscalationResponse(
            success=True,
            message="Your conversation has been forwarded to our support team. They will contact you directly within 24 hours."
        )
        
    except Exception as e:
        logger.error("Error escalating to support: %s", str(e))
        return SupportEscalationResponse(
            success=False,
            message="Unable to forward to support at this time. Please contact us directly."
        )

@router.get("/quick-help")
async def get_quick_help() -> dict:
    """Get quick help topics for the support chat"""
    return {
        "topics": [
            {
                "title": "Getting Started",
                "description": "Learn how to use Dicta-Notes for the first time",
                "questions": [
                    "How do I start recording?",
                    "What browsers are supported?",
                    "How does speaker identification work?"
                ]
            },
            {
                "title": "Recording Issues", 
                "description": "Troubleshoot common recording problems",
                "questions": [
                    "Microphone not working",
                    "No audio being detected",
                    "Recording stops unexpectedly"
                ]
            },
            {
                "title": "Transcription Quality",
                "description": "Improve transcription accuracy and speaker identification",
                "questions": [
                    "How to improve transcription accuracy?",
                    "Speaker names are wrong",
                    "Missing words in transcription"
                ]
            },
            {
                "title": "Account & Data",
                "description": "Questions about your account and data management",
                "questions": [
                    "How to export transcriptions?",
                    "Where is my data stored?",
                    "How to delete old sessions?",
                    "How do I delete my account?"
                ]
            }
        ]
    }
