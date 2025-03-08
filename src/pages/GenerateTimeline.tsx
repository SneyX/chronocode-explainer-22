import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GitFork, ArrowRight, Loader2, AlertCircle, Info } from "lucide-react";
import ChronoTimeline from "@/components/ChronoTimeline";
import { apiService } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

const GenerateTimeline = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingRepo, setIsVerifyingRepo] = useState(false);
  const [repositoryName, setRepositoryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if repository already exists in Supabase
  useEffect(() => {
    if (repositoryName) {
      const checkRepoInSupabase = async () => {
        try {
          // Check if there are any commits with this repository name
          const { data: commits, error: commitsError } = await supabase
            .from('commits')
            .select('count')
            .eq('repo_name', repositoryName)
            .single();
          
          if (commitsError) throw commitsError;
          
          if (commits && commits.count > 0) {
            toast.success(`Found existing repository: ${repositoryName}`);
          } else {
            toast.info(`No data found for repository: ${repositoryName}`);
          }
        } catch (error) {
          console.error("Error checking repository:", error);
        }
      };
      
      checkRepoInSupabase();
    }
  }, [repositoryName]);

  // Helper function to extract repository name from GitHub URL
  const extractRepositoryName = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname !== 'github.com' && urlObj.hostname !== 'www.github.com') {
        return null;
      }
      
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        return null;
      }
      
      // Get user and repo name
      const [user, repo] = pathParts;
      return `${user}/${repo}`;
    } catch (error) {
      return null;
    }
  };

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
    
    setIsVerifyingRepo(true);
    setError(null);
    
    try {
      // Extract repository name from URL
      const repoName = extractRepositoryName(repoUrl);
      if (!repoName) {
        throw new Error("Failed to parse repository name from URL");
      }
      
      setRepositoryName(repoName);
      setIsVerifyingRepo(false);
      
      
      // If we've already set the repository name, we'll start loading the timeline
      // This triggers the useEffect which will check if repository exists in Supabase
      setIsLoading(true);
      
      // Try to generate new data if needed
      if (true) {
        try {
          // Generate timeline from API
          toast.info(`Requesting timeline generation for ${repoName}`);
          await apiService.generateTimeline(repoUrl);
          toast.success(`Timeline data updated for ${repoName}`);
        } catch (apiError) {
          console.error("API error:", apiError);
          toast.warning("Couldn't generate new data. Using existing data from Supabase if available.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process repository. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);
      setIsVerifyingRepo(false);
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
                  disabled={isVerifyingRepo || isLoading}
                >
                  {isVerifyingRepo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
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
        
        {isLoading && !repositoryName && (
          <section className="py-8 px-6">
            <div className="container mx-auto">
              <div className="space-y-4">
                <Skeleton className="h-12 w-64 mx-auto" />
                <Skeleton className="h-6 w-full max-w-lg mx-auto" />
              </div>
            </div>
          </section>
        )}
        
        {repositoryName && (
          <section className="py-8 px-6 pb-16">
            <div className="container mx-auto">
              <ChronoTimeline 
                repositoryName={repositoryName} 
                isLoading={isLoading} 
              />
            </div>
          </section>
        )}
        
        {!isLoading && !repositoryName && !error && (
          <section className="py-16 px-6">
            <div className="container mx-auto max-w-xl">
              <div className="text-center space-y-4">
                <Info className="h-16 w-16 mx-auto text-muted-foreground" />
                <h2 className="text-2xl font-medium">Enter a Repository URL</h2>
                <p className="text-muted-foreground">
                  Enter a GitHub repository URL above to see its development timeline and commit analyses.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default GenerateTimeline;
