import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, GitBranch } from "lucide-react";

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
                  "5 repositories per month",
                  "5 million tokens per month",
                  "Basic analytics"
                ]}
                ctaText="Get Started"
              />
              
              <PricingCard
                title="Pay Per Use"
                price="Starting at $10"
                description="Perfect for growing teams"
                features={[
                  "Up to 20 repositories per month",
                  "Up to 20 million tokens per month",
                  "Advanced analytics",
                  "Priority support"
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
                  "Unlimited tokens",
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
                <h3 className="text-lg font-medium mb-2">What is a token?</h3>
                <p className="text-muted-foreground">Tokens are the units of measurement for processing code. A typical line of code is around 10-20 tokens.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">How does the Pay Per Use plan work?</h3>
                <p className="text-muted-foreground">You only pay for what you use, up to the specified limits. Once you reach the limits, you can upgrade or pay for additional usage.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Can I change plans anytime?</h3>
                <p className="text-muted-foreground">Yes, you can upgrade, downgrade, or cancel your subscription at any time.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Is there a limit to the repository size?</h3>
                <p className="text-muted-foreground">There's no hard limit on repository size, but larger repositories will consume more tokens.</p>
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
