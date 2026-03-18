import React, { Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Users, Briefcase, Share2 } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { SchemaMarkup } from "components/SchemaMarkup";

export default function CompaniesGuide() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Companies Guide - Dicta-Notes</title>
        <meta name="description" content="Learn how to create and manage company workspaces, invite team members, and set permissions in Dicta-Notes. Currently in limited beta access." />
        <link rel="canonical" href="https://dicta-notes.com/companies-guide" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Companies Guide - Dicta-Notes" />
        <meta property="og:description" content="Create and manage company workspaces, invite team members, and collaborate with role-based permissions." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://dicta-notes.com/companies-guide" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Companies Guide - Dicta-Notes" />
        <meta name="twitter:description" content="Company workspaces with team collaboration, role-based permissions, and secure data isolation." />
      </Helmet>
      
      {/* Article Schema for SEO */}
      <SchemaMarkup 
        type="Article"
        data={{
          headline: "Company Workspaces Guide",
          description: "Learn how to create and manage company workspaces, invite team members, and set permissions in Dicta-Notes.",
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
      
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 sm:py-10 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Overview</h2>
            <p className="text-muted-foreground mb-4">
              The Companies feature allows you to organize your transcription sessions by client or project. 
              This is particularly useful for consultants, agencies, or anyone managing multiple clients.
            </p>
            <p className="text-muted-foreground mb-4">
              Each company has a dedicated overview page where you can manage company details, view all 
              associated sessions, and track team members.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>Tip:</strong> Want to see what a company overview looks like?{" "}
                <Link to="/company-overview-preview-page" className="underline hover:text-blue-700 dark:hover:text-blue-300">
                  View a live preview
                </Link>
              </p>
            </div>
          </section>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Briefcase className="mr-3 h-6 w-6 text-primary" />
                Company Features Guide
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Collaborate with your team using company workspaces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-4 text-foreground">
              <div>
                <h3 className="text-xl font-semibold mb-2">Creating a Company</h3>
                <p>To create a company workspace:</p>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                  <li>Navigate to the <strong>Companies</strong> page from the main menu.</li>
                  <li>Click <strong>Create Company</strong>.</li>
                  <li>Enter your company name and details.</li>
                  <li>You'll automatically become the company owner and admin.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Company Roles Explained</h3>
                <p>Dicta-Notes uses a hierarchical role system to manage company access:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>
                    <strong>Owner</strong> - Has full control over the company. Can delete the company, transfer ownership, manage all users, and configure all settings.
                  </li>
                  <li>
                    <strong>Admin</strong> - Can manage users, invite new members, and configure company settings. Cannot delete the company or transfer ownership.
                  </li>
                  <li>
                    <strong>Member</strong> - Can create and edit transcripts based on assigned permissions.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Inviting Team Members</h3>
                <p>As a company owner or admin, you can invite team members by email:</p>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                  <li>Go to your company's page and select the <strong>Members</strong> tab.</li>
                  <li>Click <strong>Invite User</strong>.</li>
                  <li>Enter the email address and select their role.</li>
                  <li>An invitation email will be sent automatically.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Working Across Multiple Companies</h3>
                <p>
                  You can be a member of multiple companies simultaneously with different roles in each. Use the company switcher in the navigation bar to change your active workspace. Content is securely isolated between different companies and your personal workspace.
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong>Verify active workspace</strong> before creating new sessions.</li>
                    <li><strong>Company sessions</strong> belong to the company, ensuring data remains even if a user leaves.</li>
                    <li><strong>Personal sessions</strong> in your private workspace remain yours alone.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
