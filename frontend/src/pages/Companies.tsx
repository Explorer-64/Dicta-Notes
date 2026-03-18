import { useEffect, useState } from "react";
import { useUserGuardContext } from "app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Company, CompanyRepository } from "../utils/CompanyRepository";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Header } from "components/Header";
import { ProtectedRoute } from "components/ProtectedRoute";
import { BookOpen } from "lucide-react";

const CompaniesPage = () => {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const userCompanies = await CompanyRepository.listUserCompanies();
        setCompanies(userCompanies);
      } catch (error) {
        console.error("Error loading companies:", error);
        toast.error("Failed to load companies");
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const handleCreateCompany = async () => {
    if (!newCompanyData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      setIsCreatingCompany(true);
      const companyId = await CompanyRepository.createCompany({
        name: newCompanyData.name.trim(),
        description: newCompanyData.description.trim() || undefined
      });
      toast.success("Company created successfully");

      // Add the new company to the list
      const newCompany = await CompanyRepository.getCompany(companyId);
      setCompanies([...companies, newCompany]);

      // Reset form
      setNewCompanyData({ name: "", description: "" });
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Failed to create company");
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const navigateToCompany = (companyId: string) => {
    navigate(`/company-detail?companyId=${companyId}`);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 px-4 py-8">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold" data-translate>Companies</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/companies-guide")}
                  className="text-primary"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span data-translate>How to Use Companies</span>
                </Button>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-translate>Create Company</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]" aria-describedby="create-company-dialog-description">
                  <DialogHeader>
                    <DialogTitle id="create-company-dialog-title" data-translate>Create Company</DialogTitle>
                    <DialogDescription id="create-company-dialog-description" data-translate>
                      Create a new company to organize your transcriptions and collaborate with team members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right" data-translate>
                        Name
                      </Label>
                      <Input
                        id="name"
                        className="col-span-3"
                        placeholder="Company Name"
                        data-translate
                        value={newCompanyData.name}
                        onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right" data-translate>
                        Description
                      </Label>
                      <Input
                        id="description"
                        className="col-span-3"
                        placeholder="Company description (optional)"
                        data-translate
                        value={newCompanyData.description}
                        onChange={(e) => setNewCompanyData({ ...newCompanyData, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleCreateCompany} 
                      disabled={isCreatingCompany || !newCompanyData.name.trim()}
                      data-translate
                    >
                      {isCreatingCompany ? <span data-translate>Creating...</span> : <span data-translate>Create Company</span>}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Separator className="my-6" />

            {loading ? (
              <div className="text-center py-8">
                <p data-translate>Loading companies...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium" data-translate>No companies yet</h3>
                <p className="text-gray-500 mt-2 mb-4" data-translate>
                  Create your first company to start collaborating with your team.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button data-translate>Create Your First Company</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]" aria-labelledby="create-first-company-dialog-title" aria-describedby="create-first-company-dialog-description">
                    <DialogHeader>
                      <DialogTitle id="create-first-company-dialog-title" data-translate>Create Company</DialogTitle>
                      <DialogDescription id="create-first-company-dialog-description" data-translate>
                        Create a new company to organize your transcriptions and collaborate with team members.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name-empty" className="text-right" data-translate>
                          Name
                        </Label>
                        <Input
                          id="name-empty"
                          className="col-span-3"
                          placeholder="Company Name"
                          data-translate
                          value={newCompanyData.name}
                          onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description-empty" className="text-right" data-translate>
                          Description
                        </Label>
                        <Input
                          id="description-empty"
                          className="col-span-3"
                          placeholder="Company description (optional)"
                          data-translate
                          value={newCompanyData.description}
                          onChange={(e) => setNewCompanyData({ ...newCompanyData, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                        <Button 
                        onClick={handleCreateCompany} 
                        disabled={isCreatingCompany || !newCompanyData.name.trim()}
                      >
                        {isCreatingCompany ? (
                          <span data-translate>Creating...</span>
                        ) : (
                          <span data-translate>Create Company</span>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {companies.map((company) => (
                  <Card key={company.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="truncate">{company.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {company.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-500">
                        Created: {new Date(company.created_at?.seconds * 1000).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => navigateToCompany(company.id)}
                        data-translate
                      >
                        View Company
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CompaniesPage;
