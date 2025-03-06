
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GitBranch } from "lucide-react";

const Pricing = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24">
        <section className="pt-16 pb-8 px-6">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-medium mb-4">Pricing</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for understanding your code's evolution.
            </p>
          </div>
        </section>
        
        <section className="py-8 px-6">
          <div className="container mx-auto">
            <div className="text-center">
              <GitBranch className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Pricing page coming soon.</p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;
