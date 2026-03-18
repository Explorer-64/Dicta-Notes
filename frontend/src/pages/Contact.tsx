// ui/src/pages/Contact.tsx
import React from 'react';
import { ContactSupportForm } from 'components/ContactSupportForm'; 
import { Header } from "components/Header";
import { BackButton } from "components/BackButton";
import { SEOMetaTags, seoConfigs } from "components/SEOMetaTags"; 

export default function ContactPage() {
  return (
    <>
      <SEOMetaTags {...seoConfigs.contact} />
      <Header /> {/* Add standard header */}
      <div className="container mx-auto p-4 py-8"> {/* Add some vertical padding */}
        <BackButton />
        <h1 className="text-2xl font-bold mb-4 text-center">Contact Us</h1> {/* Centered title */}
        <p className="mb-6 text-center text-muted-foreground max-w-xl mx-auto"> {/* Centered description */}
          Have questions or need help with Dicta-Notes? Fill out the form below, and we'll get back to you as soon as possible.
        </p>
        <ContactSupportForm />
      </div>
      {/* You might want to add a Footer component here later if you create one */}
    </>
  );
}
