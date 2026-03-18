import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserGuardContext } from "app";
import { Company, CompanyRepository, CompanyUserRole, CompanyUser } from "../utils/company";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SessionRepository } from "../utils/session";
import { SessionListItem } from "../brain/data-contracts";
import CompanyOverview from "../components/CompanyOverview";
import CompanyMembers from "../components/CompanyMembers";
import CompanySessions from "../components/CompanySessions";
import { Header } from "components/Header";
import { ProtectedRoute } from "components/ProtectedRoute";
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

const CompanyDetail = () => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [companySessions, setCompanySessions] = useState<{
    sessions: SessionListItem[];
    total_count: number;
  }>({ sessions: [], total_count: 0 });
  const [userRole, setUserRole] = useState<CompanyUserRole | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const loadCompanyData = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      
      // Load company details
      const companyData = await CompanyRepository.getCompany(companyId);
      setCompany(companyData);
      
      // Load company users
      const users = await CompanyRepository.listCompanyUsers(companyId);
      setCompanyUsers(users);
      
      // Get user's role in this company
      const role = await CompanyRepository.getUserCompanyRole(companyId);
      setUserRole(role);
      
      // Check if user is company owner
      const ownerStatus = await CompanyRepository.isCompanyOwner(companyId);
      setIsOwner(ownerStatus);
      
      // Load company sessions
      const sessions = await SessionRepository.getCompanySessions(companyId);
      setCompanySessions(sessions);
    } catch (error) {
      console.error("Error loading company data:", error);
      toast.error("Failed to load company data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, [companyId, navigate]);

  const handleCreateSession = () => {
    // Will redirect to the transcribe page with company context
    if (companyId) {
      navigate(`/transcribe?companyId=${companyId}`);
    }
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/session-detail?sessionId=${sessionId}&companyId=${companyId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 px-4 py-8">
            <div className="container mx-auto text-center">
              <p>Loading company data...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!company) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 px-4 py-8">
            <div className="container mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Company not found</h2>
              <p className="mb-6">The company you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => navigate("/companies")}>Back to Companies</Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <NoIndexMeta />
        <Header />
        <main className="flex-1 px-4 py-8">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">{company.name}</h1>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" data-translate>Overview</TabsTrigger>
                <TabsTrigger value="members" data-translate>Members</TabsTrigger>
                <TabsTrigger value="sessions" data-translate>Sessions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <CompanyOverview 
                  company={company} 
                  userRole={userRole} 
                  isOwner={isOwner} 
                />
              </TabsContent>
              
              <TabsContent value="members" className="mt-6">
                <CompanyMembers 
                  companyId={companyId || ''} 
                  companyUsers={companyUsers} 
                  userRole={userRole} 
                  currentUserId={user.uid}
                  onMembersChange={loadCompanyData} 
                />
              </TabsContent>
              
              <TabsContent value="sessions" className="mt-6">
                <CompanySessions 
                  companyId={companyId || ''} 
                  sessions={companySessions} 
                  onCreateSession={handleCreateSession} 
                  onViewSession={handleViewSession}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CompanyDetail;
