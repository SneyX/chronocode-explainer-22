
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { stripeService } from "@/services/stripeService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

// Stripe price IDs for each plan
const STRIPE_PRICE_IDS = {
  free: '', // Free plan has no price ID
  pro: 'price_1OqrBrCZ6qsJgndgSOBrxwak', // Replace with your actual Stripe price ID
  enterprise: '' // Enterprise is custom, handled separately
};

const PricingCard = ({ 
  title, 
  price, 
  description, 
  features, 
  ctaText, 
  popular = false,
  priceId,
  onSubscribe
}: { 
  title: string; 
  price: string; 
  description: string; 
  features: string[]; 
  ctaText: string; 
  popular?: boolean;
  priceId?: string;
  onSubscribe: (priceId?: string) => void;
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onSubscribe(priceId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`w-full max-w-md ${popular ? 'border-primary shadow-lg' : ''} h-full flex flex-col`}>
      <CardHeader>
        {popular && (
          <div className="py-1 px-3 bg-primary text-primary-foreground text-xs font-medium rounded-full w-fit mb-3">
            Most Popular
          </div>
        )}
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-3xl font-bold">{price}</span>
        </div>
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start">
              <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={popular ? "default" : "outline"}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            ctaText
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleSubscribe = async (priceId?: string) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!priceId) {
      // Handle free plan or enterprise plan (contact sales)
      if (priceId === STRIPE_PRICE_IDS.free) {
        toast.success("You're signed up for the Free plan!");
        return;
      } else {
        // Enterprise plan
        toast.success("Our sales team will contact you soon!");
        return;
      }
    }

    try {
      // Create a Stripe checkout session
      const { url } = await stripeService.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to create checkout session. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24">
        <section className="pt-16 pb-8 px-6">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-medium mb-4">Pricing</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
              Choose the perfect plan for understanding your code's evolution.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <PricingCard
                title="Free"
                price="$0"
                description="For individuals and small projects"
                features={[
                  "3 repositories",
                  "30 commits per repository",
                  "Basic analytics",
                  "Community support"
                ]}
                ctaText="Get Started"
                priceId={STRIPE_PRICE_IDS.free}
                onSubscribe={handleSubscribe}
              />
              
              <PricingCard
                title="Pro"
                price="$29"
                description="Perfect for growing teams"
                features={[
                  "30 repositories",
                  "100 commits per repository",
                  "Advanced analytics",
                  "Priority support",
                  "Export capabilities"
                ]}
                popular={true}
                priceId={STRIPE_PRICE_IDS.pro}
                onSubscribe={handleSubscribe}
                ctaText="Choose Plan"
              />
              
              <PricingCard
                title="Enterprise"
                price="Custom"
                description="For large organizations"
                features={[
                  "Unlimited repositories",
                  "Unlimited commits",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantees"
                ]}
                priceId={STRIPE_PRICE_IDS.enterprise}
                onSubscribe={handleSubscribe}
                ctaText="Contact Sales"
              />
            </div>
          </div>
        </section>
        
        <section className="py-16 px-6 bg-secondary/10">
          <div className="container mx-auto text-center">
            <h2 className="text-2xl font-medium mb-8">Frequently Asked Questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              <div>
                <h3 className="text-lg font-medium mb-2">What happens when I reach my repository limit?</h3>
                <p className="text-muted-foreground">You'll need to upgrade your plan to add more repositories or remove existing ones to stay within your plan limits.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Can I upgrade or downgrade at any time?</h3>
                <p className="text-muted-foreground">Yes, you can change your plan at any time. When upgrading, you'll get immediate access to the new features.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">What counts as a commit analysis?</h3>
                <p className="text-muted-foreground">Each individual commit that we process counts toward your plan limit. Large repositories with many commits may reach limits faster.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Do you offer discounts for open source projects?</h3>
                <p className="text-muted-foreground">Yes! We offer special pricing for verified open source projects. Contact us for more information.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You need to be signed in to subscribe to a plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowLoginDialog(false);
              navigate('/auth');
            }}>
              Sign in
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Pricing;
