import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Sparkles, ArrowLeft } from 'lucide-react';
import brain from 'brain';
import { Header } from 'components/Header';
import { BackButton } from 'components/BackButton';
import { SEOMetaTags } from 'components/SEOMetaTags';
import { toast } from 'sonner';
import { useCurrentUser } from 'app';
import { storeAuthReturnUrl } from 'utils/navigation';

interface TierInfo {
  name: string;
  price: number;
  monthlyMinutes: number;
  features: string[];
  notIncluded?: string[];
  cta: string;
  popular?: boolean;
  tier: 'free' | 'individual' | 'professional' | 'business';
}

const TIERS: TierInfo[] = [
  {
    name: 'Public Beta Access',
    price: 0,
    monthlyMinutes: 9999, // "Unlimited" for display purposes
    tier: 'free', // Keeps it compatible with your auth system
    features: [
      'Unlimited Offline Recording',
      'Real-time Translation (130+ Languages)',
      'Advanced Speaker Identification',
      'Cloud Sync & Backup',
      'PDF, Markdown & Text Export',
      'Priority Email Support',
      'Early Access to New Features'
    ],
    cta: 'Start Using Dicta-Notes',
    popular: true,
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [isGrandfathered, setIsGrandfathered] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useCurrentUser();
  
  // Checkout state (renamed from Guest for clarity, handles both)
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Try to get current user's tier
  useEffect(() => {
    const fetchTierInfo = async () => {
      try {
        const response = await brain.get_my_tier_info();
        if (response.ok) {
          const data = await response.json();
          setCurrentTier(data.tier);
          setIsGrandfathered(data.is_grandfathered || false);
        }
      } catch (error) {
        console.error('Failed to fetch tier info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTierInfo();
  }, []);

  const handleUpgrade = async (tier: string) => {
    if (tier === 'free') {
      navigate('/login');
      return;
    }
    
    if (tier === 'business') {
      navigate('/contact');
      return;
    }

    if (authLoading) {
      return;
    }

    // Always show dialog to confirm redirect, regardless of auth state
    setSelectedTier(tier);
    setShowCheckoutDialog(true);
  };

  const processCheckout = async () => {
    if (!selectedTier) return;
    
    // Use user email if logged in, otherwise guest email
    const checkoutEmail = user?.email || guestEmail;
    
    if (!checkoutEmail && !user) {
        // Should not happen due to form validation but safety check
        return;
    }

    // Create PayPal checkout via API
    try {
      setIsProcessing(true);
      // Ensure tier is lowercase for backend
      const response = await brain.create_checkout({ tier: selectedTier.toLowerCase(), email: checkoutEmail || undefined });
      if (response.ok) {
        const data = await response.json();
        if (data.approval_url) {
          // Show success message before redirecting to help user context
          toast.success('Redirecting to PayPal...');
          window.location.href = data.approval_url;
        } else {
          toast.error('Failed to create checkout session');
          setIsProcessing(false);
        }
      } else {
        console.error('Checkout failed:', await response.text());
        toast.error('Failed to initiate checkout. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckout();
  };

  // Helper to determine button text/state
  const getButtonState = (tier: TierInfo) => {
    if (authLoading) {
      return { text: 'Please wait...', disabled: true, variant: 'outline' };
    }

    if (!loading && currentTier === tier.tier) {
      return { text: 'Current Plan', disabled: true, variant: 'outline' };
    }

    return { text: tier.cta, disabled: false, variant: tier.popular ? 'default' : 'outline' };
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      <SEOMetaTags
        title="Pricing Plans - Free During Beta"
        description="Dicta-Notes is free during public beta. All features included. Sign up now and lock in 50% off your first year when we launch paid plans."
        keywords="pricing, subscription plans, meeting transcription pricing, AI transcription cost, free beta, early adopter discount"
        type="website"
      />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 px-4 py-1 text-sm">
            🚀 Currently in Public Beta
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Pro Features. <span className="text-orange-600">Free during Beta.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            We are building the world's best offline-first, multilingual meeting transcription tool.
            Join our public beta to get <b>unlimited access</b> to all premium features while we refine the product.
          </p>
          <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg px-5 py-3 text-orange-700 dark:text-orange-300 text-sm font-medium">
            🎁 Early adopter offer: Sign up now and lock in <strong>50% off your first year</strong> when paid plans launch.
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="pb-20 px-4">
        {/* Changed grid-cols-4 to a centered flex layout for the single card */}
        <div className="max-w-md mx-auto"> 
          {TIERS.map((tier) => {
            const { text, disabled, variant } = getButtonState(tier);
            
            return (
              <Card
                key={tier.tier}
                className={`relative flex flex-col ${
                  tier.popular ? 'border-orange-600 dark:border-orange-500 shadow-lg' : ''
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 dark:bg-orange-500 text-white">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-4 space-y-1">
                      {/* Price presentation with GF strikethrough; tighter layout to fit */}
                      {isGrandfathered && tier.price > 0 ? (
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-xl sm:text-2xl font-semibold text-muted-foreground line-through">
                            ${tier.price}
                            <span className="ml-1 text-sm text-muted-foreground">/mo</span>
                          </span>
                          <span className="text-3xl sm:text-4xl font-bold text-foreground">
                            ${((tier.price * 0.9)).toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-foreground">
                            ${tier.price}
                          </span>
                          {tier.price > 0 && (
                            <span className="text-muted-foreground">/mo</span>
                          )}
                        </div>
                      )}
                      {isGrandfathered && tier.price > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-500 leading-snug">
                          10% lifetime discount
                        </div>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                    {tier.notIncluded?.map((feature, idx) => (
                      <li key={`not-${idx}`} className="flex items-start opacity-50">
                        <X className="w-5 h-5 text-muted-foreground mr-2 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={variant as any}
                    onClick={() => handleUpgrade(tier.tier)}
                    disabled={disabled}
                  >
                    {text}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Upcoming Plans Preview */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Coming After Beta</h2>
            <p className="text-muted-foreground">Sign up now to lock in 50% off your first year on any of these plans.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 opacity-75">
            <Card className="border-dashed">
              <CardHeader>
                <Badge className="w-fit mb-2 bg-muted text-muted-foreground">Coming Soon</Badge>
                <CardTitle>Solo</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">$5.99</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />300 minutes/month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />All transcription modes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />130+ language translation</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Speaker ID (10+ speakers)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />PDF, Word, Markdown export</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Offline recording + cloud sync</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-dashed border-orange-300 dark:border-orange-700">
              <CardHeader>
                <Badge className="w-fit mb-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">Most Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">$12.99</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Unlimited minutes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Priority Gemini processing</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Advanced speaker labeling</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Zoom integration</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />5 company workspaces</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />All export formats + timestamps</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <Badge className="w-fit mb-2 bg-muted text-muted-foreground">Coming Soon</Badge>
                <CardTitle>Team</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">$39.99</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />10 team seats included</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Shared company workspaces</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Unlimited minutes pooled</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Admin controls</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Team session management</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" />Priority support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Add-On Packages */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Add-On Packages
            </h2>
            <p className="text-lg text-muted-foreground">
              Need more minutes or team members? Purchase add-ons anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Minute Packages */}
            <div>
              <h3 className="text-xl font-semibold mb-6 text-foreground">
                Additional Minutes
              </h3>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">60 Minutes</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">$3</span>
                      <span className="text-sm text-muted-foreground">one-time</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      5¢ per minute • Never expires • Use anytime
                    </p>
                    <Button className="w-full" variant="outline" disabled>
                      
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">300 Minutes</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">$12</span>
                      <span className="text-sm text-muted-foreground">one-time</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      4¢ per minute • Save $3 • Best for regular use
                    </p>
                    <Button className="w-full" variant="outline" disabled>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-orange-600 dark:border-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">1,200 Minutes</CardTitle>
                      <Badge className="bg-orange-600 dark:bg-orange-500 text-white">
                        Best Value
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">$40</span>
                      <span className="text-sm text-muted-foreground">one-time</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      3.3¢ per minute • Save $20 • 20 hours of transcription
                    </p>
                    <Button className="w-full" variant="outline" disabled>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Seat Packages */}
            <div>
              <h3 className="text-xl font-semibold mb-6 text-foreground">
                Additional Team Members
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  For Professional & Business plans
                </span>
              </h3>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">+1 Team Member</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">$5</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add one more team member to your workspace
                    </p>
                    <Button className="w-full" variant="outline" disabled>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-orange-600 dark:border-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">+3 Team Members</CardTitle>
                      <Badge className="bg-orange-600 dark:bg-orange-500 text-white">
                        Save $3
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">$12</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Expand your team by 3 members at a discounted rate
                    </p>
                    <Button className="w-full" variant="outline" disabled>
                    </Button>
                  </CardContent>
                </Card>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Note:</strong> Team member add-ons are billed monthly and can be cancelled anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Non-Profit Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Special Pricing for Non-Profits
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            We believe in supporting organizations that make a difference.
            Get <strong>40% off</strong> all paid plans.
          </p>
          <Link to="/non-profit-application">
            <Button size="lg" variant="outline">
              Apply for Non-Profit Discount
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                What happens when I reach my monthly limit?
              </h3>
              <p className="text-muted-foreground">
                You'll receive a notification when you're approaching your limit. You can upgrade to a higher tier anytime, and your usage resets on your billing anniversary each month.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                Can I change plans anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit cards and debit cards through our secure payment processor, PayPal.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                Is there a free trial?
              </h3>
              <p className="text-muted-foreground">
                The Free tier gives you 30 minutes per month with no credit card required. You can experience our core features before upgrading.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                What if I'm a beta user?
              </h3>
              <p className="text-muted-foreground">
                Beta users lock in <strong>50% off their first year</strong> on any paid plan when we launch — no credit card required now. Your early support means a lot and we want to reward it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-orange-600 dark:bg-orange-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Start with our free plan and upgrade anytime as your needs grow.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" variant="secondary">
                Start Free
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Secure Checkout via PayPal</DialogTitle>
            <DialogDescription>
              {user 
                ? `You are upgrading to the ${selectedTier} plan. Click below to proceed to PayPal's secure payment page.`
                : "Please enter your email to create your account. You will then be redirected to PayPal to complete your purchase securely."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            {!user && (
              <div className="space-y-2">
                <Label htmlFor="email">Account Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This email will be used to log in to your account later.
                </p>
              </div>
            )}
            
            {user && (
                 <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground mb-2">
                    <strong>Account:</strong> {user.email}
                 </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={isProcessing} className="w-full bg-[#0070BA] hover:bg-[#003087] text-white">
                {isProcessing ? 'Redirecting to PayPal...' : 'Proceed to PayPal Checkout'}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                You are leaving Dicta-Notes to pay on PayPal's secure site.
              </p>
            </div>
            <div className="flex justify-center">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCheckoutDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
