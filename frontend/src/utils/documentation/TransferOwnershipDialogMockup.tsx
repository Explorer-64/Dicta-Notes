import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompanyRepository, CompanyUser } from "../utils/company";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface TransferOwnershipDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferComplete?: () => void;
}

/**
 * Dialog component for transferring company ownership to another member
 * 
 * This is a mockup/example component that would implement the transfer ownership UI
 */
export function TransferOwnershipDialog({
  companyId,
  open,
  onOpenChange,
  onTransferComplete
}: TransferOwnershipDialogProps) {
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  
  // Load company users when dialog opens
  useEffect(() => {
    if (open) {
      loadCompanyUsers();
    }
  }, [open, companyId]);
  
  const loadCompanyUsers = async () => {
    try {
      setLoading(true);
      const users = await CompanyRepository.listCompanyUsers(companyId);
      // Filter out the current owner
      const filteredUsers = users.filter(user => {
        return user.userId !== CompanyRepository.getCurrentUserId();
      });
      setCompanyUsers(filteredUsers);
      setSelectedUserId(""); // Reset selection
    } catch (error) {
      console.error("Error loading company users:", error);
      toast.error("Failed to load company members");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTransferOwnership = async () => {
    if (!selectedUserId) {
      toast.error("Please select a member to transfer ownership to");
      return;
    }
    
    if (!confirm("Are you sure you want to transfer ownership? This action cannot be undone and will give the new owner full control over the company.")) {
      return;
    }
    
    try {
      setTransferring(true);
      await CompanyRepository.transferOwnership(companyId, selectedUserId);
      toast.success("Company ownership transferred successfully");
      onOpenChange(false);
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error) {
      console.error("Error transferring ownership:", error);
      toast.error("Failed to transfer ownership");
    } finally {
      setTransferring(false);
    }
  };
  
  // Get the name of the selected user for confirmation
  const getSelectedUserName = () => {
    const user = companyUsers.find(u => u.userId === selectedUserId);
    return user ? (user.displayName || user.email) : "the selected member";
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-labelledby="transfer-ownership-dialog-title" aria-describedby="transfer-ownership-dialog-description">
        <DialogHeader>
          <DialogTitle id="transfer-ownership-dialog-title">Transfer Company Ownership</DialogTitle>
          <DialogDescription id="transfer-ownership-dialog-description">
            Transfer ownership of this company to another member. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <h4 className="font-medium text-yellow-700">Important</h4>
            </div>
            <p className="mt-1 text-sm text-yellow-700">
              Transferring ownership will give the new owner full control over the company, including the ability to:
            </p>
            <ul className="mt-1 text-sm text-yellow-700 list-disc pl-5 space-y-1">
              <li>Delete the company entirely</li>
              <li>Remove you as a member</li>
              <li>Change company settings</li>
              <li>Manage all company transcripts</li>
            </ul>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Select a new owner:</h3>
            
            {loading ? (
              <p className="text-center py-4 text-sm text-gray-500">Loading company members...</p>
            ) : companyUsers.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-500">
                No eligible members found. Please add members to the company first.
              </p>
            ) : (
              <div className="space-y-2">
                {companyUsers.map((user) => (
                  <div 
                    key={user.id}
                    className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-100 ${selectedUserId === user.userId ? 'bg-gray-100 border border-primary' : 'border'}`}
                    onClick={() => setSelectedUserId(user.userId)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{user.displayName || user.email}</h4>
                      {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </p>
                    </div>
                    <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center">
                      {selectedUserId === user.userId && (
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transferring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransferOwnership}
            disabled={transferring || !selectedUserId || loading}
            className="ml-2"
          >
            {transferring ? (
              "Transferring..."
            ) : (
              `Transfer to ${selectedUserId ? getSelectedUserName() : "selected member"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
