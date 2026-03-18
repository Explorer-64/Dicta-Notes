from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse, RedirectResponse
import datetime

router = APIRouter()

@router.get("/sitemap.xml")
def get_sitemap():
    """Generate a standard sitemap.xml for search engines"""
    base_url = "https://dicta-notes.com"
    
    # Fresh timestamp for recently updated language pages (MYA-560 fix)
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    # Older timestamp for pages that haven't changed
    older_date = "2024-10-01"
    
    # Define all public pages with their details (use actual lowercase routes)
    pages = [
        {"url": "", "priority": "1.0", "changefreq": "weekly", "lastmod": older_date},
        {"url": "ai-benefits", "priority": "0.8", "changefreq": "monthly", "lastmod": older_date},
        {"url": "comparison", "priority": "0.9", "changefreq": "weekly", "lastmod": older_date},
        {"url": "install-options", "priority": "0.7", "changefreq": "monthly", "lastmod": older_date},
        {"url": "install", "priority": "0.7", "changefreq": "monthly", "lastmod": older_date},
        {"url": "instructions", "priority": "0.7", "changefreq": "monthly", "lastmod": older_date},
        {"url": "non-profit-solutions", "priority": "0.7", "changefreq": "monthly", "lastmod": older_date},
        {"url": "pricing", "priority": "0.9", "changefreq": "monthly", "lastmod": older_date},
        {"url": "getting-started-guide", "priority": "0.8", "changefreq": "monthly", "lastmod": older_date},
        {"url": "recording-guide", "priority": "0.8", "changefreq": "monthly", "lastmod": older_date},
        {"url": "video-meetings-guide", "priority": "0.8", "changefreq": "monthly", "lastmod": older_date},
        {"url": "sessions-guide", "priority": "0.8", "changefreq": "monthly", "lastmod": older_date},
        {"url": "companies-guide", "priority": "0.6", "changefreq": "monthly", "lastmod": older_date},
        {"url": "documents-guide", "priority": "0.6", "changefreq": "monthly", "lastmod": older_date},
        {"url": "fa-qs", "priority": "0.7", "changefreq": "monthly", "lastmod": older_date},
        {"url": "contact", "priority": "0.5", "changefreq": "yearly", "lastmod": older_date},
        {"url": "about", "priority": "0.5", "changefreq": "yearly", "lastmod": older_date},
        {"url": "privacy", "priority": "0.3", "changefreq": "yearly", "lastmod": older_date},
        {"url": "terms", "priority": "0.3", "changefreq": "yearly", "lastmod": older_date},
        {"url": "cookie-policy", "priority": "0.3", "changefreq": "yearly", "lastmod": older_date},
        {"url": "cookie-settings", "priority": "0.3", "changefreq": "yearly", "lastmod": older_date},
        # New Landing Pages
        {"url": "multilingual-meetings", "priority": "0.9", "changefreq": "weekly", "lastmod": older_date},
        {"url": "remote-teams", "priority": "0.9", "changefreq": "weekly", "lastmod": older_date},
        {"url": "education", "priority": "0.9", "changefreq": "weekly", "lastmod": older_date},
        # Education landing pages in different languages (MYA-565)
        {"url": "french-education", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "spanish-education", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "german-education", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "greek-education", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "korean-education", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        # Marketing/Creative Teams landing pages in different languages (MYA-565)
        {"url": "marketing", "priority": "0.8", "changefreq": "weekly", "lastmod": today},
        {"url": "marketing-fr", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "marketing-es", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "marketing-de", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "marketing-el", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "marketing-ko", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        # Remote Teams landing pages in different languages (MYA-565)
        {"url": "remote-teams-fr", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "remote-teams-es", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "remote-teams-de", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "remote-teams-el", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        {"url": "remote-teams-ko", "priority": "0.8", "changefreq": "monthly", "lastmod": today},
        # Language landing pages - FRESH TIMESTAMPS for re-crawl after MYA-560 SEO fixes
        {"url": "spanish", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "french", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "german", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "portuguese", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "chinese", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "japanese", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "arabic", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "hindi", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "russian", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "korean", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        # African and Malaysian language pages (MYA-525)
        {"url": "afrikaans", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "malay", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "swahili", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "hausa", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "yoruba", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "zulu", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        # New language pages (MYA-556)
        {"url": "vietnamese", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "bengali", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "turkish", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "thai", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "tagalog", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "indonesian", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "telugu", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "tamil", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "punjabi", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
        {"url": "polish", "priority": "0.9", "changefreq": "monthly", "lastmod": today},
    ]
    
    # Build clean sitemap XML - NO COMMENTS between URLs (Google rejects them)
    sitemap = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'''
    
    # Add each page to the sitemap
    for page in pages:
        url = f"{base_url}/{page['url']}" if page['url'] else base_url
        sitemap += f'''
  <url>
    <loc>{url}</loc>
    <lastmod>{page['lastmod']}</lastmod>
    <changefreq>{page['changefreq']}</changefreq>
    <priority>{page['priority']}</priority>
  </url>'''
    
    sitemap += '''
</urlset>'''
    
    return Response(content=sitemap, media_type="application/xml")

@router.get("/ai-sitemap.xml")
def get_ai_sitemap():
    """Generate an AI-optimized sitemap with enhanced metadata using standard sitemap tags"""
    base_url = "https://dicta-notes.com"
    
    # Current date in ISO format
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    
    # Define all public pages with their details
    pages = [
        {"url": "", "priority": "1.0", "changefreq": "weekly", "description": "Progressive Web App for meeting transcription. Works offline on mobile and desktop. Install without app store. AI transcription with 10+ speaker ID and 130+ language translation."},
        {"url": "ai-benefits", "priority": "0.8", "changefreq": "monthly", "description": "How AI powers offline transcription, speaker identification, and real-time translation in Dicta-Notes PWA."},
        {"url": "comparison", "priority": "0.9", "changefreq": "weekly", "description": "Compare Dicta-Notes PWA features: offline support, mobile-first design, no app store required vs competitors."},
        {"url": "install-options", "priority": "0.7", "changefreq": "monthly", "description": "Choose your installation method for Dicta-Notes PWA on desktop and mobile devices."},
        {"url": "install", "priority": "0.7", "changefreq": "monthly", "description": "Install Dicta-Notes as a PWA on any device for offline access without an app store."},
        {"url": "instructions", "priority": "0.7", "changefreq": "monthly", "description": "Step-by-step instructions for using Dicta-Notes PWA for offline transcription and mobile meeting notes."},
        {"url": "non-profit-solutions", "priority": "0.7", "changefreq": "monthly", "description": "Affordable, easy-to-use transcription solutions for non-profits and community sports associations."},
        {"url": "pricing", "priority": "0.9", "changefreq": "monthly", "description": "Pricing plans for Dicta-Notes PWA, including free individual access and professional tiers."},
        {"url": "getting-started-guide", "priority": "0.8", "changefreq": "monthly", "description": "Quick start guide for Dicta-Notes PWA: install on device, record offline meetings, get AI transcriptions."},
        {"url": "recording-guide", "priority": "0.8", "changefreq": "monthly", "description": "Record meetings offline with Dicta-Notes mobile PWA. Auto-saves every 30 seconds, syncs when online."},
        {"url": "video-meetings-guide", "priority": "0.8", "changefreq": "monthly", "description": "Transcribe video meetings with Dicta-Notes PWA on mobile or desktop. Works offline with speaker identification."},
        {"url": "sessions-guide", "priority": "0.8", "changefreq": "monthly", "description": "Manage transcription sessions in Dicta-Notes PWA. Access offline recordings, export to PDF/Word/Text/Markdown."},
        {"url": "companies-guide", "priority": "0.6", "changefreq": "monthly", "description": "A guide to setting up and managing company workspaces in Dicta-Notes."},
        {"url": "documents-guide", "priority": "0.6", "changefreq": "monthly", "description": "Learn how to manage, export, and share your transcribed documents."},
        {"url": "fa-qs", "priority": "0.7", "changefreq": "monthly", "description": "Frequently asked questions about Dicta-Notes PWA: offline support, mobile compatibility, speaker ID, translation."},
        {"url": "contact", "priority": "0.5", "changefreq": "yearly", "description": "Contact the Dicta-Notes team for support or inquiries."},
        {"url": "about", "priority": "0.5", "changefreq": "yearly", "description": "Learn about the mission and technology behind Dicta-Notes."},
        {"url": "privacy", "priority": "0.3", "changefreq": "yearly", "description": "Our commitment to your data privacy."},
        {"url": "terms", "priority": "0.3", "changefreq": "yearly", "description": "Terms of service for using Dicta-Notes."},
        {"url": "cookie-policy", "priority": "0.3", "changefreq": "yearly", "description": "How we use cookies to improve your experience."},
        {"url": "cookie-settings", "priority": "0.3", "changefreq": "yearly", "description": "Manage your cookie preferences for Dicta-Notes."},
        # New Landing Pages
        {"url": "multilingual-meetings", "priority": "0.9", "changefreq": "weekly", "description": "AI transcription and translation for global and multilingual teams. Supports over 130 languages."},
        {"url": "remote-teams", "priority": "0.9", "changefreq": "weekly", "description": "Boost productivity for remote and distributed teams with asynchronous meeting transcription and automated notes."},
        {"url": "education", "priority": "0.9", "changefreq": "weekly", "description": "Accessible learning with AI-powered lecture transcription. Supports ADA compliance and provides valuable study aids for students."},
        # Remote Teams landing pages in different languages (MYA-565)
        {"url": "remote-teams-fr", "priority": "0.8", "changefreq": "monthly", "description": "Solutions de transcription IA pour équipes distantes. Notes de réunion automatisées et productivité asynchrone."},
        {"url": "remote-teams-es", "priority": "0.8", "changefreq": "monthly", "description": "Soluciones de transcripción IA pour equipos remotos. Notas automáticas de reuniones y productividad asíncrona."},
        {"url": "remote-teams-de", "priority": "0.8", "changefreq": "monthly", "description": "KI-Transkriptionslösungen für Remote-Teams. Automatisierte Meeting-Notizen und asynchrone Produktivität."},
        {"url": "remote-teams-el", "priority": "0.8", "changefreq": "monthly", "description": "Λύσεις μεταγραφής AI για απομακρυσμένες ομάδες. Αυτοματοποιημένες σημειώσεις συναντήσεων και ασύγχρονη παραγωγικότητα."},
        {"url": "remote-teams-ko", "priority": "0.8", "changefreq": "monthly", "description": "원격 팀을 위한 AI 전사 솔루션. 자동화된 회의 노트 및 비동기 생산성."},
        # Marketing/Creative Teams landing pages in different languages (MYA-565)
        {"url": "marketing-fr", "priority": "0.8", "changefreq": "monthly", "description": "Transcription IA pour équipes marketing et créatives. Capturez les sessions de brainstorming et les briefings clients."},
        {"url": "marketing-es", "priority": "0.8", "changefreq": "monthly", "description": "Transcripción IA pour equipos de marketing y creativos. Capture sesiones de lluvia de ideas y briefings de clientes."},
        {"url": "marketing-de", "priority": "0.8", "changefreq": "monthly", "description": "KI-Transkription für Marketing- und Kreativteams. Erfassen Sie Brainstorming-Sitzungen und Kundenbriefings."},
        {"url": "marketing-el", "priority": "0.8", "changefreq": "monthly", "description": "Μεταγραφή AI για ομάδες μάρκετινγκ και δημιουργικές. Καταγράψτε συνεδρίες brainstorming και ενημερώσεις πελατών."},
        {"url": "marketing-ko", "priority": "0.8", "changefreq": "monthly", "description": "마케팅 및 크리에이티브 팀을 위한 AI 전사. 브레인스토밍 세션 및 클라이언트 브리핑 캡처."},
        # Education landing pages in different languages (MYA-565)
        {"url": "french-education", "priority": "0.8", "changefreq": "monthly", "description": "AI transcription for French education. Transform lectures into searchable notes. Perfect for students, professors, universities."},
        {"url": "spanish-education", "priority": "0.8", "changefreq": "monthly", "description": "AI transcription for Spanish education. Real-time lecture transcription with speaker identification for international students."},
        {"url": "german-education", "priority": "0.8", "changefreq": "monthly", "description": "AI transcription for German education. Lecture notes and seminar transcription for students and professors."},
        {"url": "greek-education", "priority": "0.8", "changefreq": "monthly", "description": "AI transcription for Greek education. Accessible learning with automated lecture transcription and study aids."},
        {"url": "korean-education", "priority": "0.8", "changefreq": "monthly", "description": "AI transcription for Korean education. Multi-language support for international students with real-time transcription."},
        # Language landing pages
        {"url": "spanish", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Spanish transcription and translation. Works offline on mobile and desktop."},
        {"url": "french", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with French transcription and translation. Offline mobile app for French meetings."},
        {"url": "german", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with German transcription and translation. Mobile-first offline meeting notes."},
        {"url": "portuguese", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Portuguese transcription and translation. Install on mobile or desktop."},
        {"url": "chinese", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Chinese transcription and translation. Offline capable mobile app."},
        {"url": "japanese", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Japanese transcription and translation. Works offline on all devices."},
        {"url": "arabic", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Arabic transcription and translation. Mobile-optimized offline support."},
        {"url": "hindi", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Hindi transcription and translation. Install on mobile without app store."},
        {"url": "russian", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Russian transcription and translation. Offline mobile meeting transcription."},
        {"url": "korean", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Korean transcription and translation. Mobile-first with offline capability."},
        # African and Malaysian language pages
        {"url": "afrikaans", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Afrikaans transcription and translation. Offline support for mobile and desktop."},
        {"url": "malay", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Malay transcription and translation. Works offline on any device."},
        {"url": "swahili", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Swahili transcription and translation. Mobile-optimized offline transcription."},
        {"url": "hausa", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Hausa transcription and translation. Install on mobile without app store."},
        {"url": "yoruba", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Yoruba transcription and translation. Offline meeting notes on mobile."},
        {"url": "zulu", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Zulu transcription and translation. Mobile-first offline transcription app."},
        # New language pages (MYA-556)
        {"url": "vietnamese", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Vietnamese transcription and translation. Mobile-first with offline capability."},
        {"url": "bengali", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Bengali transcription and translation. Works offline on any device."},
        {"url": "turkish", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Turkish transcription and translation. Mobile-optimized offline transcription."},
        {"url": "thai", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Thai transcription and translation. Install on mobile without app store."},
        {"url": "tagalog", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Tagalog transcription and translation. Offline meeting notes on mobile."},
        {"url": "indonesian", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Indonesian transcription and translation. Mobile-first offline transcription app."},
        {"url": "telugu", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Telugu transcription and translation. Offline support for mobile and desktop."},
        {"url": "tamil", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Tamil transcription and translation. Works offline on any device."},
        {"url": "punjabi", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Punjabi transcription and translation. Mobile-optimized offline transcription."},
        {"url": "polish", "priority": "0.9", "changefreq": "monthly", "description": "Dicta-Notes PWA with Polish transcription and translation. Install on mobile without app store."},
    ]
    
    # Build clean sitemap WITHOUT inter-URL comments (Google rejects them)
    ai_sitemap = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'''
    
    # Add each page WITHOUT description comments between URLs
    for page in pages:
        url = f"{base_url}/{page['url']}" if page['url'] else base_url
        ai_sitemap += f'''
  <url>
    <loc>{url}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{page['changefreq']}</changefreq>
    <priority>{page['priority']}</priority>
  </url>'''
    
    ai_sitemap += '''
</urlset>'''
    
    return Response(content=ai_sitemap, media_type="application/xml")

# 301 Redirects for legacy URLs (MYA-574)
@router.get("/NonProfitSolutions")
def redirect_non_profit_solutions():
    """Redirect legacy /NonProfitSolutions to canonical /non-profit-solutions"""
    return RedirectResponse(url="/non-profit-solutions", status_code=301)

@router.get("/conquering-multilingual-meetings")
def redirect_conquering_multilingual_meetings():
    """Redirect legacy /conquering-multilingual-meetings to canonical /conquering-multilingual-meetings-page"""
    return RedirectResponse(url="/conquering-multilingual-meetings-page", status_code=301)

# 410 Gone for removed page (MYA-574)
@router.get("/view")
def view_gone():
    """Return 410 Gone for legacy /view page that has been permanently removed"""
    return Response(
        content="This page has been permanently removed.",
        status_code=410,
        media_type="text/plain"
    )

# IndexNow notifier: rapidly notify search engines when our sitemaps or URLs change
from pydantic import BaseModel
from typing import List, Optional
from app.libs.indexnow import submit_to_indexnow

class IndexNowRequest(BaseModel):
    urls: Optional[List[str]] = None
    notifySitemaps: bool = True

class IndexNowResponse(BaseModel):
    submitted: List[str]
    status_code: int
    response: str

@router.post("/indexnow/notify")
def notify_indexnow(body: IndexNowRequest) -> IndexNowResponse:
    """
    Notify Bing/Yandex via IndexNow. By default submits both sitemaps and any
    extra URLs provided.
    """
    base = "https://dicta-notes.com"
    urls: List[str] = []
    if body.notifySitemaps:
        urls.extend([
            f"{base}/sitemap.xml",
            f"{base}/ai-sitemap.xml",
        ])
    if body.urls:
        urls.extend(body.urls)

    result = submit_to_indexnow(urls)
    return IndexNowResponse(
        submitted=result.get("submitted", []),
        status_code=result.get("status_code", 500),
        response=result.get("response", ""),
    )
