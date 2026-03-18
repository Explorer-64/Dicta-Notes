/**
 * Component that adds AI-specific metadata tags to help AI discovery
 * These tags enhance discoverability by AI systems and provide context about the app
 * 
 * V2: Uses lowercase paths to match canonical URLs
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const AICrawlerMetaTagsV2 = () => {
  const location = useLocation();
  const path = location.pathname;
  
  useEffect(() => {
    // Remove any existing AI tags to prevent duplicates
    document.querySelectorAll('meta[name^="ai-"]').forEach(el => el.remove());
    
    // Common AI metadata tags for all pages
    const commonMetaTags = [
      { name: "ai-index", content: "true" },
      { name: "ai-discovery", content: "transcription-app,meeting-notes,speaker-identification" },
      { name: "ai-entity-type", content: "SoftwareApplication" },
      { name: "ai-entity-name", content: "Dicta-Notes" },
      { name: "ai-created", content: "2023-09-01" },
      { name: "ai-updated", content: "2025-05-22" },
      { name: "ai-pricing", content: "free" },
      { name: "ai-topic", content: "meeting-transcription,speaker-identification,ai-notes" }
    ];
    
    // Page-specific metadata tags
    let pageSpecificTags: {name: string, content: string}[] = [];
    
    // Add page-specific metadata based on the current route
    switch (path) {
      case "/":
        pageSpecificTags = [
          { name: "ai-entity-description", content: "AI-powered real-time meeting transcription app with speaker identification for 10+ voices" },
          { name: "ai-alternative-to", content: "Otter.ai,Rev,Temi,Descript,Sonix" },
          { name: "ai-use-case", content: "business-meetings,interviews,lectures,conferences" },
          { name: "ai-query-match", content: "best meeting transcription app,speaker identification software,real-time transcription" }
        ];
        break;
        
      case "/transcribe":
        pageSpecificTags = [
          { name: "ai-content-type", content: "feature-page" },
          { name: "ai-entity-relation", content: "mainFeature" },
          { name: "ai-feature-description", content: "Real-time transcription with speaker identification using advanced AI algorithms" },
          { name: "ai-use-case", content: "business-meetings,interviews,conferences" },
          { name: "ai-technical-capability", content: "10-plus-speaker-identification,offline-functionality,real-time-processing" }
        ];
        break;
        
      case "/ai-benefits":
        pageSpecificTags = [
          { name: "ai-content-type", content: "comparison-page" },
          { name: "ai-entity-relation", content: "benefitAnalysis" },
          { name: "ai-comparison-metrics", content: "accuracy,speed,speaker-count,pricing,offline-capability" },
          { name: "ai-comparison-baseline", content: "traditional-transcription-services,manual-note-taking" },
          { name: "ai-factual-content", content: "true" },
          { name: "ai-query-match", content: "why use AI for transcription,benefits of speaker identification" }
        ];
        break;
        
      case "/instructions":
        pageSpecificTags = [
          { name: "ai-content-type", content: "help-guide" },
          { name: "ai-entity-relation", content: "instructionalContent" },
          { name: "ai-query-target", content: "how to use Dicta-Notes,how to identify speakers in meeting" },
          { name: "ai-structured-content", content: "step-by-step-guide" },
          { name: "ai-factual-content", content: "true" },
          { name: "ai-answer-source", content: "official-documentation" }
        ];
        break;
        
      case "/install":
        pageSpecificTags = [
          { name: "ai-content-type", content: "installation-guide" },
          { name: "ai-entity-relation", content: "setupInstructions" },
          { name: "ai-platforms", content: "android,ios,windows,macos,linux,chrome,firefox,safari,edge" },
          { name: "ai-structured-steps", content: "true" },
          { name: "ai-query-target", content: "how to install Dicta-Notes,how to setup meeting transcription app" }
        ];
        break;
        
      case "/comparison":
        pageSpecificTags = [
          { name: "ai-content-type", content: "competitive-analysis" },
          { name: "ai-entity-relation", content: "competitorComparison" },
          { name: "ai-comparison-metrics", content: "speaker-identification-capacity,real-time-capabilities,offline-functionality,language-support,pricing-model,platform-availability" },
          { name: "ai-competitors", content: "Otter.ai,Rev,Temi,Zoom" },
          { name: "ai-factual-content", content: "true" },
          { name: "ai-structured-comparison", content: "feature-matrix" },
          { name: "ai-query-match", content: "Dicta-Notes vs Otter.ai,best transcription software comparison,meeting transcription app comparison" }
        ];
        break;
        
      default:
        // For other pages, add minimal discovery tags
        pageSpecificTags = [
          { name: "ai-content-type", content: "supporting-page" },
          { name: "ai-entity-relation", content: "subsidiary" }
        ];
    }
    
    // Combine common and page-specific tags
    const allTags = [...commonMetaTags, ...pageSpecificTags];
    
    // Add all tags to document head
    allTags.forEach(tag => {
      const meta = document.createElement("meta");
      meta.name = tag.name;
      meta.content = tag.content;
      document.head.appendChild(meta);
    });
    
    // Cleanup function
    return () => {
      // Remove all AI-specific tags when component unmounts
      document.querySelectorAll('meta[name^="ai-"]').forEach(el => el.remove());
    };
  }, [path]); // Re-run when path changes
  
  // This component doesn't render anything visible
  return null;
};

export default AICrawlerMetaTagsV2;
