# Calendar Auto-Join Meeting Recording: Architecture Research

**Date**: October 21, 2024  
**Context**: Dicta-Notes needs a way to automatically join meetings and trigger local audio recording without using expensive cloud bots.

## Problem Statement

Dicta-Notes already captures full meeting audio via system audio locally. We need:
1. Monitor user's calendar (Google Calendar, Outlook)
2. Auto-open meeting links at scheduled times  
3. Trigger local system audio recording
4. Stay invisible (no bot in meeting)
5. Maintain privacy-first, local-first philosophy

## Solution Approaches Researched

### 1. Desktop App (Recommended)

#### Electron vs Tauri Comparison

| Feature | Tauri | Electron |
|---------|-------|----------|
| **Bundle Size** | ~10MB | >100MB |
| **Performance** | Faster (Rust + native webviews) | Slower (bundles Chromium) |
| **Memory** | Lower (uses OS webview) | Higher (Chromium instance) |
| **Security** | Better (Rust memory safety) | Good (but broader Node.js access) |
| **Development** | Rust backend + JS frontend | Full JavaScript/Node.js |
| **Ecosystem** | Growing | Mature, extensive |
| **Cross-platform** | Mac, Windows, Linux | Mac, Windows, Linux |
| **Startup Time** | Fast | Slower |

**Recommendation**: **Tauri** for Dicta-Notes  
- Aligns with "lightweight" philosophy
- Better performance and security
- Smaller download size = less user friction
- Rust can access native audio APIs more directly

#### Calendar Integration

**Google Calendar API:**
```python
# OAuth2 flow to get access token
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly']
flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
credentials = flow.run_local_server(port=0)

# Webhook for real-time updates
# Register watch channel with Google Calendar API
# Receive notifications when events created/updated/deleted
```

**Outlook Calendar (Microsoft Graph API):**
```typescript
// OAuth2 flow
const SCOPES = [
  "Calendars.ReadWrite", "User.Read", "offline_access"
];

// Fetch events
GET https://graph.microsoft.com/v1.0/me/events
Authorization: Bearer {access_token}

// Subscribe to webhooks for real-time updates
```

**Architecture Flow:**
1. Desktop app runs in background (system tray)
2. Webhook from calendar API notifies app of upcoming meeting
3. 5 mins before meeting, app opens meeting link in default browser
4. Sends message to Dicta-Notes PWA to start system audio recording
5. User joins meeting normally, audio captured invisibly

#### System Audio Capture

**Challenge**: Cross-platform system audio is complex

**Platform-Specific Solutions:**
- **macOS**: BlackHole virtual audio device
- **Windows**: Stereo Mix or VB-Audio Virtual Cable
- **Linux**: PulseAudio loopback module

**For Dicta-Notes:**
- ✅ PWA already captures system audio successfully
- Desktop app's role: trigger PWA to start/stop recording
- No need to re-implement audio capture in desktop app

#### System Tray & Auto-Launch

**Tauri System Tray Example:**
```rust
use tauri::{Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};

let tray_menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("open", "Open Dicta-Notes"))
    .add_item(CustomMenuItem::new("quit", "Quit"));

let system_tray = SystemTray::new().with_menu(tray_menu);

// Runs invisibly in background
// Shows icon in menu bar (Mac) or notification area (Windows)
```

**Auto-Launch:**
- Both Tauri and Electron support auto-start on login
- Platform-specific: Launch Agents (Mac), Startup folder (Windows), autostart (Linux)
- Tauri plugin available for cross-platform auto-launch

### 2. Browser Extension (Alternative)

#### Capabilities

**Chrome:**
- ✅ Calendar integration via Google Calendar API
- ✅ Can open meeting links automatically
- ✅ Tab audio capture (Chrome Audio Capture extension)
- ⚠️ Max recording duration: 60-120 minutes (memory limit)
- ✅ Easy distribution (Chrome Web Store)

**Firefox:**
- ✅ Calendar integration possible
- ✅ Auto-join extensions exist (G-Meet Auto Join)
- ⚠️ Limited tab audio capture tools
- ⚠️ Smaller user base

#### Limitations

❌ **Cannot capture system audio** - only tab audio  
❌ **Tab audio != full meeting audio** - misses notifications, other apps  
❌ **Privacy concerns** - browser extensions with audio recording permissions are security risks  
❌ **User friction** - must keep browser tab open during meeting  
❌ **Platform dependent** - only works if user uses that specific browser  

**Verdict**: Browser extension alone is insufficient for Dicta-Notes' needs.

### 3. PWA + Service Workers (Current Approach)

#### What PWAs Can Do

✅ **Offline functionality** - cached assets work offline  
✅ **Background Sync** - queue actions while offline, sync when online  
✅ **Push Notifications** - server can send meeting reminders  
⚠️ **Limited background execution** - service workers are event-driven, not persistent  

#### What PWAs Cannot Do

❌ **Time-based triggers** - cannot run code at specific time while offline/closed  
❌ **Auto-join meetings** - cannot open external links without user interaction  
❌ **True background process** - service worker sleeps when inactive  
❌ **Calendar monitoring** - cannot poll calendar while app is closed  

**Verdict**: PWA is great for recording UI and audio capture, but needs companion desktop app for auto-join.

### 4. AI Device Control (Anthropic Computer Use)

#### What It Is

- Claude 3.5+ can control desktop like a human
- Sees screen via screenshots, moves mouse, clicks buttons, types text
- Available via API, requires Docker + virtual desktop environment
- Chrome extension (Claude for Chrome) in development (2025)

#### Potential Use Case

```python
import anthropic

client = anthropic.Anthropic(api_key="...")

# Claude can:
# 1. Monitor calendar UI in browser
# 2. Click "Join Meeting" button at scheduled time
# 3. Navigate meeting UI (unmute, etc.)
# 4. Signal Dicta-Notes PWA to start recording
```

#### Reality Check

**Pros:**
- Cutting-edge differentiation
- Could handle complex meeting UIs
- Works with any meeting platform

**Cons:**
- Still experimental (beta)
- Complex setup (Docker, virtual desktop)
- Error-prone, needs detailed prompting
- Expensive (API costs per action)
- Overkill for simple "open URL at time X" task

**Recommendation**: Interesting for future, but not pragmatic for v1. A lightweight Tauri app with calendar webhooks is simpler and more reliable.

## Competitor Analysis: Otter.ai

### How Otter Works

**Desktop App (Mac, Windows coming):**
- Runs in background
- Connects to Google Calendar/Outlook
- Auto-joins meetings as scheduled
- Captures system audio directly (bot-free recording)

**Bot Mode (Alternative):**
- Joins as visible participant
- Used when desktop app not available or user prefers

**Key Insight**: Otter offers BOTH options, but desktop app is the premium experience for "invisible" recording.

## Recommended Architecture for Dicta-Notes

### Phase 1: Tauri Desktop App (MVP)

**Components:**
1. **Tauri background app** (~10MB download)
   - Runs in system tray
   - OAuth integration with Google Calendar & Outlook
   - Webhook subscriptions for real-time event updates
   - Auto-launch on login (optional user setting)

2. **Calendar monitoring service**
   - Polls for upcoming meetings (or receives webhook notifications)
   - 5 minutes before meeting: opens meeting link in default browser

3. **PWA integration**
   - Desktop app sends message to PWA: `{action: "start_recording", meeting_id: "..."}`
   - PWA starts system audio capture (existing functionality)
   - After meeting, PWA sends `{action: "stop_recording"}`

**User Experience:**
1. Install Tauri app (one-time, ~10MB)
2. Connect calendar (OAuth, one-time)
3. Enable auto-launch (optional)
4. Forget about it - meetings auto-join, audio auto-records

**Development Effort:**
- Tauri app: 2-3 weeks (Rust backend + simple settings UI)
- Calendar API integration: 1 week (OAuth + webhooks)
- PWA messaging: 3 days (add listener for desktop app commands)
- Testing across platforms: 1 week
- **Total: ~6 weeks for MVP**

### Phase 2: Enhanced Features (Future)

- AI-powered meeting detection (Computer Use API)
- Automatic mute/unmute based on speaker detection
- Meeting prep reminders with AI-generated agendas
- Multi-calendar support

## Technical Blockers & Mitigations

### Blocker 1: Calendar OAuth Complexity
**Issue**: Users must grant calendar access, understand OAuth flow  
**Mitigation**: Simple onboarding UI, "Connect Calendar" button, clear privacy policy

### Blocker 2: Cross-Platform Audio Routing
**Issue**: System audio capture requires virtual audio devices  
**Mitigation**: Dicta-Notes PWA already solves this! Desktop app just triggers it.

### Blocker 3: Meeting Link Detection
**Issue**: Calendar events have meeting links in various formats (Zoom, Teams, Meet)  
**Mitigation**: Regex parsing for common patterns, fallback to event description URL extraction

### Blocker 4: Code Signing & Distribution
**Issue**: Desktop apps need code signing for security (costs money, complex)  
**Mitigation**: 
- Start with unsigned builds for beta users
- Add code signing once traction proven ($99/year Apple, ~$200/year Windows)

## Cost Analysis

### Desktop App (Tauri)
- **Development**: ~6 weeks (already accounted for)
- **Code Signing**: $300/year (Apple + Windows certificates)
- **Distribution**: Free (direct download from website)
- **Maintenance**: Low (calendar APIs stable, Tauri auto-update built-in)

### Browser Extension
- **Development**: ~2 weeks
- **Chrome Web Store**: $5 one-time fee
- **Firefox Add-ons**: Free
- **Maintenance**: Medium (browser updates can break extensions)
- **Limitation**: Insufficient for full system audio capture

### Cloud Bot (For Comparison)
- **Build In-House**: $420k (6 engineers × 12 months × $70k/year ÷ 12)
- **Third-Party (Recall.ai)**: $0.70/hour + $266/year = ~$14k/year for 1,000 hours
- **Ongoing**: High maintenance, platform updates break bots

**Verdict**: Desktop app is 95% cheaper than cloud bot, provides better UX (invisible recording).

## Decision Matrix

| Criteria | Desktop App (Tauri) | Browser Extension | PWA Alone | Cloud Bot |
|----------|---------------------|-------------------|-----------|----------|
| **Auto-join meetings** | ✅ Yes | ⚠️ Partial | ❌ No | ✅ Yes |
| **System audio capture** | ✅ Via PWA trigger | ❌ Tab only | ✅ Yes | ✅ Yes |
| **Invisible recording** | ✅ Yes | ⚠️ Tab dependent | ✅ Yes | ❌ Visible bot |
| **User friction** | Low (one install) | Low (add to browser) | None | None |
| **Cross-platform** | ✅ Mac, Win, Linux | ⚠️ Browser-dependent | ✅ All | ✅ All |
| **Privacy-first** | ✅ Local | ⚠️ Browser perms risky | ✅ Local | ❌ Cloud |
| **Development cost** | ~$50k (6 weeks) | ~$17k (2 weeks) | $0 | $420k or $14k/year |
| **Maintenance** | Low | Medium | Low | High |
| **Competitive differentiator** | ✅ Yes | ❌ No | ❌ No | ❌ No |

## Final Recommendation

**Build a Tauri desktop app that:**
1. Monitors user's calendar via OAuth + webhooks
2. Opens meeting links 5 minutes before scheduled time
3. Sends message to Dicta-Notes PWA to start/stop recording
4. Runs invisibly in system tray
5. Auto-launches on login (optional)

**Why Tauri over Electron:**
- 90% smaller download size (better first-run experience)
- Better performance (less battery drain for background app)
- Aligns with Dicta-Notes' lightweight, privacy-first philosophy
- Easier to maintain long-term

**Why Desktop App over Browser Extension:**
- System audio capture (extension limited to tab audio)
- Works regardless of which browser user uses
- More reliable auto-launch and background monitoring
- Better privacy story (no browser extension permissions concerns)

**Next Steps:**
1. Validate approach with 5-10 beta users (would they install a desktop app?)
2. Build Tauri MVP (6 weeks)
3. Test on Mac, Windows, Linux
4. Iterate based on feedback
5. Consider AI Computer Use for Phase 2 (once API more stable)

## References

- Tauri vs Electron: https://tauri.app/v1/guides/
- Google Calendar API: https://developers.google.com/workspace/calendar
- Microsoft Graph Calendar: https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview
- Anthropic Computer Use: https://www.anthropic.com/news/developing-computer-use
- Otter.ai Desktop App: https://otter.ai/blog/introducing-the-otter-desktop-app
