import { useCurrentUser } from "app";
import { useUserProfile } from "utils/userProfile";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import brain from "brain";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';
import { ThemeSwitcher } from 'components/ThemeSwitcher';
import { useQuota } from 'utils/useQuota';

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CreditCard, Calendar, TrendingUp, ExternalLink, AlertCircle, Megaphone, Link as LinkIcon } from "lucide-react";
import { Header } from 'components/Header';
import { ModuleSettings } from 'components/ModuleSettings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ProtectedRoute } from 'components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TranslationCacheAdmin } from 'components/TranslationCacheAdmin';
import { AdminDiagnosticTools } from 'components/AdminDiagnosticTools';
import { ChangePasswordForm } from 'components/ChangePasswordForm';
import { UsageDashboard } from 'components/UsageDashboard';
import { Badge } from '@/components/ui/badge';
import { SupportRepliesAdmin } from 'components/SupportRepliesAdmin';
import { NoIndexMeta } from "components/NoIndexMeta";
import { LanguageSettingsSection } from 'components/LanguageSettingsSection';
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { firebaseAuth } from "app";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useUserProfile();
  const [selectedUserType, setSelectedUserType] = useState<'standard' | 'freelancer' | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<string>('tools');
  const [isSavingBetaDate, setIsSavingBetaDate] = useState(false);
  
  // Account Deletion State
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState<{
    tier: string;
    billingAnniversary: string;
    isGrandfathered: boolean;
    cancelAtPeriodEnd: boolean;
  } | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setSelectedUserType(profile.userType || 'standard'); // Default to 'standard' if not set
    }
  }, [profile]);
  
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await brain.get_my_tier_info();
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData({
            tier: data.tier || 'free',
            billingAnniversary: data.billing_anniversary || new Date().toISOString(),
            isGrandfathered: data.is_grandfathered || false,
            cancelAtPeriodEnd: data.cancel_at_period_end || false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const handleUserTypeChange = async (value: 'standard' | 'freelancer') => {
    if (!user || !value || value === profile?.userType) return;

    setSelectedUserType(value);
    setIsSaving(true);
    try {
      // Use User Profile API instead of direct Firestore write
      const response = await brain.update_user_type({ user_type: value });
      
      if (response.ok) {
        toast.success("User type updated successfully!");
        // Manually refetch profile data to update the UI state
        refetchProfile();
      } else {
        throw new Error('Failed to update user type');
      }
    } catch (error) {
      console.error("Error updating user type:", error);
      toast.error("Failed to update user type. Please try again.");
      // Revert optimistic update on error
      setSelectedUserType(profile?.userType || 'standard');
    } finally {
      setIsSaving(false);
    }
  };
  
  const getTierDisplay = (tier: string) => {
    const tierMap: Record<string, string> = {
      free: 'Free',
      individual: 'Individual',
      professional: 'Professional',
      business: 'Business',
    };
    return tierMap[tier] || tier;
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleManageBilling = () => {
    navigate('/contact?topic=billing');
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll retain access until the end of your billing period.')) {
      return;
    }

    try {
      const response = await brain.cancel_subscription();
      if (response.ok) {
        toast.success('Subscription cancelled successfully');
        // Refresh subscription info
        // fetchSubscriptionInfo(); // Wait, this function is not defined in the original file scope, I saw fetchSubscription inside useEffect. 
        // I should probably trigger re-fetch or just reload. 
        // The original code had fetchSubscription defined inside useEffect.
        // I'll leave the original code alone regarding this as I'm not fixing the cancel handler here, 
        // but I saw it in the read_code output. 
        // Actually, looking at read_code output, handleCancelSubscription calls fetchSubscriptionInfo() which is NOT defined in the snippet I saw?
        // Ah, I missed it or it's missing. 
        // Let's ignore that for now and focus on delete account.
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await brain.delete_account();
      if (response.ok) {
        toast.success("Account deleted successfully");
        await firebaseAuth.signOut();
        navigate("/");
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to delete account");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSetBetaEndDate = async () => {
    setIsSavingBetaDate(true);
    try {
      const response = await brain.set_beta_end_date({
        end_date: '2025-11-15T23:59:59Z'
      });
      const data = await response.json();
      toast.success(`Beta end date set to November 15, 2025 (${data.days_remaining} days remaining)`);
    } catch (error) {
      console.error('Failed to set beta end date:', error);
      toast.error('Failed to set beta end date');
    } finally {
      setIsSavingBetaDate(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <NoIndexMeta />
      <div className="min-h-screen flex flex-col notranslate">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          
          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="language">Language</TabsTrigger>
              <TabsTrigger value="connected-apps">Connected Apps</TabsTrigger>
            </TabsList>
            
            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription & Billing</CardTitle>
                  <CardDescription>
                    Manage your plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingSubscription ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-20 bg-muted rounded" />
                    </div>
                  ) : subscriptionData ? (
                    <>
                      {/* Current Plan */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-foreground">
                              {getTierDisplay(subscriptionData.tier)}
                            </p>
                            {subscriptionData.isGrandfathered && (
                              <Badge className="bg-orange-600 dark:bg-orange-500 text-white">
                                Beta Discount: 10% off forever
                              </Badge>
                            )}
                          </div>
                          {subscriptionData.cancelAtPeriodEnd && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-destructive">
                              <AlertCircle className="w-4 h-4" />
                              <span>Cancels on {new Date(subscriptionData.billingAnniversary).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        {subscriptionData.tier !== 'business' && (
                          <Button onClick={handleUpgrade} size="sm">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade Plan
                          </Button>
                        )}
                      </div>

                      {/* Usage Dashboard */}
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Current Usage</h3>
                        <UsageDashboard compact />
                      </div>

                      {/* Billing Information */}
                      {subscriptionData.tier !== 'free' && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-foreground">Billing Information</h3>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">Next Billing Date</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(subscriptionData.billingAnniversary).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button onClick={handleManageBilling} variant="outline" className="w-full">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Manage Payment Method
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}

                      {/* Plan Actions */}
                      {subscriptionData.tier !== 'free' && !subscriptionData.cancelAtPeriodEnd && (
                        <div className="pt-4 border-t">
                          <Button
                            onClick={handleCancelSubscription}
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            size="sm"
                          >
                            Cancel Subscription
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Unable to load subscription information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-6">
              <ModuleSettings />
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">User Settings</h3>
                
                {profileError && (
                  <Alert variant="destructive" className="mb-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error Loading Profile</AlertTitle>
                    <AlertDescription>
                      Could not load profile settings. Please try refreshing.
                    </AlertDescription>
                  </Alert>
                )}
                
                {profileLoading && !profileError && (
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-1/4 mb-2" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                )}

                {!profileLoading && !profileError && (
                  <div>
                    <Label className="font-semibold mb-2 block">My User Type:</Label>
                    <RadioGroup 
                      value={selectedUserType}
                      onValueChange={handleUserTypeChange} 
                      disabled={isSaving}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="userType-standard" />
                        <Label htmlFor="userType-standard" className="font-normal">
                          Standard User (Using Dicta-Notes for personal or business notes)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="freelancer" id="userType-freelancer" />
                        <Label htmlFor="userType-freelancer" className="font-normal">
                          Freelancer / Note-taker (Providing services to clients)
                        </Label>
                      </div>
                    </RadioGroup>
                    {isSaving && <p className='text-sm text-muted-foreground mt-2'>Saving...</p>}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="flex flex-col items-center space-y-8">
                <ChangePasswordForm />
                
                <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>
                      Irreversible actions for your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <p>Deleting your account will:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Cancel your active subscription</li>
                          <li>Permanently delete your profile</li>
                          <li>Remove all your sessions and transcripts</li>
                          <li>Delete all your audio files</li>
                        </ul>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-4">
                              <p>
                                This action cannot be undone. This will permanently delete your account,
                                active subscription, and all associated data from our servers.
                              </p>
                              <div className="space-y-2">
                                <Label htmlFor="confirm-delete">
                                  Type <strong>DELETE</strong> to confirm
                                </Label>
                                <Input
                                  id="confirm-delete"
                                  value={deleteConfirmation}
                                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                                  placeholder="DELETE"
                                  className="border-destructive/50 focus-visible:ring-destructive"
                                />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteAccount();
                              }}
                              disabled={deleteConfirmation !== "DELETE" || isDeletingAccount}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeletingAccount ? "Deleting..." : "Delete Account"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-xl font-medium mb-4">Appearance Settings</h3>
                <ThemeSwitcher />
              </div>
            </TabsContent>

            <TabsContent value="language" className="space-y-6">
              <LanguageSettingsSection />
            </TabsContent>

            <TabsContent value="connected-apps" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Connected Apps
                  </CardTitle>
                  <CardDescription>
                    Manage integrations with companion apps and services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Agenda Flow Integration */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-foreground">Agenda Flow</h3>
                        <p className="text-sm text-muted-foreground">
                          Calendar integration and auto-join for scheduled meetings
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate('/ConnectAgendaFlow')}
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect Now
                      </Button>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-muted" />
                        <span>Not Connected</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Connect to enable calendar sync and automatic meeting transcription
                      </p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Admin Tools Section */}
          {user && (user.email === "abereimer64@gmail.com" || user.email === "dward@wevad.com" || user.email === "dianareimer90@gmail.com") && (
            <>
              <Separator className="my-8" />
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                
                <Tabs 
                  value={activeAdminTab} 
                  onValueChange={setActiveAdminTab}
                  className="w-full"
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="tools">Admin Tools</TabsTrigger>
                    <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
                    <TabsTrigger value="cache">Translation Cache</TabsTrigger>
                    <TabsTrigger value="support">Support Inbox</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tools" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Quota Management</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <QuotaAdmin />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Admin Testing Tools</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          <Link to="/AdminSpeechTest">
                            <Button variant="outline">Admin Speech Test Page</Button>
                          </Link>
                          <Link to="/BetaAnnouncements">
                            <Button variant="outline">
                              <Megaphone className="w-4 h-4 mr-2" />
                              Beta Announcements
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="diagnostics" className="space-y-4">
                    <AdminDiagnosticTools />
                  </TabsContent>
                  
                  <TabsContent value="cache" className="space-y-4">
                    <TranslationCacheAdmin />
                  </TabsContent>
                  
                  <TabsContent value="support" className="space-y-4">
                    <SupportRepliesAdmin />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Admin: Beta Transition</CardTitle>
              <CardDescription>
                Configure beta end date and transition settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Beta End Date</p>
                  <p className="text-sm text-muted-foreground">
                    Currently set to: November 15, 2025
                  </p>
                </div>
                <Button
                  onClick={handleSetBetaEndDate}
                  disabled={isSavingBetaDate}
                >
                  {isSavingBetaDate ? 'Setting...' : 'Confirm Date'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <footer className="mt-auto py-6 bg-gray-50">
          <div className="container mx-auto px-4">
            <Separator className="mb-6" />
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Dicta-Notes. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
};

const QuotaAdmin = () => {
  const { user } = useCurrentUser();
  const { status, refreshQuota } = useQuota();
  const [isResetting, setIsResetting] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  // Fetch all users usage
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await brain.get_all_users_usage();
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching all users:", error);
      toast.error("Failed to load users list");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleResetUsage = async (userId: string) => {
    setResettingUserId(userId);
    try {
      const response = await brain.reset_usage_endpoint({ userId });
      if (response.ok) {
        toast.success("Usage reset successfully!");
        if (userId === user?.uid) {
          refreshQuota();
        }
        fetchAllUsers(); // Refresh the list
      } else {
        throw new Error('Failed to reset usage');
      }
    } catch (error) {
      console.error("Error resetting usage:", error);
      toast.error("Failed to reset usage");
    } finally {
      setResettingUserId(null);
    }
  };

  if (status.loading) {
    return <div className="text-sm text-muted-foreground">Loading usage stats...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current User Stats */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Your Usage</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Minutes Used</div>
            <div className="text-2xl font-bold">{status.usage.toFixed(1)} / {status.limit}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Minutes Remaining</div>
            <div className="text-2xl font-bold">{status.remaining.toFixed(1)}</div>
          </div>
        </div>
        
        {status.resetDate && (
          <div className="text-sm text-muted-foreground mt-2">
            Resets on: {status.resetDate.toLocaleDateString()}
          </div>
        )}
      </div>

      <Separator />

      {/* All Users Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">All Users Usage</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAllUsers}
            disabled={loadingUsers}
          >
            {loadingUsers ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {loadingUsers ? (
          <div className="text-sm text-muted-foreground">Loading users...</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">User Email</th>
                  <th className="text-left p-3 text-sm font-medium">Used</th>
                  <th className="text-left p-3 text-sm font-medium">Remaining</th>
                  <th className="text-left p-3 text-sm font-medium">Reset Date</th>
                  <th className="text-left p-3 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  allUsers.map((userItem) => (
                    <tr key={userItem.userId} className="border-t">
                      <td className="p-3 text-sm">
                        {userItem.email}
                        {userItem.userId === user?.uid && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">{userItem.minutes_used.toFixed(1)} min</td>
                      <td className="p-3 text-sm">{userItem.minutes_remaining.toFixed(1)} min</td>
                      <td className="p-3 text-sm">
                        {userItem.reset_date
                          ? new Date(userItem.reset_date * 1000).toLocaleDateString()
                          : "Not set"}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetUsage(userItem.userId)}
                          disabled={resettingUserId === userItem.userId}
                        >
                          {resettingUserId === userItem.userId ? "Resetting..." : "Reset"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Resetting a user's usage will set it to 0 minutes.
      </p>
    </div>
  );
};

export default Settings;
