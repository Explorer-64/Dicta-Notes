import React, { useState } from 'react';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, linkWithCredential } from 'firebase/auth';
import { firebaseAuth } from 'app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Eye, EyeOff, Link, Info } from 'lucide-react';
import { useCurrentUser } from 'app';

interface PasswordStrength {
  score: number;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  return {
    score: 0, // Will be calculated based on requirements met
    requirements: {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  };
};

const getPasswordStrengthColor = (score: number): string => {
  if (score < 3) return 'text-red-500';
  if (score < 4) return 'text-yellow-500';
  return 'text-green-500';
};

const getPasswordStrengthText = (score: number): string => {
  if (score < 3) return 'Weak';
  if (score < 4) return 'Medium';
  return 'Strong';
};

const getFriendlyErrorMessage = (error: any): string => {
  if (!(error instanceof Error) || !('code' in error)) {
    return "An unexpected error occurred. Please try again.";
  }

  switch (error.code) {
    case 'auth/wrong-password':
      return "The current password you entered is incorrect.";
    case 'auth/weak-password':
      return "The new password is too weak. Please choose a stronger password.";
    case 'auth/requires-recent-login':
      return "For security reasons, please log out and log back in before changing your password.";
    case 'auth/user-mismatch':
      return "Authentication error. Please try logging out and back in.";
    case 'auth/user-not-found':
      return "User account not found. Please try logging out and back in.";
    case 'auth/invalid-email':
      return "Invalid email address. Please try logging out and back in.";
    default:
      console.error("Unhandled Firebase Auth Error:", error);
      return `An error occurred (${error.code}). Please try again later.`;
  }
};

export const ChangePasswordForm: React.FC = () => {
  const { user } = useCurrentUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if user signed in with Google (no password provider)
  const isGoogleUser = user?.providerData.some(provider => provider.providerId === 'google.com') && 
                      !user?.providerData.some(provider => provider.providerId === 'password');

  const passwordStrength = checkPasswordStrength(newPassword);
  const strengthScore = Object.values(passwordStrength.requirements).filter(Boolean).length;
  const strengthColor = getPasswordStrengthColor(strengthScore);
  const strengthText = getPasswordStrengthText(strengthScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isGoogleUser) {
      // Handle setting password for Google users
      if (!newPassword || !confirmPassword) {
        setFormError('Please enter and confirm your new password.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setFormError('Password and confirmation do not match.');
        return;
      }

      if (strengthScore < 3) {
        setFormError('Please choose a stronger password that meets more requirements.');
        return;
      }

      if (!user || !user.email) {
        setFormError('User authentication error. Please try logging out and back in.');
        return;
      }

      setIsSubmitting(true);

      try {
        // Link email/password credential to Google account
        const credential = EmailAuthProvider.credential(user.email, newPassword);
        await linkWithCredential(user, credential);

        toast.success('Password set successfully! You can now sign in with either Google or email/password.');
        
        // Clear the form
        setNewPassword('');
        setConfirmPassword('');
        
      } catch (error) {
        const friendlyMessage = getFriendlyErrorMessage(error);
        setFormError(friendlyMessage);
        toast.error(`Failed to set password: ${friendlyMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Handle password change for email/password users
      // Validation checks
      if (!currentPassword || !newPassword || !confirmPassword) {
        setFormError('All fields are required.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setFormError('New password and confirmation do not match.');
        return;
      }

      if (strengthScore < 3) {
        setFormError('Please choose a stronger password that meets more requirements.');
        return;
      }

      if (currentPassword === newPassword) {
        setFormError('New password must be different from current password.');
        return;
      }

      if (!user || !user.email) {
        setFormError('User authentication error. Please try logging out and back in.');
        return;
      }

      setIsSubmitting(true);

      try {
        // Re-authenticate the user with their current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update the password
        await updatePassword(user, newPassword);

        // Success!
        toast.success('Password updated successfully!');
        
        // Clear the form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
      } catch (error) {
        const friendlyMessage = getFriendlyErrorMessage(error);
        setFormError(friendlyMessage);
        toast.error(`Failed to update password: ${friendlyMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isGoogleUser ? (
            <>
              <Link className="h-5 w-5" />
              <span>Set Password</span>
            </>
          ) : (
            <span>Change Password</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isGoogleUser && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Google Account</AlertTitle>
            <AlertDescription>
              You signed in with Google. Setting a password will allow you to sign in with either Google or email/password in the future.
            </AlertDescription>
          </Alert>
        )}
        
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password - only show for non-Google users */}
          {!isGoogleUser && (
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isSubmitting}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {isGoogleUser ? 'Set Password' : 'New Password'}
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={isGoogleUser ? "Enter your password" : "Enter your new password"}
                required
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isSubmitting}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Strength:</span>
                  <span className={`text-sm font-medium ${strengthColor}`}>
                    {strengthText}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements.length ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {passwordStrength.requirements.length ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 border border-current rounded-full" />
                    )}
                    <span>At least 8 characters</span>
                  </div>
                  
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements.uppercase ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {passwordStrength.requirements.uppercase ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 border border-current rounded-full" />
                    )}
                    <span>One uppercase letter</span>
                  </div>
                  
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements.lowercase ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {passwordStrength.requirements.lowercase ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 border border-current rounded-full" />
                    )}
                    <span>One lowercase letter</span>
                  </div>
                  
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements.number ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {passwordStrength.requirements.number ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 border border-current rounded-full" />
                    )}
                    <span>One number</span>
                  </div>
                  
                  <div className={`flex items-center space-x-1 ${
                    passwordStrength.requirements.special ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {passwordStrength.requirements.special ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 border border-current rounded-full" />
                    )}
                    <span>One special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {isGoogleUser ? 'Confirm Password' : 'Confirm New Password'}
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isGoogleUser ? "Confirm your password" : "Confirm your new password"}
                required
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={`text-xs flex items-center space-x-1 ${
                newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'
              }`}>
                {newPassword === confirmPassword ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                <span>
                  {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || strengthScore < 3 || newPassword !== confirmPassword}
          >
            {isSubmitting ? 
              (isGoogleUser ? 'Setting Password...' : 'Updating Password...') : 
              (isGoogleUser ? 'Set Password' : 'Update Password')
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
