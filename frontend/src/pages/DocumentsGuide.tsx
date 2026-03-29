import React from "react";
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

      <SchemaMarkup
        type="Article"
        data={{
          headline: "Document Analysis Guide",
          description: "Learn how to upload and analyze documents with AI in Dicta-Notes.",
          author: {
            "@type": "Organization",
            name: "Dicta-Notes",
          },
          publisher: {
            "@type": "Organization",
            name: "Dicta-Notes",
          },
          datePublished: "2025-01-01",
          dateModified: "2026-03-29",
        }}
      />

      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 sm:py-10 mt-4 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/instructions")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Instructions
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Document Analysis</h1>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-powered document analysis</CardTitle>
                <CardDescription>Upload files and get structured insights with Gemini 2.5 Flash</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Open the{" "}
                  <button
                    type="button"
                    className="text-primary underline font-medium"
                    onClick={() => navigate("/documents")}
                  >
                    Document analysis
                  </button>{" "}
                  page (sign in required). There you can upload a PDF, Word document (.docx), or plain text file up
                  to 20MB. The app extracts the text, sends it for analysis, and saves the result to your account.
                </p>
                <p>For each file you get:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="font-medium">Summary</span> — a short overview of the document
                  </li>
                  <li>
                    <span className="font-medium">Key points</span> — bullet highlights
                  </li>
                  <li>
                    <span className="font-medium">Action items</span> — suggested follow-ups when the model finds them
                  </li>
                  <li>
                    <span className="font-medium">Full text</span> — the extracted text in a collapsible section
                  </li>
                  <li>
                    <span className="font-medium">Title and language</span> — an inferred title (or the filename) and
                    detected language code
                  </li>
                </ul>
                <p>
                  Past analyses appear in a list below the upload area. Each row shows title, language, date, and a
                  snippet of the summary. You can delete an analysis at any time; that removes only the saved analysis,
                  not your original file on disk (the file never leaves your device except as this one upload).
                </p>
                <p className="text-muted-foreground">
                  Accuracy depends on source quality. Scanned PDFs without OCR may yield little or no text; use text-based
                  PDFs, Word, or TXT for best results.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
