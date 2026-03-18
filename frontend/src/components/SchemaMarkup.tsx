import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Schema.org type definitions
 */
export type SchemaType = 
  | 'SoftwareApplication'
  | 'FAQPage'
  | 'Article'
  | 'BreadcrumbList'
  | 'Organization'
  | 'WebPage';

/**
 * FAQ Question and Answer
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

/**
 * Software Application schema data
 */
export interface SoftwareApplicationData {
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  inLanguage?: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
  };
  description: string;
  featureList?: string[];
  '@id'?: string;
  applicationSubCategory?: string;
  keywords?: string;
  sameAs?: string[];
  additionalProperty?: {
    '@type': 'PropertyValue';
    name: string;
    value: string;
  }[];
}

/**
 * Article schema data
 */
export interface ArticleData {
  headline: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    '@type': 'Organization' | 'Person';
    name: string;
  };
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
}

/**
 * Props for SchemaMarkup component
 */
interface SchemaMarkupProps {
  type: SchemaType;
  data?: SoftwareApplicationData | ArticleData | any;
  faqItems?: FAQItem[];
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * Centralized Schema.org structured data component
 * 
 * Usage examples:
 * 
 * 1. FAQ Page:
 * <SchemaMarkup 
 *   type="FAQPage" 
 *   faqItems={[
 *     { question: "How does it work?", answer: "It uses AI..." }
 *   ]} 
 * />
 * 
 * 2. Software Application:
 * <SchemaMarkup 
 *   type="SoftwareApplication" 
 *   data={{
 *     name: "Dicta-Notes",
 *     applicationCategory: "BusinessApplication",
 *     operatingSystem: "Web",
 *     description: "AI transcription tool"
 *   }} 
 * />
 * 
 * 3. Article:
 * <SchemaMarkup 
 *   type="Article" 
 *   data={{
 *     headline: "Getting Started Guide",
 *     description: "Learn how to use Dicta-Notes",
 *     datePublished: "2025-01-01"
 *   }} 
 * />
 * 
 * 4. Breadcrumbs:
 * <SchemaMarkup 
 *   type="BreadcrumbList" 
 *   breadcrumbs={[
 *     { name: "Home", url: "https://dicta-notes.com", position: 1 },
 *     { name: "Guides", url: "https://dicta-notes.com/guides", position: 2 }
 *   ]} 
 * />
 */
export function SchemaMarkup({ type, data, faqItems, breadcrumbs }: SchemaMarkupProps) {
  
  const generateSchema = (): object => {
    const baseContext = { '@context': 'https://schema.org' };
    
    switch (type) {
      case 'FAQPage':
        if (!faqItems || faqItems.length === 0) {
          console.warn('SchemaMarkup: FAQPage requires faqItems');
          return {};
        }
        return {
          ...baseContext,
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        };
      
      case 'SoftwareApplication':
        return {
          ...baseContext,
          '@type': 'SoftwareApplication',
          ...data,
        };
      
      case 'Article':
        return {
          ...baseContext,
          '@type': 'Article',
          ...data,
        };
      
      case 'BreadcrumbList':
        if (!breadcrumbs || breadcrumbs.length === 0) {
          console.warn('SchemaMarkup: BreadcrumbList requires breadcrumbs');
          return {};
        }
        return {
          ...baseContext,
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((crumb) => ({
            '@type': 'ListItem',
            position: crumb.position,
            name: crumb.name,
            item: crumb.url,
          })),
        };
      
      case 'Organization':
        return {
          ...baseContext,
          '@type': 'Organization',
          ...data,
        };
      
      case 'WebPage':
        return {
          ...baseContext,
          '@type': 'WebPage',
          ...data,
        };
      
      default:
        console.warn(`SchemaMarkup: Unknown type "${type}"`);
        return {};
    }
  };
  
  const schema = generateSchema();
  
  // Don't render if schema is empty
  if (Object.keys(schema).length === 0) {
    return null;
  }
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
