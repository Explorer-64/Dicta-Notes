# src/app/apis/support/__init__.py
import logging
from fastapi import APIRouter, HTTPException, Depends

logger = logging.getLogger("dicta.support")
from pydantic import BaseModel, EmailStr
import os
from app.auth import AuthorizedUser
from app.apis.firebase import get_firestore_db
from app.libs.secret_manager import get_secret
from app.libs.email_helper import send_email
import time
from typing import List, Optional

router = APIRouter()

# --- Pydantic Models ---
class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr # Ensures valid email format
    subject: str
    message: str

class ContactFormResponse(BaseModel):
    message: str

class ContactSubmission(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    timestamp: float
    replied: bool = False
    replied_at: float | None = None

class ContactSubmissionsResponse(BaseModel):
    submissions: List[ContactSubmission]

class MarkRepliedResponse(BaseModel):
    success: bool
    message: str

# --- API Endpoint ---
@router.post("/submit-contact-form", response_model=ContactFormResponse)
async def submit_contact_form(form_data: ContactFormRequest, user: Optional[AuthorizedUser] = None):
    """
    Receives contact form data and sends it via email to the support address.
    Works for both authenticated and anonymous users.
    """
    support_email = get_secret("SUPPORT_EMAIL")

    if not support_email:
        logger.error("SUPPORT_EMAIL secret is not set")
        raise HTTPException(status_code=500, detail="Server configuration error.")
    
    # Store in Firestore for admin dashboard
    try:
        firestore_db = get_firestore_db()
        if firestore_db:
            submissions_ref = firestore_db.collection('contact_submissions')
            submission_data = {
                'name': form_data.name,
                'email': form_data.email,
                'subject': form_data.subject,
                'message': form_data.message,
                'timestamp': time.time(),
                'replied': False,
                'replied_at': None
            }
            submissions_ref.add(submission_data)
            logger.info("Contact submission stored in Firestore for %s", form_data.email)
    except Exception as e:
        logger.warning("Failed to store submission in Firestore: %s", e)
        # Continue even if Firestore storage fails - email is more important

    # Prepare email content
    email_subject = f"Support Request: {form_data.subject}"
    content_text = f"""
    New contact form submission:

    Name: {form_data.name}
    Email: {form_data.email}
    Subject: {form_data.subject}

    Message:
    --------------------
    {form_data.message}
    --------------------
    """
    # Use a simple HTML version for better formatting in email clients
    content_html = f"""
    <html>
    <body>
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> {form_data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:{form_data.email}">{form_data.email}</a></p>
        <p><strong>Subject:</strong> {form_data.subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px;">{form_data.message}</pre>
    </body>
    </html>
    """

    try:
        logger.info("Sending contact form email to %s", support_email)
        send_email(
            to=support_email,
            subject=email_subject,
            html=content_html,
            skip_translation=True,
        )
        logger.info("Contact form email sent successfully")
        return ContactFormResponse(message="Your message has been sent successfully. We'll get back to you soon!")
    except Exception as e:
        logger.error("Failed to send contact form email: %s", e)
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again later.") from e


@router.get("/contact-submissions", response_model=ContactSubmissionsResponse)
async def get_contact_submissions(user: AuthorizedUser):
    """
    Fetch all contact form submissions from Firestore.
    Only accessible by authenticated admin users.
    """
    try:
        firestore_db = get_firestore_db()
        if not firestore_db:
            raise HTTPException(status_code=500, detail="Firestore not available")
        
        submissions_ref = firestore_db.collection('contact_submissions')
        # Order by timestamp descending (newest first)
        query = submissions_ref.order_by('timestamp', direction='DESCENDING').limit(100)
        docs = query.stream()
        
        submissions = []
        for doc in docs:
            data = doc.to_dict()
            submissions.append(ContactSubmission(
                id=doc.id,
                name=data.get('name', ''),
                email=data.get('email', ''),
                subject=data.get('subject', ''),
                message=data.get('message', ''),
                timestamp=data.get('timestamp', 0),
                replied=data.get('replied', False),
                replied_at=data.get('replied_at')
            ))
        
        logger.info("Fetched %d contact submissions for admin", len(submissions))
        return ContactSubmissionsResponse(submissions=submissions)
        
    except Exception as e:
        logger.error("Error fetching contact submissions: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to fetch submissions: {str(e)}")


@router.post("/mark-submission-replied/{submission_id}", response_model=MarkRepliedResponse)
async def mark_submission_replied(submission_id: str, user: AuthorizedUser):
    """
    Mark a contact form submission as replied.
    Only accessible by authenticated admin users.
    """
    try:
        firestore_db = get_firestore_db()
        if not firestore_db:
            raise HTTPException(status_code=500, detail="Firestore not available")
        
        submission_ref = firestore_db.collection('contact_submissions').document(submission_id)
        submission_ref.update({
            'replied': True,
            'replied_at': time.time()
        })
        
        logger.info("Marked submission %s as replied", submission_id)
        return MarkRepliedResponse(success=True, message="Submission marked as replied")
        
    except Exception as e:
        logger.error("Error marking submission as replied: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to update submission: {str(e)}")
