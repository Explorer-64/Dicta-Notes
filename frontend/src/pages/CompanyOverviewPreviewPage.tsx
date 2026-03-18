import CompanyOverview from "components/CompanyOverview";
import { CompanyUserRole } from "../utils/company";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";

const ExamplePage = () => {
  const navigate = useNavigate();
  
  // Create a mock company with an "as any" type assertion to bypass TypeScript checks
  const mockCompany = {
    id: "example-id",
    name: "Example Company",
    description: "This is an example company for preview purposes",
    created_at: { seconds: Date.now() / 1000, nanoseconds: 0 },
    updated_at: { seconds: Date.now() / 1000, nanoseconds: 0 },
    owner_id: "example-owner-id"
  } as any; // Use type assertion to bypass strict type checking

  return (
    <div className="w-full bg-background min-h-screen">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://dicta-notes.com/companies" />
        <title>Company Overview Preview - Dicta-Notes</title>
      </Helmet>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex justify-center items-center">
          <CompanyOverview 
            company={mockCompany}
            userRole={CompanyUserRole.ADMIN}
            isOwner={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ExamplePage;
