import React, { useState, useEffect } from 'react';
import { useCurrentUser } from 'app';
import brain from 'brain';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Send, RefreshCw, Clock, User, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: number;  // Backend returns float (seconds since epoch)
  replied: boolean;
  replied_at: number | null;  // Backend returns float or null
}

export const SupportRepliesAdmin: React.FC = () => {
  const { user } = useCurrentUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      const adminEmails = [
        'abereimer64@gmail.com',
        'dward@wevad.com',
        'dianareimer90@gmail.com'
      ];
      setIsAdmin(adminEmails.includes(user.email || '') || false);
    }
  }, [user]);

  // Fetch contact form submissions
  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await brain.get_contact_submissions();
      const data = await response.json();
      console.log('[SupportRepliesAdmin] Fetched data:', data);
      console.log('[SupportRepliesAdmin] Submissions array:', data.submissions);
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[SupportRepliesAdmin] Component mounted, isAdmin:', isAdmin);
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin]);

  const handleSendReply = async (submission: ContactSubmission) => {
    const replyText = replyTexts[submission.id];
    if (!replyText || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setIsSending(submission.id);
    try {
      // Step 1: Mark as replied in Firestore
      const markResponse = await brain.mark_submission_replied({ submissionId: submission.id });
      if (!markResponse.ok) {
        throw new Error('Failed to mark as replied');
      }

      // Step 2: Send the email reply
      const response = await brain.send_support_reply({
        to: submission.email,
        subject: `Re: ${submission.subject}`,
        message: replyText,
        reply_to: 'support@stackapps.com'
      });

      if (response.ok) {
        toast.success('Reply sent successfully! It was auto-translated to the user\'s preferred language.');
        setReplyTexts(prev => ({ ...prev, [submission.id]: '' }));
        setExpandedSubmission(null);
        fetchSubmissions(); // Refresh the list
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setIsSending(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedSubmission(expandedSubmission === id ? null : id);
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertDescription>
          You do not have permission to access this feature.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Support Inbox
            </CardTitle>
            <CardDescription>
              View and reply to contact form submissions with auto-translation
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSubmissions}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No contact form submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">
                        {submission.subject}
                      </h4>
                      {submission.replied && (
                        <Badge variant="secondary" className="text-xs">
                          Replied
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {submission.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {submission.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(submission.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpanded(submission.id)}
                  >
                    {expandedSubmission === submission.id ? 'Collapse' : 'View & Reply'}
                  </Button>
                </div>

                {expandedSubmission === submission.id && (
                  <div className="space-y-4 pt-3 border-t">
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Original Message
                      </Label>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {submission.message}
                      </div>
                    </div>

                    {submission.replied && submission.replied_at && (
                      <Alert>
                        <AlertDescription className="text-sm">
                          Already replied on {new Date(submission.replied_at * 1000).toLocaleString()}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor={`reply-${submission.id}`} className="mb-2">
                        Your Reply (in English - will be auto-translated)
                      </Label>
                      <Textarea
                        id={`reply-${submission.id}`}
                        placeholder="Type your reply in English. It will be automatically translated to the user's preferred language."
                        value={replyTexts[submission.id] || ''}
                        onChange={(e) =>
                          setReplyTexts(prev => ({
                            ...prev,
                            [submission.id]: e.target.value
                          }))
                        }
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSendReply(submission)}
                        disabled={isSending === submission.id || !replyTexts[submission.id]?.trim()}
                      >
                        {isSending === submission.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
