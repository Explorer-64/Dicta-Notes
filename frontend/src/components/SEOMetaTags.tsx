import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface SEOMetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  image?: string;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  locale?: string;
  alternateLocales?: string[];
  noindex?: boolean;
  nofollow?: boolean;
  structuredData?: object;
}

const defaultMeta = {
  title: "Dicta-Notes - AI Meeting Transcription & Translation",
  description:
    "AI meeting transcription powered by Google Gemini 2.5 on saved sessions. Identify 10+ speakers, translate in 130+ languages, export to PDF/Word/Text/Markdown, install as a PWA, and manage recordings in Sessions.",
  keywords:
    "ai transcription, meeting transcription, 10+ speakers, multi speaker identification, 130+ languages, translation, export pdf word text markdown, pwa offline, session management, dictanotes",
  author: "Dicta-Notes",
  image: "https://dicta-notes.com/og-image.jpg",
  type: "website" as const,
  locale: "en_US",
};

export const SEOMetaTags = ({
  title,
  description,
  keywords,
  author,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  section,
  locale = "en_US",
  alternateLocales = [],
  noindex = false,
  nofollow = false,
  structuredData,
}: SEOMetaTagsProps) => {
  const location = useLocation();
  const canonicalUrl = `https://dicta-notes.com${location.pathname}`;
  
  const finalTitle = title ? `${title} | Dicta-Notes` : defaultMeta.title;
  const finalDescription = description || defaultMeta.description;
  const finalKeywords = keywords || defaultMeta.keywords;
  const finalAuthor = author || defaultMeta.author;
  const finalImage = image || defaultMeta.image;
  
  const robotsContent = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
  ].join(", ");

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={finalAuthor} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* OpenGraph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Dicta-Notes" />
      <meta property="og:locale" content={locale} />
      
      {alternateLocales.map((altLocale) => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      
      {type === "article" && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          <meta property="article:author" content={finalAuthor} />
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:site" content="@DictaNotes" />
      <meta name="twitter:creator" content="@DictaNotes" />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#ffffff" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="application-name" content="Dicta-Notes" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Predefined SEO configurations for common pages
export const seoConfigs = {
  home: {
    title: "AI Transcription, Translation & Exports for Meetings",
    description:
      "Dicta-Notes helps you capture meetings and process them with Google Gemini 2.5 after saving. Identify 10+ speakers, translate in 130+ languages, export to PDF/Word/Text/Markdown, and install as a PWA.",
    keywords:
      "ai meeting transcription, speaker identification 10+, translate 130+ languages, export pdf word text markdown, pwa install, meeting notes",
  },
  
  transcribe: {
    title: "Start Recording | AI Meeting Transcription",
    description:
      "Record your meeting, then process it with Google Gemini 2.5. Get accurate transcripts with 10+ speaker identification, translation to 130+ languages, and multiple export formats.",
    keywords:
      "start recording transcription, google gemini 2.5, 10+ speakers, translate 130+ languages, export pdf word text",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Dicta-Notes Transcription",
      "description": "AI transcription for meetings with translation and exports.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser"
    }
  },
  
  about: {
    title: "About Dicta-Notes | AI That Keeps Meetings Clear",
    description:
      "We build an AI-first experience for capturing meetings and turning them into accurate transcripts with translation and exports. Simple, reliable, and focused on what matters.",
    keywords:
      "about dicta-notes, ai transcription platform, meeting notes ai, translation and exports",
    type: "article" as const,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Dicta-Notes",
      "description": "AI meeting transcription and translation with exports."
    }
  },
  
  contact: {
    title: "Contact Dicta-Notes | Support & Questions",
    description:
      "Need help with transcription, translation, or exports? Contact the Dicta-Notes team for support.",
    keywords:
      "contact dicta-notes, support, questions, transcription help",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Dicta-Notes",
      "description": "Get in touch with our team for support and questions"
    }
  },
  
  comparison: {
    title: "Dicta-Notes vs Alternatives - AI Transcription Comparison",
    description:
      "Compare Dicta-Notes with other tools for speaker identification, multilingual support, PWA install, and export options.",
    keywords:
      "transcription comparison, speaker identification comparison, multilingual transcription, export formats",
    type: "article" as const
  },
  
  instructions: {
    title: "Guides | Recording, Sessions, Translation & Exports",
    description:
      "Step-by-step guides for recording, managing sessions, translating to 130+ languages, and exporting to PDF/Word/Text/Markdown.",
    keywords:
      "dicta-notes guides, recording instructions, sessions help, translation, export",
    type: "article"
  }
};
