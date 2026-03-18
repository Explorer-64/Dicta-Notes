import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCurrentUser } from "app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "../components/Spinner";
import { CompanyRepository } from "../utils/company";
import { toast } from "sonner";
import { firebaseAuth } from "app";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { NoIndexMeta } from "components/NoIndexMeta";

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useCurrentUser();
  const [invitationData, setInvitationData] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "invalid" | "ready" | "completed" | "error" | "switching">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const invitationId = searchParams.get("invitationId");
  const oobCode = searchParams.get("oobCode"); // The password reset code from Firebase
  
  // Load invitation information
  useEffect(() => {
    async function checkInvitation() {
      if (!invitationId) {
        setStatus("invalid");
        setErrorMessage("No invitation ID found");
        return;
      }
      
      try {
        const invitation = await CompanyRepository.checkInvitation(invitationId);
        setInvitationData(invitation);
        
        // Check invitation status
        if (invitation.status === "accepted") {
          setStatus("completed");
          return;
        }
        
        // Check if user is already signed in
        if (!authLoading && user) {
          // User is already signed in, check if it's the correct user
          if (user.email === invitation.email) {
            setStatus("ready");
          } else {
            // User is signed in with wrong account - auto sign out
            console.log("Wrong user account, automatically signing out");
            setStatus("switching");
            
            // Store the invitation ID in session storage before signing out
            sessionStorage.setItem('pendingInvitationId', invitationId || '');
            
            // Use the navigation utility to ensure proper redirect after login
            import("../utils/navigation").then(({ prepareForAuth }) => {
              prepareForAuth(`/accept-invitation?invitationId=${invitationId}`);
              
              // Automatically sign out and redirect
              firebaseAuth.signOut().then(() => {
                toast.info(`Signing you out from ${user.email} to accept invitation for ${invitation.email}`);
                navigate(`/login?redirect=/accept-invitation?invitationId=${invitationId}`);
              }).catch(error => {
                console.error("Error signing out:", error);
                setStatus("invalid");
                setErrorMessage(`This invitation was sent to ${invitation.email}. You are currently signed in as ${user.email}. Please sign out manually and try again.`);
              });
            });
          }
        } else if (!authLoading && !user) {
          // If user is not signed in but we have oobCode (password reset code)
          if (oobCode) {
            // We'll handle this case once Firebase UI loads
            setStatus("ready");
          } else {
            // User needs to sign in first
            setStatus("invalid");
            setErrorMessage(`Please sign in with ${invitation.email} to accept this invitation.`);
          }
        }
      } catch (error) {
        console.error("Error checking invitation:", error);
        setStatus("invalid");
        setErrorMessage("Invalid or expired invitation");
      }
    }
    
    if (!authLoading) {
      checkInvitation();
    }
  }, [invitationId, authLoading, user, oobCode, navigate]);
  
  // Handle accepting the invitation
  const handleAcceptInvitation = async () => {
    if (!invitationId || !user) return;
    
    try {
      setStatus("loading");
      const result = await CompanyRepository.acceptInvitation(invitationId);
      
      if (result.success) {
        setStatus("completed");
        toast.success("You have successfully joined the company!");
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setStatus("error");
      setErrorMessage("Failed to accept invitation");
    }
  };
  
  // Navigate to the company
  const goToCompany = () => {
    if (invitationData?.companyId) {
      navigate(`/company?id=${invitationData.companyId}`);
    } else {
      navigate("/companies");
    }
  };
  
  // Go to login page
  const goToLogin = () => {
    navigate("/login");
  };
  
  // Sign out current user
  const handleSignOut = async () => {
    try {
      // Store the invitation ID in session storage before signing out
      sessionStorage.setItem('pendingInvitationId', invitationId || '');
      
      await firebaseAuth.signOut();
      toast.success("Signed out successfully. Please sign in with the invited email.");
      
      // Use the navigation utility to ensure proper redirect after login
      import("../utils/navigation").then(({ prepareForAuth }) => {
        prepareForAuth(`/accept-invitation?invitationId=${invitationId}`);
        navigate(`/login?redirect=/accept-invitation?invitationId=${invitationId}`);
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };
  
  if (status === "loading" || authLoading || status === "switching") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Processing Invitation</CardTitle>
            <CardDescription>
              {status === "switching" ? "Switching accounts for you..." : "Please wait while we process your invitation..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Spinner size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (status === "invalid" || status === "error") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="text-destructive" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>There was a problem with this invitation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Button>
            
            {!user && (
              <Button onClick={goToLogin}>Sign In</Button>
            )}
            
          {user && errorMessage.includes("different email") && (
            <Button onClick={handleSignOut}>Sign Out & Continue</Button>
          )}
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (status === "completed") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              Invitation Accepted
            </CardTitle>
            <CardDescription>
              You have successfully joined {invitationData?.companyName || "the company"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You can now access the company and its transcripts.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={goToCompany} className="w-full">
              Go to Company Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Ready to accept invitation
  return (
    <div className="min-h-screen bg-background">
      <NoIndexMeta />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Accept Invitation - Dicta-Notes</title>
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Company</CardTitle>
          <CardDescription>
            You have been invited to join {invitationData?.companyName || "a company"} as a {invitationData?.role.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p><strong>Invitation Details:</strong></p>
              <p className="text-sm text-muted-foreground">Email: {invitationData?.email}</p>
              <p className="text-sm text-muted-foreground">Role: {invitationData?.role}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button onClick={handleAcceptInvitation}>
            Accept Invitation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
