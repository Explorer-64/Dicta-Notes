"""
Meeting Bot Calendar Integration - Architecture Research
Task: MYA-578
Date: October 21, 2025

This document provides a comprehensive analysis of how to implement calendar integration
with auto-join meeting bots, based on research into competitor solutions and available APIs.
"""

# ============================================================================
# 1. TECHNICAL OVERVIEW: HOW MEETING BOTS WORK
# ============================================================================

"""
ARCHITECTURE COMPONENTS:

1. Calendar Integration Layer
   - OAuth authentication with Google Calendar / Microsoft Outlook
   - Webhook subscriptions for real-time event notifications
   - Event parsing to extract meeting URLs, times, participants

2. Meeting Platform Integration Layer
   - Platform-specific SDKs/APIs (Zoom, Teams, Meet)
   - Bot authentication and meeting joining logic
   - Audio/video stream capture

3. Processing Pipeline
   - Real-time audio streaming from bot to backend
   - Transcription service (Google Gemini 2.5 in our case)
   - Speaker diarization and identification
   - Storage of transcripts and recordings

4. User Management
   - Authorization flows (OAuth consent)
   - Bot preferences (auto-join settings, privacy)
   - Notification system

WORKFLOW:
1. User connects calendar via OAuth → store refresh tokens
2. Backend subscribes to calendar webhooks → receive meeting events
3. Meeting detected → schedule bot to join at start time
4. Bot joins as participant → captures audio stream
5. Audio streamed to transcription service → real-time processing
6. Results stored → user can access via UI
"""

# ============================================================================
# 2. PLATFORM API CAPABILITIES
# ============================================================================

PLATFORM_APIS = {
    "zoom": {
        "official_support": "Yes - Meeting SDK",
        "bot_join_method": "Linux/Windows/macOS SDK",
        "complexity": "HIGH",
        "capabilities": [
            "Full audio/video stream access",
            "Participant metadata",
            "Real-time transcription possible",
            "Screen share capture",
            "Chat messaging (bidirectional)"
        ],
        "limitations": [
            "One bot per SDK instance (requires multiple containers for scale)",
            "Not truly headless (requires SDK client)",
            "App review process required",
            "Complex C++ SDK with Python wrappers needed",
            "Licensed Zoom account required for bot"
        ],
        "authentication": "SDK credentials + OAuth for calendar",
        "scalability": "Manual - need separate process/container per meeting",
        "cost": "Zoom license + infrastructure costs"
    },
    
    "microsoft_teams": {
        "official_support": "Yes - Graph API + Bot Framework",
        "bot_join_method": "Microsoft Graph Calling API",
        "complexity": "MODERATE-HIGH",
        "capabilities": [
            "Join meetings as bot participant",
            "Access to audio/video streams",
            "Meeting metadata and participant info",
            "Real-time events and notifications",
            "Integrated with Teams ecosystem"
        ],
        "limitations": [
            "Bot must be added as attendee",
            "Requires multiple Graph API permissions",
            "Admin consent needed for enterprise use",
            "Complex authentication flow"
        ],
        "authentication": "OAuth 2.0 + Graph API permissions",
        "scalability": "Better than Zoom - managed by Microsoft",
        "cost": "Free API calls (within limits) + infrastructure"
    },
    
    "google_meet": {
        "official_support": "No - NO official bot join API",
        "bot_join_method": "Browser automation (Puppeteer/Playwright)",
        "complexity": "VERY HIGH (fragile)",
        "capabilities": [
            "Can simulate user joining via browser",
            "Screen/audio capture via browser APIs",
            "Access to meeting content"
        ],
        "limitations": [
            "NO OFFICIAL API - unsupported workaround",
            "Fragile - breaks when Google updates UI",
            "CAPTCHA challenges possible",
            "Bot detection mechanisms",
            "Requires real Google account per bot",
            "Rate limiting and account suspension risk",
            "Ongoing maintenance nightmare"
        ],
        "authentication": "Real user OAuth (risky at scale)",
        "scalability": "Poor - high failure rate",
        "cost": "High maintenance + infrastructure",
        "recommendation": "AVOID building in-house for Meet"
    }
}

CALENDAR_APIS = {
    "google_calendar": {
        "api": "Google Calendar API v3",
        "authentication": "OAuth 2.0",
        "webhook_support": "Yes - Push Notifications",
        "capabilities": [
            "Read/write calendar events",
            "Real-time event change notifications",
            "Recurring event support",
            "Attendee management",
            "Meeting URL extraction"
        ],
        "implementation_complexity": "Low-Moderate"
    },
    
    "microsoft_outlook": {
        "api": "Microsoft Graph API",
        "authentication": "OAuth 2.0",
        "webhook_support": "Yes - Graph Subscriptions",
        "capabilities": [
            "Read/write calendar events",
            "Delta queries for efficient sync",
            "Real-time notifications",
            "Teams meeting integration",
            "Room and resource booking"
        ],
        "implementation_complexity": "Low-Moderate"
    }
}

# ============================================================================
# 3. THIRD-PARTY SOLUTIONS (BUILD VS BUY)
# ============================================================================

THIRD_PARTY_OPTIONS = {
    "recall_ai": {
        "pricing": {
            "per_hour": 0.70,
            "platform_fee_annual": 266,
            "transcription_addon": 0.15,  # per hour
            "storage_7days": 0,
            "storage_30days": 0.05,  # per hour
            "free_tier": "5 hours"
        },
        "platforms_supported": [
            "Zoom",
            "Microsoft Teams",
            "Google Meet",
            "Webex",
            "Slack Huddles"
        ],
        "features": [
            "Managed bot infrastructure",
            "Real-time audio/video streams",
            "Transcription with speaker names",
            "Meeting metadata",
            "Screen share data",
            "Bidirectional chat",
            "Output Media (bot can speak/show video)"
        ],
        "compliance": ["SOC 2", "HIPAA"],
        "data_residency": ["US", "EU", "Japan"],
        "pros": [
            "Most mature solution",
            "Handles all platform complexities",
            "Output Media feature unique",
            "Enterprise features available",
            "Proven at scale"
        ],
        "cons": [
            "Annual platform fee",
            "Vendor lock-in",
            "Less control over bot behavior",
            "Ongoing costs per meeting hour"
        ]
    },
    
    "nylas_notetaker": {
        "pricing": {
            "per_hour_1_500": 0.70,
            "per_hour_501_2500": 0.60,
            "per_hour_2501_5000": 0.50,
            "per_hour_5001_10000": 0.40,
            "per_hour_10001_plus": 0.30,
            "platform_fee": 0,
            "transcription_included": True,
            "free_tier_monthly": "10 hours"
        },
        "platforms_supported": [
            "Zoom",
            "Microsoft Teams",
            "Google Meet"
        ],
        "features": [
            "Built-in AI transcription",
            "Speaker diarization included",
            "Calendar integration built-in",
            "One API call if using Nylas Calendar",
            "Real-time audio access"
        ],
        "compliance": ["SOC 2", "HIPAA", "ISO27001", "GDPR"],
        "pros": [
            "No platform fee",
            "Transcription included",
            "Volume discounts (scales to $0.30/hr)",
            "Simpler integration if using Nylas ecosystem",
            "Good for high-volume use cases"
        ],
        "cons": [
            "Less mature than Recall.ai",
            "No Output Media feature",
            "Fewer platform integrations",
            "Still vendor lock-in"
        ]
    }
}

# ============================================================================
# 4. COMPLEXITY ASSESSMENT
# ============================================================================

COMPLEXITY_BREAKDOWN = {
    "calendar_integration": {
        "complexity": "LOW-MODERATE",
        "effort_estimate_days": 5,
        "components": [
            "OAuth flow for Google + Microsoft",
            "Webhook endpoint setup",
            "Event parsing and storage",
            "Token refresh handling"
        ],
        "risks": [
            "Token expiration edge cases",
            "Webhook reliability",
            "Rate limiting"
        ]
    },
    
    "bot_infrastructure_build": {
        "complexity": "VERY HIGH",
        "effort_estimate_months": "6-12",
        "components": [
            "Platform SDK integration (Zoom, Teams)",
            "Bot orchestration system",
            "Scalable container infrastructure",
            "Audio stream processing pipeline",
            "Error handling and retry logic",
            "Monitoring and logging",
            "Security and compliance"
        ],
        "technical_challenges": [
            "Zoom: C++ SDK, requires wrappers, one bot per instance",
            "Teams: Complex Graph API permissions and flows",
            "Meet: NO official API, browser automation fragile",
            "Scaling: Each meeting needs isolated bot instance",
            "Audio processing: Real-time streaming requirements",
            "Failure modes: Network issues, auth failures, platform changes"
        ],
        "ongoing_maintenance": [
            "Platform API changes",
            "SDK updates",
            "Infrastructure scaling",
            "Security patches",
            "Bug fixes for edge cases"
        ],
        "team_requirements": [
            "Backend engineer (Python/FastAPI)",
            "DevOps engineer (container orchestration)",
            "Platform integration specialist",
            "Audio/video streaming expertise"
        ]
    },
    
    "bot_infrastructure_buy": {
        "complexity": "LOW-MODERATE",
        "effort_estimate_days": "10-15",
        "components": [
            "Third-party API integration (Recall.ai or Nylas)",
            "Calendar sync to trigger bots",
            "Webhook handlers for bot events",
            "UI for bot management",
            "Storage for transcripts"
        ],
        "technical_challenges": [
            "API rate limits",
            "Webhook reliability",
            "Cost management"
        ],
        "ongoing_maintenance": [
            "API version updates",
            "Monitoring usage/costs",
            "Minimal infrastructure"
        ],
        "team_requirements": [
            "Backend engineer (API integration)",
            "Frontend engineer (UI)"
        ]
    }
}

# ============================================================================
# 5. COST ANALYSIS
# ============================================================================

COST_ANALYSIS = {
    "build_in_house": {
        "development_cost": {
            "engineering_months": 12,
            "team_size": 3,
            "cost_per_month_estimate": 30000,  # $10k/engineer/month average
            "total_development": 360000
        },
        "infrastructure_monthly": {
            "server_costs": "$2,000-5,000",
            "description": "Container orchestration for bot instances, scaling per concurrent meeting"
        },
        "ongoing_maintenance_yearly": {
            "engineering_time": "20-30%",
            "cost_estimate": 72000  # 0.25 FTE
        },
        "total_first_year": 420000,  # Dev + 12mo infrastructure @3.5k avg
        "total_year_two_plus": 114000,  # Infrastructure + maintenance
        "pros": [
            "Full control over features",
            "No per-meeting costs",
            "Can customize deeply",
            "No vendor dependency"
        ],
        "cons": [
            "Massive upfront investment",
            "Long time to market (6-12 months)",
            "High technical risk",
            "Ongoing maintenance burden",
            "Google Meet essentially impossible"
        ]
    },
    
    "buy_recall_ai": {
        "costs_at_scale": {
            "100_hours_month": 70 + 22,  # $92/mo (platform fee amortized)
            "500_hours_month": 350 + 22,  # $372/mo
            "1000_hours_month": 700 + 22,  # $722/mo
            "5000_hours_month": 3500 + 22  # $3,522/mo
        },
        "platform_fee_annual": 266,
        "development_cost": {
            "engineering_weeks": 2,
            "cost_estimate": 10000
        },
        "total_first_year_500hr_month": 14728,  # $10k dev + $372*12 + $266
        "pros": [
            "Fast time to market (2-3 weeks)",
            "Low upfront cost",
            "All platforms supported",
            "Proven reliability",
            "Output Media feature"
        ],
        "cons": [
            "Ongoing per-hour costs",
            "Vendor dependency",
            "Less customization",
            "Costs scale with usage"
        ]
    },
    
    "buy_nylas_notetaker": {
        "costs_at_scale": {
            "100_hours_month": 70,  # No platform fee
            "500_hours_month": 350,
            "1000_hours_month": 650,  # Volume discount kicks in
            "5000_hours_month": 2500,  # $0.50/hr at this tier
            "10000_hours_month": 3000  # $0.30/hr at highest tier
        },
        "platform_fee": 0,
        "development_cost": {
            "engineering_weeks": 2,
            "cost_estimate": 10000
        },
        "total_first_year_500hr_month": 14200,  # $10k dev + $350*12
        "pros": [
            "No platform fee",
            "Best volume pricing",
            "Transcription included",
            "Fast implementation",
            "Calendar integration built-in"
        ],
        "cons": [
            "Less mature",
            "Fewer platform options",
            "No Output Media",
            "Still vendor lock-in"
        ]
    }
}

# ============================================================================
# 6. INTEGRATION WITH DICTA-NOTES
# ============================================================================

DICTA_NOTES_INTEGRATION = {
    "current_architecture": {
        "transcription": "Google Gemini 2.5 (Flash/Pro; real-time + on-demand)",
        "audio_input": "User's microphone (browser)",
        "storage": "Firestore",
        "deployment": "PWA (offline capable)"
    },
    
    "bot_integration_changes_required": {
        "audio_pipeline": {
            "current": "Browser microphone → Google Gemini 2.5",
            "with_bot": "Meeting bot → Audio stream → Backend → Google Gemini 2.5",
            "impact": "Need backend audio processing pipeline"
        },
        
        "offline_pwa": {
            "impact": "HIGH",
            "issue": "Meeting bots require always-on backend infrastructure",
            "conflict": "Contradicts offline/PWA capabilities",
            "solution": "Bot-join is separate feature from manual recording"
        },
        
        "gemini_compatibility": {
            "current": "Browser → Gemini WebSocket",
            "with_bot": "Backend → Gemini API",
            "impact": "Need backend Gemini integration (already have GEMINI_API_KEY)",
            "complexity": "Low - we already use Gemini"
        },
        
        "firestore_integration": {
            "impact": "Low",
            "change": "Bot-triggered sessions stored alongside manual sessions",
            "structure": "Same schema, add 'source' field (manual vs bot)"
        }
    },
    
    "user_experience_changes": {
        "calendar_connection": "New settings page for OAuth",
        "bot_preferences": "Toggle auto-join, whitelist/blacklist meetings",
        "bot_visibility": "User sees when bot joins their meetings",
        "privacy_concerns": "Bot appears as participant (visible to others)",
        "session_management": "Bot-captured sessions appear in Sessions list"
    }
}

# ============================================================================
# 7. RECOMMENDATION
# ============================================================================

RECOMMENDATION = {
    "approach": "BUY (Third-Party API)",
    "preferred_vendor": "Nylas Notetaker",
    "rationale": [
        "Cost: ~$4,200 first year vs $420k to build",
        "Time: 2-3 weeks vs 6-12 months to build",
        "Risk: Low vs Very High for build",
        "No platform fee (vs Recall.ai's $266/year)",
        "Transcription included (can use Gemini or their built-in)",
        "Volume pricing scales well as we grow",
        "Fast time to market = competitive parity sooner"
    ],
    
    "implementation_phases": {
        "phase_1_mvp": {
            "timeline": "2-3 weeks",
            "scope": [
                "Google Calendar OAuth integration",
                "Nylas Notetaker API integration",
                "Basic bot scheduling for Zoom meetings",
                "Store bot-captured sessions in Firestore",
                "Simple UI to enable/disable auto-join"
            ],
            "outcome": "Users can auto-join Zoom meetings"
        },
        
        "phase_2_expansion": {
            "timeline": "+2 weeks",
            "scope": [
                "Microsoft Outlook calendar support",
                "Teams and Meet platform support",
                "Advanced bot preferences (whitelist, filters)",
                "Better session management UI",
                "Privacy controls"
            ],
            "outcome": "Full multi-platform support"
        },
        
        "phase_3_intelligence": {
            "timeline": "+3 weeks",
            "scope": [
                "Use Gemini for post-processing bot transcripts",
                "Action item extraction",
                "Meeting summaries",
                "Search across bot-captured sessions",
                "Integration with manual recordings"
            ],
            "outcome": "AI-enhanced meeting intelligence"
        }
    },
    
    "build_scenario": {
        "when_to_consider": [
            "After reaching $50k+/month in Nylas costs",
            "If we need features Nylas doesn't offer",
            "If vendor proves unreliable",
            "If we have raised significant funding"
        ],
        "not_recommended_unless": [
            "Usage costs exceed $500k annually",
            "Have dedicated team of 3+ engineers",
            "12+ month timeline acceptable"
        ]
    },
    
    "google_meet_caveat": {
        "issue": "No official API - even third-party uses fragile automation",
        "recommendation": "Accept that Meet support will be less reliable",
        "alternative": "Focus marketing on Zoom/Teams reliability",
        "future": "Monitor for Google releasing official API"
    }
}

# ============================================================================
# 8. NEXT STEPS IF APPROVED
# ============================================================================

NEXT_STEPS = {
    "immediate": [
        "Get user/stakeholder approval on third-party approach",
        "Sign up for Nylas Notetaker sandbox account",
        "Test API capabilities with sample meetings",
        "Design calendar connection OAuth flow",
        "Create technical spec for Phase 1 MVP"
    ],
    
    "week_1": [
        "Implement Google Calendar OAuth",
        "Create backend endpoints for Nylas webhook handling",
        "Build bot scheduling logic",
        "Test with personal Zoom meetings"
    ],
    
    "week_2": [
        "Store bot sessions in Firestore",
        "Build UI for calendar connection",
        "Add bot preferences controls",
        "Internal testing with team meetings"
    ],
    
    "week_3": [
        "Polish UI/UX",
        "Add error handling and user notifications",
        "Documentation for users",
        "Beta release to limited users"
    ]
}

# ============================================================================
# 9. RISKS AND MITIGATIONS
# ============================================================================

RISKS = {
    "vendor_dependency": {
        "risk": "Nylas could raise prices or shut down",
        "likelihood": "Low",
        "impact": "High",
        "mitigation": "Design abstraction layer, can swap to Recall.ai or build"
    },
    
    "cost_scaling": {
        "risk": "Costs grow faster than revenue",
        "likelihood": "Medium",
        "impact": "Medium",
        "mitigation": "Monitor costs closely, implement user limits, consider pricing tiers"
    },
    
    "google_meet_unreliability": {
        "risk": "Meet bots fail frequently",
        "likelihood": "Medium-High",
        "impact": "Medium",
        "mitigation": "Set user expectations, focus on Zoom/Teams, show platform status"
    },
    
    "user_privacy_concerns": {
        "risk": "Users uncomfortable with bot in meetings",
        "likelihood": "Medium",
        "impact": "Medium",
        "mitigation": "Clear opt-in, bot visibility indicators, privacy controls"
    },
    
    "technical_integration": {
        "risk": "Integration more complex than expected",
        "likelihood": "Low",
        "impact": "Low",
        "mitigation": "Nylas has good docs, sandbox testing before commit"
    }
}

# ============================================================================
# 10. SUMMARY
# ============================================================================

SUMMARY = """
COMPLEXITY RATING: **MODERATE** (with third-party) vs **VERY HIGH** (build in-house)

COST COMPARISON (First Year):
- Build in-house: ~$420,000
- Buy (Nylas): ~$14,200 @ 500 hrs/month
- Buy (Recall.ai): ~$14,700 @ 500 hrs/month

RECOMMENDATION: **BUY - Use Nylas Notetaker API**

WHY:
1. 30x cost savings in first year
2. 2-3 weeks vs 6-12 months time to market
3. Much lower technical risk
4. Focus our engineering on differentiating features
5. Scales reasonably well with volume pricing

IMPLEMENTATION TIMELINE: 3 weeks for MVP, 7 weeks for full feature

KEY TRADEOFF: Ongoing per-meeting costs vs massive upfront investment

NEXT DECISION POINT: Test Nylas in sandbox, then commit or explore alternatives
"""
