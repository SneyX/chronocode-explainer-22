
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { GitBranch } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-8 transition-all duration-300 ${
        scrolled 
          ? "bg-background/80 backdrop-blur-lg shadow-sm" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
          >
            <GitBranch className="w-6 h-6 text-primary transition-transform duration-500 group-hover:rotate-90" />
            <span className="text-xl font-medium">Chronocode</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { text: "Home", path: "/" },
              { text: "Timeline", path: "/timeline" },
              { text: "Features", path: "/features" },
              { text: "Pricing", path: "/pricing" },
              { text: "About", path: "/about" }
            ].map(link => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  location.pathname === link.path
                    ? "text-primary font-medium"
                    : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {link.text}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-3">
            <Link to="#waitlist">
              <Button variant="outline" className="hidden md:inline-flex">
                Join Waitlist
              </Button>
            </Link>
            <Link to="/timeline">
              <Button className="relative overflow-hidden group">
                <span className="relative z-10">Generate Timeline</span>
                <span className="absolute inset-0 bg-primary/80 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300"></span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
