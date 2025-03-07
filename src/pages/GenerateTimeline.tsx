import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GitFork, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import ChronoTimeline, { Timeline } from "@/components/ChronoTimeline";
import { apiService } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const GenerateTimeline = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    
    try {
      // Check API health first
      try {
        await apiService.healthCheck();
      } catch (healthError) {
        throw new Error("API server is not available. Please make sure the FastAPI server is running.");
      }
      
      // Generate timeline from API
      const timelineData = await apiService.generateTimeline(repoUrl);
      
      setTimeline(timelineData);
      toast.success(`Timeline generated for ${timelineData.repositoryName}`);
    } catch (error) {
      console.error("Error generating timeline:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate timeline. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);
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
        
        {error && (
          <section className="py-4 px-6">
            <div className="container mx-auto max-w-3xl">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          </section>
        )}
        
        {isLoading && (
          <section className="py-8 px-6 pb-16">
            <div className="container mx-auto">
              <ChronoTimeline 
                timeline={{
                  repositoryName: "Loading...",
                  commits: []
                }} 
                isLoading={true} 
              />
            </div>
          </section>
        )}
        
        {!isLoading && timeline && (
          <section className="py-8 px-6 pb-16">
            <div className="container mx-auto">
              <ChronoTimeline timeline={timeline} />
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default GenerateTimeline;
