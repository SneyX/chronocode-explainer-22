
import { Link } from "react-router-dom";
import { GitBranch, Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-12 px-6 md:px-8 mt-20">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <span className="text-lg font-medium">Chronocode</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs text-left">
              Transform code changes to natural language and understand the complete development cycle of any GitHub repository.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-4 text-left">Product</h3>
            <ul className="space-y-3 text-sm text-left">
              <li><Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Integrations</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-4 text-left">Company</h3>
            <ul className="space-y-3 text-sm text-left">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-4 text-left">Legal</h3>
            <ul className="space-y-3 text-sm text-left">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookies</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Licenses</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Chronocode. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-2 md:mt-0">
            Designed with precision. Built with care.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
