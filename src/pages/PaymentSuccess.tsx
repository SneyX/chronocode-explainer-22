
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // You could add code here to verify the payment with your backend
    // or update user metadata in Supabase, etc.
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-medium mb-4">Payment Successful!</h1>
          
          <p className="text-muted-foreground mb-8">
            Thank you for your subscription. Your account has been upgraded and you now have access to all the features included in your plan.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate("/timeline")}>
              Generate Timeline
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
