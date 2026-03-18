import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Upload, AlertCircle } from 'lucide-react';
import brain from 'brain';

export default function NonProfitApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    organizationName: '',
    taxId: '',
    email: '',
    website: '',
    description: '',
    contactName: '',
    contactPhone: '',
  });
  
  const [file, setFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.organizationName || !formData.taxId || !formData.email) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // TODO: Upload file and submit application via API
      console.log('Submitting application:', formData);
      console.log('File:', file);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription>
              We'll review your application shortly
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-foreground mb-2">
                Thank you for your application. Our team will review it within 2-3 business days.
              </p>
              <p className="text-sm text-muted-foreground">
                We'll send a confirmation email to <strong>{formData.email}</strong> with next steps.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">What happens next?</h3>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>We verify your non-profit status</li>
                <li>You'll receive an approval email with a discount code</li>
                <li>Apply the code at checkout for 25% off</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={() => navigate('/')} className="w-full">
                Return to Home
              </Button>
              <Button onClick={() => navigate('/pricing')} variant="outline" className="w-full">
                View Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Non-Profit Discount Application
          </h1>
          <p className="text-lg text-muted-foreground">
            Get <strong>25% off</strong> all paid plans for verified non-profit organizations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
              Please provide details about your non-profit organization. All fields marked with * are required.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="Your Non-Profit Organization"
                  required
                />
              </div>

              {/* Tax ID */}
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / 501(c)(3) Number *</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder="XX-XXXXXXX"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your EIN or equivalent tax identification number
                </p>
              </div>

              {/* Official Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Official Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contact@yourorganization.org"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Please use your organization's official email domain
                </p>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://www.yourorganization.org"
                />
              </div>

              {/* Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Person Name</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone Number</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Brief Description of Your Mission</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about your organization and how you plan to use Dicta-Notes..."
                  rows={4}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Verification Document (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-orange-600 dark:hover:border-orange-500 transition-colors">
                  <input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-foreground mb-1">
                      {file ? file.name : 'Upload 501(c)(3) determination letter'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, or PNG (Max 5MB)
                    </p>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting this form, you confirm that all information provided is accurate and that you represent a verified non-profit organization.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
