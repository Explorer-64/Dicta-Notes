import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Accessibility, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { BackButton } from "components/BackButton";
import { SEOMetaTags } from "components/SEOMetaTags";
import { SchemaMarkup } from "components/SchemaMarkup";

const featureHighlights = [
  {
    icon: <Accessibility className="h-8 w-8 text-blue-500" />,
    title: "Enhance Student Accessibility",
    description: "Provide accurate transcripts for all lectures, supporting ADA compliance and making content accessible for all students, including those with hearing impairments.",
  },
  {
    icon: <BookOpen className="h-8 w-8 text-green-500" />,
    title: "Turn Lectures into Study Aids",
    description: "Students can transform lengthy lecture recordings into searchable, quotable text, making it easier to study, write papers, and review key concepts.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Automated Lecture Capture",
    description: "Record any class, whether in-person or online, and let our AI handle the note-taking. Create a permanent, accurate archive of every lesson.",
  },
];

const faqItems = [
    {
      question: "How can this help our institution meet ADA requirements?",
      answer: "By providing accurate, time-stamped transcripts of lectures and course materials, you offer an equitable alternative for students with hearing disabilities and other learning needs, which is a core component of accessibility standards."
    },
    {
      question: "Is it complicated for professors to use?",
      answer: "Not at all. The process is simple: start recording, and we handle the rest. It requires minimal technical skill and allows instructors to focus on teaching, not technology."
    },
    {
      question: "Can students use this for their own study groups?",
      answer: "Absolutely. Students can use Dicta-Notes to record and transcribe study sessions, group projects, and review discussions, creating a shared repository of knowledge."
    },
    {
      question: "What formats can we export the transcripts in?",
      answer: "You can export transcripts as PDF, Word, plain text, and Markdown, making them easy to share, archive, and integrate into your Learning Management System (LMS)."
    }
  ];

export default function EducationPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <SEOMetaTags
        title="AI Transcription for Education | Accessible Lecture Notes"
        description="Improve student accessibility and create powerful study aids with AI-powered lecture transcription. Supports ADA compliance and automated classroom notes."
        keywords="lecture transcription, student accessibility, ADA compliance, classroom notes, AI study aids, lecture capture"
      />
      <SchemaMarkup
        type="Article"
        data={{
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Make Learning Accessible: AI Transcription for the Modern Classroom",
            "author": {
              "@type": "Organization",
              "name": "Dicta-Notes"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Dicta-Notes",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://dicta-notes.com/logo.png"
                }
            },
            "datePublished": "2025-10-14",
            "description": "Explore how AI transcription helps educational institutions provide accessible learning materials, automate note-taking, and empower students with better study tools.",
        }}
      />
      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Empower Every Student with Accessible Learning
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes transforms your lectures into accurate, searchable transcripts. Enhance accessibility, support ADA compliance, and give your students powerful tools to succeed.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={() => navigate("/login")}>
              Get Started for Free
            </Button>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold">Are Your Students Struggling to Keep Up?</h2>
                <p className="text-muted-foreground mt-4">
                    Manual note-taking is inefficient and creates barriers for students with diverse learning needs. Valuable information is lost the moment a lecture ends.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Inaccessible Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Auditory-based lectures exclude students with hearing impairments and fail to meet modern accessibility standards.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Ineffective Studying</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Students spend more time scribbling notes than engaging with the material, leading to passive learning and forgotten details.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Lack of Review Material</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Once a lecture is over, there's no easy way for students to review a specific concept or clarify a point they missed.</p>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">A Smarter Classroom for Everyone</h2>
            <p className="text-muted-foreground mt-2">
              Built for educators and students who value accessible and effective learning.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4">
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-8">Questions From Educators</h2>
                <div className="space-y-4">
                {faqItems.map((item, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle>{item.question}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{item.answer}</p>
                        </CardContent>
                    </Card>
                ))}
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 text-center bg-indigo-600 text-white">
          <h2 className="text-3xl font-bold">Create a More Inclusive Learning Environment Today</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Join leading institutions in making education more accessible and effective. Get started with AI-powered lecture transcription.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>
              Start a Free Trial
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600" onClick={() => navigate("/pricing")}>
              Explore Plans
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
