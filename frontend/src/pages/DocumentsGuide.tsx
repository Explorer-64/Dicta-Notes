import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { SchemaMarkup } from "components/SchemaMarkup";

export default function DocumentsGuide() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Document Analysis Guide - Dicta-Notes</title>
        <meta name="robots" content="noindex" />
        <meta name="description" content="Learn how to upload and analyze documents with AI in Dicta-Notes." />
      </Helmet>
      
      {/* Article Schema for SEO */}
      <SchemaMarkup 
        type="Article"
        data={{
          headline: "Document Analysis Guide",
          description: "Learn how to upload and analyze documents with AI in Dicta-Notes.",
          author: {
            '@type': 'Organization',
            name: 'Dicta-Notes'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Dicta-Notes'
          },
          datePublished: "2025-01-01",
          dateModified: "2025-01-14"
        }}
      />
      
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 sm:py-10 mt-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/instructions")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Instructions
          </Button>
          
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Document Analysis</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Document Analysis</CardTitle>
                <CardDescription>
                  How to upload and analyze meeting documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Content coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
