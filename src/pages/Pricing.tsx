
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const PricingCard = ({ 
  title, 
  price, 
  description, 
  features, 
  ctaText, 
  popular = false 
}: { 
  title: string; 
  price: string; 
  description: string; 
  features: string[]; 
  ctaText: string; 
  popular?: boolean; 
}) => {
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
        <Button className="w-full" variant={popular ? "default" : "outline"}>
          {ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Pricing = () => {
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
      
      <Footer />
    </div>
  );
};

export default Pricing;
