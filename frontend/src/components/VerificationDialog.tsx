import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import brain from "brain";
import { VerificationRequest } from "types";

// Use brain client for API calls

interface VerificationDialogProps {
  sessionId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const VerificationDialog = ({
  sessionId,
  title,
  isOpen,
  onClose,
  onDelete,
}: VerificationDialogProps) => {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Start countdown timer when verification code is sent
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (step === "verify" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Reset expired verification if countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && step === "verify" && verificationSent) {
      toast.error("Verification code has expired. Please request a new code.");
      setStep("request");
      setVerificationSent(false);
    }
  }, [countdown, step, verificationSent]);

  const handleRequestCode = async () => {
    setLoading(true);
    try {
      // Use brain client
      console.log("Using brain.request_deletion_code for session:", sessionId);
      const response = await brain.request_deletion_code({ sessionId });
      
      const data = await response.json();
      
      setExpiresIn(data.expiresIn);
      setCountdown(data.expiresIn);
      setIsAuthorized(data.isAuthorized || false);
      setVerificationSent(true);
      
      // If user is not authorized, show a message and don't send the code
      if (!data.isAuthorized) {
        toast.error(data.message || "You do not have permission to delete this session");
        return;
      }
      
      // If user is authorized, show success message and start verification process
      setStep("verify");
      setResendCooldown(30);
      toast.success(data.message, { duration: 5000 });
    } catch (error) {
      console.error("Error requesting deletion code:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      toast.error("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      // Use brain client
      console.log("Using brain.verify_deletion_code for session:", sessionId);
      const verificationRequest: VerificationRequest = { code };
      
      const response = await brain.verify_deletion_code(
        { sessionId }, 
        verificationRequest
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Code verified successfully");
        onDelete(); // This will trigger the actual deletion
        onClose();
      } else {
        toast.error(data.message || "Invalid verification code");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleBypassDelete = () => {
    onDelete(); // This will trigger the actual deletion
    onClose();
  };

  const resetDialog = () => {
    setStep("request");
    setCode("");
    setExpiresIn(0);
    setCountdown(0);
    setIsAuthorized(null);
    setVerificationSent(false);
    setShowBypass(false);
    setResendCooldown(0);
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          resetDialog();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md" aria-describedby="verification-dialog-description">
        <DialogHeader>
          <DialogTitle id="verification-dialog-title">Delete Session</DialogTitle>
          <DialogDescription id="verification-dialog-description">
            {step === "request" ? (
              <div className="space-y-4">
                <div>
                  You are about to delete <strong>{title}</strong>. This action cannot be undone.
                </div>
                <div>
                  For security reasons, a verification code will be sent to the email address of an admin or owner.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  Please enter the verification code sent to your email address.
                </div>
                <div className="text-xs text-muted-foreground">
                  The code will expire in {countdown} seconds.
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "verify" && (
          <div className="grid gap-4 py-4">
            <Input
              id="verification-code"
              className="text-center text-lg tracking-widest"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              maxLength={6}
            />
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            {/* TEMPORARY: Development bypass button */}
            <Button 
              variant="outline" 
              onClick={() => setShowBypass(!showBypass)}
              className="text-xs"
            >
              {showBypass ? "Hide" : "Dev Bypass"}
            </Button>
          </div>
          {step === "request" ? (
            <div className="flex gap-2">
              {showBypass && (
                <Button 
                  variant="destructive" 
                  onClick={handleBypassDelete}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  ⚠️ Bypass & Delete
                </Button>
              )}
              <Button 
                variant="destructive" 
                onClick={handleRequestCode}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRequestCode}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleVerifyCode}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying
                  </>
                ) : (
                  "Verify & Delete"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


