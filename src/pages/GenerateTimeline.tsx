
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GitFork, ArrowRight, Loader2 } from "lucide-react";
import TimelineDisplay from "@/components/TimelineDisplay";

const GenerateTimeline = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeline, setTimeline] = useState<null | {
    repositoryName: string;
    commits: Array<{
      id: string;
      title: string;
      description: string;
      date: string;
      author: string;
      authorImage: string;
      analysis: string;
      startDate?: string;
      endDate?: string;
    }>;
  }>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }
    
    // Simple GitHub URL validation
    const githubUrlRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+(\/?|\/tree\/[\w-]+\/?)$/;
    if (!githubUrlRegex.test(repoUrl)) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }
    
    setIsLoading(true);
    
    // In a real app, we would fetch the actual data from an API
    // This is a simulation for demo purposes
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get repo name from URL for the demo
      const urlParts = repoUrl.split('/');
      const repoName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      
      // Avatar placeholders
      const avatars = [
        "https://github.com/shadcn.png",
        "https://avatars.githubusercontent.com/u/124599?v=4",
        "https://avatars.githubusercontent.com/u/6764957?v=4",
        "https://avatars.githubusercontent.com/u/76580?v=4"
      ];
      
      // Simulate timeline data
      const mockTimeline = {
        repositoryName: repoName,
        commits: [
          {
            id: "a1b2c3d",
            title: "Initial Setup",
            description: "Created project structure with core configuration files and dependencies.",
            date: "2023-11-05",
            author: "Sarah Chen",
            authorImage: avatars[0],
            startDate: "2023-11-01",
            endDate: "2023-11-05",
            analysis: "Developer focused on establishing a solid foundation with modern best practices, suggesting attention to scalability from the project's inception."
          },
          {
            id: "e4f5g6h",
            title: "Authentication System",
            description: "Implemented JWT-based authentication with secure password handling and user sessions.",
            date: "2023-11-12",
            author: "Michael Rodriguez",
            authorImage: avatars[1],
            startDate: "2023-11-06",
            endDate: "2023-11-12",
            analysis: "Security was a primary concern, with careful implementation of token refresh logic and protection against common auth vulnerabilities."
          },
          {
            id: "i7j8k9l",
            title: "Database Models",
            description: "Defined database schema and models for core application entities.",
            date: "2023-11-18",
            author: "Aisha Johnson",
            authorImage: avatars[2],
            startDate: "2023-11-13",
            endDate: "2023-11-18",
            analysis: "The database design indicates thoughtful consideration of data relationships and query performance, with proper indexing strategies."
          },
          {
            id: "m1n2o3p",
            title: "API Endpoints",
            description: "Created RESTful API endpoints for resource access and manipulation.",
            date: "2023-11-25",
            author: "Sarah Chen",
            authorImage: avatars[0],
            startDate: "2023-11-19",
            endDate: "2023-11-25",
            analysis: "Developer prioritized consistent API design with clear input validation and error handling patterns across all endpoints."
          },
          {
            id: "q4r5s6t",
            title: "UI Components",
            description: "Built reusable UI component library with consistent styling and interactions.",
            date: "2023-12-02",
            author: "Michael Rodriguez",
            authorImage: avatars[1],
            startDate: "2023-11-26",
            endDate: "2023-12-02",
            analysis: "The component architecture shows attention to reusability and composition, with thoughtful props interfaces and internal state management."
          },
          {
            id: "u7v8w9x",
            title: "Performance Optimization",
            description: "Optimized data fetching and rendering for improved application performance.",
            date: "2023-12-08",
            author: "Aisha Johnson",
            authorImage: avatars[2],
            startDate: "2023-12-03",
            endDate: "2023-12-08",
            analysis: "Performance bottlenecks were systematically identified and addressed, with careful attention to both server response times and client-side rendering."
          },
          {
            id: "y1z2a3b",
            title: "Testing Framework",
            description: "Implemented comprehensive testing suite with unit and integration tests.",
            date: "2023-12-15",
            author: "Sarah Chen",
            authorImage: avatars[0],
            startDate: "2023-12-09",
            endDate: "2023-12-15",
            analysis: "Test coverage focuses on critical paths and edge cases, suggesting a mature approach to quality assurance and regression prevention."
          }
        ]
      };
      
      setTimeline(mockTimeline);
      toast.success(`Timeline generated for ${repoName}`);
    } catch (error) {
      toast.error("Failed to generate timeline. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24">
        <section className="pt-16 pb-8 px-6">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-medium mb-4">Generate Timeline</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enter a GitHub repository URL to generate a detailed timeline of its development history.
            </p>
          </div>
        </section>
        
        <section className="py-8 px-6">
          <div className="container mx-auto max-w-3xl">
            <form onSubmit={handleSubmit} className="glass p-8 rounded-xl">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-grow space-y-2">
                  <label htmlFor="repo-url" className="text-sm font-medium">
                    GitHub Repository URL
                  </label>
                  <Input
                    id="repo-url"
                    type="text"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-6" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <GitFork className="mr-2 h-4 w-4" />
                <span>Try with popular repositories like React, Vue, or TensorFlow</span>
              </div>
            </form>
          </div>
        </section>
        
        {timeline && (
          <section className="py-8 px-6 pb-16">
            <div className="container mx-auto">
              <TimelineDisplay timeline={timeline} />
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default GenerateTimeline;
