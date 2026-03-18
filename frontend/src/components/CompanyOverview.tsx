import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Company, CompanyRepository, CompanyUserRole, OrganizationType } from "../utils/company";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Image as ImageIcon, UserCircle2 } from "lucide-react";
// Firebase storage imports now handled through StorageUtils
import { firebaseApp } from "app";
import { firebaseAuth as auth } from "app";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferOwnershipDialog } from "./TransferOwnershipDialog";

interface CompanyOverviewProps{
  company: Company;
  userRole: CompanyUserRole | null;
  isOwner: boolean;
  owner?: {
    displayName?: string;
    email?: string;
    userId: string;
  };
}

const CompanyOverview = ({ company, userRole, isOwner, owner }: CompanyOverviewProps) => {
  const [companyNameEdit, setCompanyNameEdit] = useState(company.name);
  const [companyDescriptionEdit, setCompanyDescriptionEdit] = useState(company.description || "");
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(company.logo_url || "");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Address fields
  const [street, setStreet] = useState(company.address?.street || "");
  const [city, setCity] = useState(company.address?.city || "");
  const [state, setState] = useState(company.address?.state || "");
  const [zipCode, setZipCode] = useState(company.address?.zipCode || "");
  const [country, setCountry] = useState(company.address?.country || "");
  
  // Contact fields
  const [phone, setPhone] = useState(company.contact?.phone || "");
  const [email, setEmail] = useState(company.contact?.email || "");
  const [website, setWebsite] = useState(company.contact?.website || "");
  
  // Additional fields
  const [taxId, setTaxId] = useState(company.taxId || "");
  const [registrationId, setRegistrationId] = useState(company.registrationId || "");
  const [industry, setIndustry] = useState(company.industry || "");
  const [foundedDate, setFoundedDate] = useState(company.foundedDate || "");
  const [organizationType, setOrganizationType] = useState(company.organizationType || OrganizationType.COMPANY);
  const [organizationLabel, setOrganizationLabel] = useState(company.settings?.organizationLabel || "Company");
  
  // Helper to get the organization label displayed in the UI
  const getOrganizationLabel = () => {
    return company.settings?.organizationLabel || 
           (company.organizationType === OrganizationType.STRATA ? "Strata Council" :
            company.organizationType === OrganizationType.UNION ? "Union" :
            company.organizationType === OrganizationType.NONPROFIT ? "Nonprofit" :
            company.organizationType === OrganizationType.ASSOCIATION ? "Association" :
            "Company");
  };
  
  const handleUpdateCompany = async () => {
    try {
      setUpdating(true);
      
      let logoUrl = company.logo_url;
      
      // Upload logo if a new one was selected
      if (logoFile) {
        logoUrl = await uploadLogo();
      }
      
      await CompanyRepository.updateCompany(company.id, {
        name: companyNameEdit,
        description: companyDescriptionEdit || undefined,
        logo_url: logoUrl,
        address: {
          street,
          city,
          state,
          zipCode,
          country
        },
        contact: {
          phone,
          email,
          website
        },
        taxId,
        registrationId,
        industry,
        foundedDate,
        organizationType,
        settings: {
          ...company.settings,
          organizationLabel: organizationLabel
        }
      });
      
      // Update parent component via success toast
      toast.success("Company updated successfully");
      setIsEditing(false);
      
      // Force refresh - parent component will reload data
      window.location.reload();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
    } finally {
      setUpdating(false);
    }
  };
  
  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) {
      return company.logo_url || "";
    }
    
    try {
      setIsUploading(true);
      
      // Import the StorageUtils
      const { StorageUtils } = await import("../utils/storageUtils");
      
      // Use the robust StorageUtils to upload the file
      const downloadURL = await StorageUtils.uploadFile(
        logoFile, 
        `companies/${company.id}/logo-${Date.now()}-${logoFile.name}`,
        {
          onProgress: (progress) => setUploadProgress(progress),
        }
      );
      
      if (downloadURL) {
        return downloadURL;
      } else {
        // Fallback to old logo if upload failed
        toast.error("Failed to upload company logo. Using previous logo if available.");
        return company.logo_url || "";
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload company logo");
      return company.logo_url || "";
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file must be less than 5MB");
        return;
      }
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|svg\+xml)/)) {
        toast.error("Only image files are allowed (JPEG, PNG, GIF, SVG)");
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteCompany = async () => {
    if (!confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }
    
    try {
      setUpdating(true);
      await CompanyRepository.deleteCompany(company.id);
      toast.success("Company deleted successfully");
      
      // Navigation will be handled by parent component
      window.location.href = "/companies";
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="relative h-16 w-16 rounded-md overflow-hidden border">
              <img src={logoPreview} alt={`${getOrganizationLabel()} logo`} className="h-full w-full object-cover" />
            </div>
          ) : company.logo_url ? (
            <div className="relative h-16 w-16 rounded-md overflow-hidden border">
              <img src={company.logo_url} alt={`${getOrganizationLabel()} logo`} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-md border flex items-center justify-center bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <CardTitle data-translate>{getOrganizationLabel()} Details</CardTitle>
            <CardDescription data-translate>
              View and manage {getOrganizationLabel().toLowerCase()} information
            </CardDescription>
          </div>
        </div>
        {userRole === CompanyUserRole.ADMIN && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)} data-translate>
            Edit {getOrganizationLabel()}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general" data-translate>General</TabsTrigger>
              <TabsTrigger value="address" data-translate>Address</TabsTrigger>
              <TabsTrigger value="contact" data-translate>Contact</TabsTrigger>
              <TabsTrigger value="additional" data-translate>Additional Info</TabsTrigger>
              <TabsTrigger value="organization" data-translate>Organization Type</TabsTrigger>
              <TabsTrigger value="logo" data-translate>{getOrganizationLabel()} Logo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name" data-translate>{getOrganizationLabel()} Name</Label>
                <Input 
                  id="company-name" 
                  value={companyNameEdit}
                  onChange={(e) => setCompanyNameEdit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-description" data-translate>Description</Label>
                <Textarea 
                  id="company-description" 
                  value={companyDescriptionEdit}
                  onChange={(e) => setCompanyDescriptionEdit(e.target.value)}
                  rows={4}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="address" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street" data-translate>Street Address</Label>
                <Input 
                  id="street" 
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="123 Main St"
                  data-translate
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" data-translate>City</Label>
                  <Input 
                    id="city" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                    data-translate
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" data-translate>State/Province</Label>
                  <Input 
                    id="state" 
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="CA"
                    data-translate
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode" data-translate>Zip/Postal Code</Label>
                  <Input 
                    id="zipCode" 
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="94105"
                    data-translate
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" data-translate>Country</Label>
                  <Input 
                    id="country" 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                    data-translate
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" data-translate>Phone Number</Label>
                <Input 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  data-translate
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" data-translate>Email</Label>
                <Input 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  data-translate
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" data-translate>Website</Label>
                <Input 
                  id="website" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  data-translate
                  type="url"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="additional" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxId" data-translate>Tax ID</Label>
                <Input 
                  id="taxId" 
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="XX-XXXXXXX"
                  data-translate
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationId" data-translate>Registration ID</Label>
                <Input 
                  id="registrationId" 
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  placeholder="Company Registration Number"
                  data-translate
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry" data-translate>Industry</Label>
                  <Input 
                    id="industry" 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Technology"
                    data-translate
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foundedDate" data-translate>Founded Date</Label>
                  <Input 
                    id="foundedDate" 
                    value={foundedDate}
                    onChange={(e) => setFoundedDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    data-translate
                    type="date"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="organization" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization-type" data-translate>Organization Type</Label>
                <Select 
                  value={organizationType} 
                  onValueChange={(value) => {
                    setOrganizationType(value as OrganizationType);
                    // Set default label based on type if not customized
                    if (!organizationLabel || organizationLabel === "Company") {
                      if (value === OrganizationType.STRATA) setOrganizationLabel("Strata Council");
                      else if (value === OrganizationType.UNION) setOrganizationLabel("Union");
                      else if (value === OrganizationType.NONPROFIT) setOrganizationLabel("Nonprofit");
                      else if (value === OrganizationType.ASSOCIATION) setOrganizationLabel("Association");
                      else if (value === OrganizationType.COMPANY) setOrganizationLabel("Company");
                      else setOrganizationLabel("Organization");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization type" data-translate />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrganizationType.COMPANY} data-translate>Company</SelectItem>
                    <SelectItem value={OrganizationType.STRATA} data-translate>Strata Council</SelectItem>
                    <SelectItem value={OrganizationType.UNION} data-translate>Union</SelectItem>
                    <SelectItem value={OrganizationType.NONPROFIT} data-translate>Nonprofit</SelectItem>
                    <SelectItem value={OrganizationType.ASSOCIATION} data-translate>Association</SelectItem>
                    <SelectItem value={OrganizationType.OTHER} data-translate>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization-label" data-translate>Custom Label</Label>
                <Input
                  id="organization-label"
                  value={organizationLabel}
                  onChange={(e) => setOrganizationLabel(e.target.value)}
                  placeholder="Company, Association, etc."
                  data-translate
                />
                <p className="text-xs text-muted-foreground mt-1" data-translate>This label will be used throughout the app when referring to your organization</p>
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {logoPreview && (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt={`${getOrganizationLabel()} logo preview`} 
                      className="h-40 w-40 object-contain border rounded-md p-2" 
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full" 
                      onClick={removeLogo}
                      aria-label="Remove logo"
                      data-translate
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="w-full max-w-xs">
                  <Label htmlFor="logo-upload" className="block mb-2" data-translate>Upload {getOrganizationLabel()} Logo</Label>
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-center text-muted-foreground mb-1" data-translate>Click or drag and drop</p>
                    <p className="text-xs text-center text-muted-foreground" data-translate>SVG, PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                  <input 
                    ref={fileInputRef}
                    id="logo-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/gif,image/svg+xml"
                    onChange={handleFileChange}
                  />
                </div>
                
                {isUploading && (
                  <div className="w-full max-w-xs">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-center mt-1" data-translate>{uploadProgress}% uploaded</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <h3 className="text-sm font-medium" data-translate>{getOrganizationLabel()} Name</h3>
                <p>{company.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium" data-translate>Description</h3>
                <p>{company.description || "No description"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium" data-translate>Organization Type</h3>
                <p>
                  {company.organizationType === OrganizationType.STRATA ? "Strata Council" :
                   company.organizationType === OrganizationType.UNION ? "Union" :
                   company.organizationType === OrganizationType.NONPROFIT ? "Nonprofit" :
                   company.organizationType === OrganizationType.ASSOCIATION ? "Association" :
                   company.organizationType === OrganizationType.OTHER ? "Other" : "Company"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium" data-translate>Created</h3>
                <p>{new Date(company.created_at?.seconds * 1000).toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Owner information section */}
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-medium" data-translate>Ownership</h3>
                {isOwner && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTransferDialogOpen(true)}
                    data-translate
                  >
                    Transfer Ownership
                  </Button>
                )}
              </div>
              <div className="bg-muted/40 rounded-md p-3 flex items-center">
                <UserCircle2 className="h-10 w-10 text-muted-foreground mr-3" />
                <div>
                  <p className="font-medium">
                    {owner?.displayName || owner?.email || "Owner"}
                    {owner?.userId === auth.currentUser?.uid && " (You)"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {owner?.email && owner.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" data-translate>
                    Company Owner - Has full control over this {getOrganizationLabel().toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Only show address section if any address field exists */}
            {(company.address?.street || company.address?.city || company.address?.state || 
              company.address?.zipCode || company.address?.country) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-base font-medium mb-2" data-translate>Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {company.address?.street && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Street</h4>
                        <p>{company.address.street}</p>
                      </div>
                    )}
                    {company.address?.city && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>City</h4>
                        <p>{company.address.city}</p>
                      </div>
                    )}
                    {company.address?.state && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>State/Province</h4>
                        <p>{company.address.state}</p>
                      </div>
                    )}
                    {company.address?.zipCode && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Zip/Postal Code</h4>
                        <p>{company.address.zipCode}</p>
                      </div>
                    )}
                    {company.address?.country && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Country</h4>
                        <p>{company.address.country}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Only show contact section if any contact field exists */}
            {(company.contact?.phone || company.contact?.email || company.contact?.website) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-base font-medium mb-2" data-translate>Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {company.contact?.phone && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Phone</h4>
                        <p>{company.contact.phone}</p>
                      </div>
                    )}
                    {company.contact?.email && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Email</h4>
                        <p>{company.contact.email}</p>
                      </div>
                    )}
                    {company.contact?.website && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Website</h4>
                        <a href={company.contact.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {company.contact.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Only show additional section if any additional field exists */}
            {(company.taxId || company.registrationId || company.industry || company.foundedDate) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-base font-medium mb-2" data-translate>Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {company.taxId && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Tax ID</h4>
                        <p>{company.taxId}</p>
                      </div>
                    )}
                    {company.registrationId && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Registration ID</h4>
                        <p>{company.registrationId}</p>
                      </div>
                    )}
                    {company.industry && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Industry</h4>
                        <p>{company.industry}</p>
                      </div>
                    )}
                    {company.foundedDate && (
                      <div>
                        <h4 className="text-sm font-medium" data-translate>Founded Date</h4>
                        <p>{company.foundedDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* Transfer Ownership Dialog */}
      <TransferOwnershipDialog
        companyId={company.id}
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onTransferComplete={() => {
          // Force refresh to update the UI
          window.location.reload();
        }}
      />
      
      {isEditing && (
        <CardFooter className="justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                // Reset all form fields to original values123
                setCompanyNameEdit(company.name);
                setCompanyDescriptionEdit(company.description || "");
                setStreet(company.address?.street || "");
                setCity(company.address?.city || "");
                setState(company.address?.state || "");
                setZipCode(company.address?.zipCode || "");
                setCountry(company.address?.country || "");
                setPhone(company.contact?.phone || "");
                setEmail(company.contact?.email || "");
                setWebsite(company.contact?.website || "");
                setTaxId(company.taxId || "");
                setRegistrationId(company.registrationId || "");
                setIndustry(company.industry || "");
                setFoundedDate(company.foundedDate || "");
                setOrganizationType(company.organizationType || OrganizationType.COMPANY);
                setOrganizationLabel(company.settings?.organizationLabel || "Company");
                setLogoFile(null);
                setLogoPreview(company.logo_url || "");
                setActiveTab("general");
                setIsEditing(false);
              }}
              data-translate
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCompany} 
              disabled={updating || !companyNameEdit.trim()}
              data-translate
            >
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          
          {isOwner && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteCompany}
              disabled={updating}
              data-translate
            >
              Delete {getOrganizationLabel()}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default CompanyOverview;
