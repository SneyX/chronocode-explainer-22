
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center pt-24 px-6">
        <div className="text-center max-w-md mx-auto">
          <GitBranch className="w-16 h-16 text-primary mx-auto mb-6 animate-float" />
          <h1 className="text-4xl font-medium mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            This branch doesn't exist in our codebase.
          </p>
          <Button asChild className="relative overflow-hidden group">
            <a href="/">
              <span className="relative z-10">Return to main branch</span>
              <span className="absolute inset-0 bg-primary/80 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300"></span>
            </a>
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
