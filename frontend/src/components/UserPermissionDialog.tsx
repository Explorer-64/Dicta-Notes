import { useState } from "react";
import { CompanyUser } from "../utils/company/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface UserPermissionDialogProps {
  user: CompanyUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (user: CompanyUser) => Promise<void>;
}

export function UserPermissionDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: UserPermissionDialogProps) {
  const [permissions, setPermissions] = useState(user.permissions || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...user,
        permissions,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="user-permission-dialog-description">
        <DialogHeader>
          <DialogTitle id="user-permission-dialog-title">Manage User Permissions</DialogTitle>
          <DialogDescription id="user-permission-dialog-description">
            Set permissions for {user.displayName || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Global Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Global Permissions</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canViewAll">View All Content</Label>
                <Switch
                  id="canViewAll"
                  checked={permissions.canViewAll || false}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, canViewAll: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canEditAll">Edit All Content</Label>
                <Switch
                  id="canEditAll"
                  checked={permissions.canEditAll || false}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, canEditAll: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canManageUsers">Manage Users</Label>
                <Switch
                  id="canManageUsers"
                  checked={permissions.canManageUsers || false}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, canManageUsers: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Transcript Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Transcript Permissions</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canCreateTranscripts">Create Transcripts</Label>
                <Switch
                  id="canCreateTranscripts"
                  checked={permissions.canCreateTranscripts || false}
                  onCheckedChange={(checked) =>
                    setPermissions({
                      ...permissions,
                      canCreateTranscripts: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canEditTranscripts">Edit Transcripts</Label>
                <Switch
                  id="canEditTranscripts"
                  checked={permissions.canEditTranscripts || false}
                  onCheckedChange={(checked) =>
                    setPermissions({
                      ...permissions,
                      canEditTranscripts: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canDeleteTranscripts">Delete Transcripts</Label>
                <Switch
                  id="canDeleteTranscripts"
                  checked={permissions.canDeleteTranscripts || false}
                  onCheckedChange={(checked) =>
                    setPermissions({
                      ...permissions,
                      canDeleteTranscripts: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canShareTranscripts">Share Transcripts</Label>
                <Switch
                  id="canShareTranscripts"
                  checked={permissions.canShareTranscripts || false}
                  onCheckedChange={(checked) =>
                    setPermissions({
                      ...permissions,
                      canShareTranscripts: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Recording Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recording Permissions</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canAccessRecordings">Access Recordings</Label>
                <Switch
                  id="canAccessRecordings"
                  checked={permissions.canAccessRecordings || false}
                  onCheckedChange={(checked) =>
                    setPermissions({
                      ...permissions,
                      canAccessRecordings: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="canShareRecordings">Share Recordings</Label>
                <Switch
                  id="canShareRecordings"
                  checked={permissions.canShareRecordings || false}
                  onCheckedChange={(checked) =>
                    setPermissions({
                      ...permissions,
                      canShareRecordings: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

