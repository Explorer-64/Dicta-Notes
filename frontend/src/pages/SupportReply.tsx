import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import brain from "brain";
import { toast } from "sonner";
import { Loader2, Send, Globe, CheckCircle2 } from "lucide-react";

export default function SupportReply() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSent, setLastSent] = useState<{to: string, translatedTo?: string} | null>(null);

  const handleSend = async () => {
    if (!to || !subject || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await brain.send_support_reply({
        to,
        subject,
        message,
      });

      if (!response.ok) {
        throw new Error("Failed to send support reply");
      }

      const result = await response.json();
      
      setLastSent({
        to,
        translatedTo: result.translated_to
      });

      if (result.translated_to) {
        toast.success(
          `Email sent and auto-translated to ${result.translated_to.toUpperCase()}! 🌐`,
          { duration: 5000 }
        );
      } else {
        toast.success("Email sent successfully! ✅");
      }

      // Clear form
      setTo("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error sending support reply:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Support Reply System
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Write in English - Auto-translates to user's preferred language 🌐
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Globe className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Write your reply in English below</li>
              <li>System automatically looks up recipient's language preference</li>
              <li>Email is translated to their language using Gemini 2.5 Flash</li>
              <li>HTML formatting is preserved in translation</li>
              <li>Falls back to English if no preference found</li>
            </ul>
          </CardContent>
        </Card>

        {/* Last Sent Status */}
        {lastSent && (
          <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Last email sent to {lastSent.to}
                  {lastSent.translatedTo && (
                    <span className="ml-2 text-sm">
                      (translated to {lastSent.translatedTo.toUpperCase()})
                    </span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Support Reply</CardTitle>
            <CardDescription>
              All fields are required. Write your message in English.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* To Email */}
            <div className="space-y-2">
              <Label htmlFor="to" className="text-base font-medium">
                To (Email Address)
              </Label>
              <Input
                id="to"
                type="email"
                placeholder="user@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="text-base"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-base font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                type="text"
                placeholder="Re: Your support request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-base"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-base font-medium">
                Message (Write in English)
              </Label>
              <Textarea
                id="message"
                placeholder="Thank you for contacting Dicta-Notes support.\n\nI'd be happy to help you with...\n\nBest regards,\nAbe"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={12}
                className="text-base font-mono"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use line breaks for paragraphs. They will be preserved in the email.
              </p>
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSend}
                disabled={isLoading || !to || !subject || !message}
                size="lg"
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Templates</CardTitle>
            <CardDescription>
              Click to insert common responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage(
                "Thank you for contacting Dicta-Notes support.\n\nI'd be happy to help you with your question. \n\nCould you please provide more details about the issue you're experiencing?\n\nBest regards,\nAbe\nDicta-Notes Support Team"
              )}
            >
              General Response
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => setMessage(
                "Thank you for your patience.\n\nI've looked into your issue and here's what I found:\n\n[Your explanation here]\n\nPlease let me know if this resolves your issue or if you need further assistance.\n\nBest regards,\nAbe\nDicta-Notes Support Team"
              )}
            >
              Issue Resolution
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => setMessage(
                "Thank you for reaching out to Dicta-Notes!\n\nYour question has been received and I'm here to help.\n\nI'll get back to you within 24 hours with a detailed response.\n\nBest regards,\nAbe\nDicta-Notes Support Team"
              )}
            >
              Acknowledgment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
