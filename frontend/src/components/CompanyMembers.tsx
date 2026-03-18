import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { CompanyRepository, CompanyUser, CompanyUserRole } from "../utils/company";
import { UserPermissionDialog } from "./UserPermissionDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import brain from "brain";

interface CompanyMembersProps {
  companyId: string;
  companyUsers: CompanyUser[];
  userRole: CompanyUserRole | null;
  currentUserId: string;
  onMembersChange: () => void;
}

interface InviteFormData {
  email: string;
  role: CompanyUserRole;
}

const CompanyMembers = ({ 
  companyId, 
  companyUsers, 
  userRole, 
  currentUserId,
  onMembersChange 
}: CompanyMembersProps) => {
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: "",
    role: CompanyUserRole.MEMBER
  });
  const [isInviting, setIsInviting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [teamSizeLimit, setTeamSizeLimit] = useState<number | null>(null);
  const [loadingTeamLimit, setLoadingTeamLimit] = useState(true);

  // Fetch team size limit on mount
  useEffect(() => {
    const fetchTeamLimit = async () => {
      try {
        const response = await brain.check_team_sharing_access();
        const data = await response.json();
        setTeamSizeLimit(data.team_size_limit);
      } catch (error) {
        console.error('Error fetching team limit:', error);
      } finally {
        setLoadingTeamLimit(false);
      }
    };
    fetchTeamLimit();
  }, []);

  const handleInviteUser = async () => {
    if (!inviteForm.email) return;
    
    try {
      setIsInviting(true);
      const response = await CompanyRepository.sendInvitation(companyId, {
        email: inviteForm.email,
        role: inviteForm.role
      });
      
      if (response.success) {
        toast.success(`Invitation sent to ${inviteForm.email}`);
        setInviteForm({ email: "", role: CompanyUserRole.MEMBER });
        
        // Refresh user list via parent callback
        onMembersChange();
      } else {
        toast.error(response.message || "Failed to invite user");
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error("Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveUser = async (companyUserId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) {
      return;
    }
    
    try {
      await CompanyRepository.removeCompanyUser(companyUserId);
      toast.success("User removed successfully");
      
      // Refresh user list via parent callback
      onMembersChange();
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user");
    }
  };

  const handleUpdateUserRole = async (companyUserId: string, newRole: CompanyUserRole) => {
    try {
      await CompanyRepository.updateCompanyUser(companyUserId, { role: newRole });
      toast.success("User role updated successfully");
      
      // Refresh user list via parent callback
      onMembersChange();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleUpdateUserPermissions = async (updatedUser: CompanyUser) => {
    try {
      await CompanyRepository.updateCompanyUser(updatedUser.id, { 
        permissions: updatedUser.permissions 
      });
      toast.success("User permissions updated successfully");
      
      // Refresh user list via parent callback
      onMembersChange();
      return Promise.resolve();
    } catch (error) {
      console.error("Error updating user permissions:", error);
      toast.error("Failed to update user permissions");
      return Promise.reject(error);
    }
  };

  const openPermissionsDialog = (user: CompanyUser) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle data-translate>Company Members</CardTitle>
          <CardDescription data-translate>
            Manage users who have access to this company
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRole === CompanyUserRole.ADMIN && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2" data-translate>Invite New Member</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="invite-email" data-translate>Email</Label>
                  <Input 
                    id="invite-email" 
                    type="email" 
                    placeholder="example@company.com"
                    data-translate
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role" data-translate>Role</Label>
                  <div className="flex items-center space-x-1">
                    <select
                      id="invite-role"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as CompanyUserRole })}
                    >
                      <option value={CompanyUserRole.ADMIN} data-translate>Admin</option>
                      <option value={CompanyUserRole.MEMBER} data-translate>Member</option>
                      <option value={CompanyUserRole.GUEST} data-translate>Guest</option>
                    </select>
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                            <HelpCircle className="h-4 w-4" />
                            <span className="sr-only" data-translate>Role information</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <ul className="text-xs space-y-1">
                            <li data-translate><strong>Admin:</strong> Can manage users, invite new members, and configure settings</li>
                            <li data-translate><strong>Member:</strong> Can create and edit transcripts based on permissions</li>
                            <li data-translate><strong>Guest:</strong> Limited access with viewing permissions only</li>
                            <li data-translate><em>Note: Only the Owner can transfer ownership or delete the company</em></li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Button 
                  className="mb-[2px]"
                  onClick={handleInviteUser}
                  disabled={isInviting || !inviteForm.email.trim()}
                  data-translate
                >
                  {isInviting ? <span data-translate>Inviting...</span> : <span data-translate>Invite User</span>}
                </Button>
              </div>
            </div>
          )}
          
          <Separator className="my-4" />
          
          {companyUsers.length === 0 ? (
            <div className="text-center py-8">
              <p data-translate>No users in this company yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {companyUsers.map((companyUser) => (
                <div key={companyUser.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <div className="font-medium">{companyUser.displayName || companyUser.email}</div>
                    <div className="text-sm text-gray-500">{companyUser.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      <span data-translate>Role:</span> {companyUser.role.charAt(0).toUpperCase() + companyUser.role.slice(1)}
                    </div>
                  </div>
                  
                  {userRole === CompanyUserRole.ADMIN && companyUser.userId !== currentUserId && (
                    <div className="flex gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={companyUser.role}
                        onChange={(e) => handleUpdateUserRole(companyUser.id, e.target.value as CompanyUserRole)}
                      >
                        <option value={CompanyUserRole.ADMIN} data-translate>Admin</option>
                        <option value={CompanyUserRole.MEMBER} data-translate>Member</option>
                        <option value={CompanyUserRole.GUEST} data-translate>Guest</option>
                      </select>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0 mr-1">
                              <HelpCircle className="h-3 w-3" />
                              <span className="sr-only" data-translate>Role information</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <ul className="text-xs space-y-1">
                              <li data-translate><strong>Admin:</strong> Can manage users, invite new members, and configure settings</li>
                              <li data-translate><strong>Member:</strong> Can create and edit transcripts based on permissions</li>
                              <li data-translate><strong>Guest:</strong> Limited access with viewing permissions only</li>
                              <li data-translate><em>Note: Only the Owner can transfer ownership or delete the company</em></li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openPermissionsDialog(companyUser)}
                        title="Manage permissions" data-translate
                      >
                        <Settings size={18} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveUser(companyUser.id)}
                        data-translate
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* User Permission Dialog */}
      {selectedUser && (
        <UserPermissionDialog
          user={selectedUser}
          open={permissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
          onSave={handleUpdateUserPermissions}
        />
      )}
    </>
  );
};

export default CompanyMembers;
