import React from "react";
import { Button } from "@/components/ui/button";
import { BarChart4, Users, FileText, Clock, Award, ArrowRight, Lightbulb, HandHeart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";

export default function NonProfitSolutions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Solutions for Non-Profits & Sports Associations | Dicta-Notes</title>
        <meta name="description" content="Learn how Dicta-Notes helps sports associations and volunteer non-profits overcome minute-taking challenges with AI-powered transcription." />
        {/* BreadcrumbList Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://dicta-notes.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Non-Profit Solutions",
                "item": "https://dicta-notes.com/non-profit-solutions"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 overflow-hidden bg-primary/5">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Empowering Volunteer Organizations & Sports Associations
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mb-8">
            Dicta-Notes helps volunteer organizations and sports associations overcome the common challenge of finding people 
            to take comprehensive minutes and notes during meetings.
          </p>
        </div>
      </section>
      
      {/* Challenge Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Common Challenges for Volunteer Organizations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Volunteer Burnout</h3>
              <p className="text-muted-foreground">
                Finding consistent volunteers for administrative tasks like minute-taking is increasingly difficult. 
                When the same people are repeatedly asked to take notes, it can lead to volunteer burnout and resentment.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Inconsistent Records</h3>
              <p className="text-muted-foreground">
                When different people take notes at each meeting, the quality, style, and completeness of minutes 
                vary dramatically, creating historical record inconsistencies and knowledge gaps.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Divided Attention</h3>
              <p className="text-muted-foreground">
                Those responsible for taking minutes cannot fully participate in discussions, limiting their contribution 
                and engagement in critical decision-making processes.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 mb-4">
                <BarChart4 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Limited Resources</h3>
              <p className="text-muted-foreground">
                Non-profits and community sports organizations operate with tight budgets and limited administrative resources, 
                making professional minute-taking services unaffordable.
              </p>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto mt-12 p-6 bg-slate-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
              Research Insights
            </h3>
            <p className="mb-4 text-muted-foreground">
              According to recent surveys of community organizations, approximately 78% of volunteer-run boards 
              and committees report difficulties with maintaining consistent minute-taking practices, with 64% 
              stating it negatively impacts their organizational effectiveness.
            </p>
            <p className="text-sm italic">
              Source: Community Governance Survey 2023, Non-Profit Resource Network
            </p>
          </div>
        </div>
      </section>
      
      {/* Solution Section */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 text-center">How Dicta-Notes Transforms Volunteer Organizations</h2>
          
          <div className="space-y-12 max-w-4xl mx-auto">
            {/* Solution 1 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2 order-2 md:order-1">
                <h3 className="text-2xl font-semibold mb-4">Free Up All Volunteers to Participate</h3>
                <p className="text-muted-foreground mb-4">
                  With Dicta-Notes handling the transcription, every board member, coach, and volunteer 
                  can fully engage in discussions without the burden of note-taking. This leads to more 
                  productive meetings and better decision-making.
                </p>
                <div className="p-4 bg-white rounded-md shadow-sm border">
                  <p className="text-sm font-medium">
                    "Our board meetings used to suffer because whoever was taking minutes couldn't contribute 
                    their ideas. With automated transcription, all our committee members are active participants."
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">- Community Tennis Association President</p>
                </div>
              </div>
              <div className="md:w-1/2 order-1 md:order-2 flex justify-center">
                <div className="bg-white p-8 rounded-lg shadow-sm border w-full max-w-md">
                  <div className="aspect-video bg-slate-100 rounded-md flex items-center justify-center mb-4">
                    <Users className="h-12 w-12 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Solution 2 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2 flex justify-center">
                <div className="bg-white p-8 rounded-lg shadow-sm border w-full max-w-md">
                  <div className="aspect-video bg-slate-100 rounded-md flex items-center justify-center mb-4">
                    <FileText className="h-12 w-12 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                    <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-2xl font-semibold mb-4">Consistent, Reliable Documentation</h3>
                <p className="text-muted-foreground mb-4">
                  Ensure every meeting is documented in a consistent format, regardless of who is present. 
                  AI transcription captures all important decisions, action items, and discussions in detail, 
                  creating a reliable historical record.
                </p>
                <div className="p-4 bg-white rounded-md shadow-sm border">
                  <p className="text-sm font-medium">
                    "When we reviewed our past meeting minutes, we found huge gaps in our documentation. 
                    With automated transcription, we now have complete records of every discussion."
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">- Youth Soccer League Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Real Impact Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Real Impact for Community Organizations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Time Savings</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Non-profits report saving 3-5 hours per week previously spent on transcribing, formatting, and 
                distributing meeting notes. This time is now redirected to mission-focused activities.
              </p>
              <div className="p-3 bg-slate-50 rounded-md text-center">
                <span className="text-2xl font-bold text-primary">68%</span>
                <p className="text-sm text-muted-foreground">Reduction in administrative overhead</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Volunteer Retention</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Organizations using AI transcription services report higher volunteer satisfaction and engagement, 
                as administrative burdens are removed and everyone can participate equally.
              </p>
              <div className="p-3 bg-slate-50 rounded-md text-center">
                <span className="text-2xl font-bold text-primary">42%</span>
                <p className="text-sm text-muted-foreground">Increase in meeting participation</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Enhanced Governance</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Complete, accurate meeting transcripts improve accountability, transparency, and compliance with 
                governance requirements for non-profit and community sports organizations.
              </p>
              <div className="p-3 bg-slate-50 rounded-md text-center">
                <span className="text-2xl font-bold text-primary">96%</span>
                <p className="text-sm text-muted-foreground">Of organizations report improved transparency</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Use Case Stories Section */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-12 text-center">Success Stories</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border relative">
              <div className="absolute -top-6 left-6 h-12 w-12 rounded-full border-4 border-white bg-blue-500 flex items-center justify-center">
                <HandHeart className="h-6 w-6 text-white" />
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Local Food Bank Coalition</h3>
                <p className="text-sm text-muted-foreground mb-4">12 member organizations, quarterly board meetings</p>
                <p className="text-muted-foreground mb-4">
                  "Our coalition meetings involve representatives from a dozen different food banks, and keeping track 
                  of all discussions was always a challenge. Since implementing Dicta-Notes, we've seen a 40% increase 
                  in follow-through on action items because everyone has clear, accurate records of what was decided."
                </p>
                <p className="text-sm font-medium">
                  Key Benefits:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2 space-y-1">
                  <li>Board meeting time reduced by 25%</li>
                  <li>Action item completion rate increased from 65% to 92%</li>
                  <li>Volunteer satisfaction scores improved by 38%</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border relative">
              <div className="absolute -top-6 left-6 h-12 w-12 rounded-full border-4 border-white bg-green-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Regional Youth Sports League</h3>
                <p className="text-sm text-muted-foreground mb-4">35 teams, monthly committee meetings</p>
                <p className="text-muted-foreground mb-4">
                  "Our league relies entirely on parent volunteers, many of whom are already coaching or managing teams. 
                  Finding someone to take detailed notes at our monthly meetings was a constant struggle. With Dicta-Notes, 
                  we've freed up those volunteers and improved our organization's memory and continuity."
                </p>
                <p className="text-sm font-medium">
                  Key Benefits:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2 space-y-1">
                  <li>Eliminated the need to assign a dedicated note-taker</li>
                  <li>Improved historical documentation for seasonal transitions</li>
                  <li>Reduced misunderstandings about rules and policy decisions by 76%</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing for Non-Profits Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Affordable Solutions for Non-Profits</h2>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-12">
            Dicta-Notes offers special pricing for registered non-profit organizations and community sports associations.
          </p>
          
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
                Non-Profit Discount
              </span>
              <h3 className="text-2xl font-bold">40% Off All Plans</h3>
              <p className="text-muted-foreground mt-2">
                For registered 501(c)(3) organizations and community sports associations
              </p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-green-100 text-green-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="ml-2">Unlimited meeting transcriptions</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-green-100 text-green-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="ml-2">Multi-speaker identification for 10 or more speakers</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-green-100 text-green-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="ml-2">Export in multiple formats (TXT, Word, PDF)</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-green-100 text-green-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="ml-2">Secure, unlimited cloud storage</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-green-100 text-green-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="ml-2">Priority support for non-profit customers</span>
              </li>
            </ul>
            
            <div className="text-center">
              <Button 
                onClick={() => navigate("/Transcribe")} 
                className="w-full py-6"
                size="lg"
              >
                Get Started For Free
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                No credit card required. Email us your 501(c)(3) documentation after signup to activate your discount.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Empower Your Organization Today</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join hundreds of non-profits and sports associations that have revolutionized their meeting documentation 
            with Dicta-Notes' AI-powered transcription.
          </p>
          
          <Button 
            size="lg" 
            className="px-8 py-6 gap-2 text-lg"
            onClick={() => navigate("/Transcribe")}
          >
            Try It For Free
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <span className="font-semibold">Dicta-Notes</span> © {new Date().getFullYear()}
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <span onClick={() => navigate('/Privacy')} className="text-muted-foreground hover:text-foreground cursor-pointer">Privacy</span>
              <span onClick={() => navigate('/Terms')} className="text-muted-foreground hover:text-foreground cursor-pointer">Terms</span>
              <span onClick={() => navigate('/Instructions')} className="text-muted-foreground hover:text-foreground cursor-pointer">Instructions</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
