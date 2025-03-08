import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GitFork, ArrowRight, Loader2, AlertCircle, Info, RefreshCw } from "lucide-react";
import ChronoTimeline from "@/components/ChronoTimeline";
import { apiService } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

const GenerateTimeline = () => {
  const [repoUrl, setRepoUrl] = useState("https://github.com/facebook/react");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingRepo, setIsVerifyingRepo] = useState(false);
  const [repositoryName, setRepositoryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataStatus, setDataStatus] = useState<"loading" | "checking" | "generating" | "ready" | "no-data" | null>(null);
  const [shouldFetchData, setShouldFetchData] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check if repository already exists in Supabase
  useEffect(() => {
    if (repositoryName && (dataStatus === "checking" || shouldFetchData)) {
      console.log("🔍 Checking Supabase for repository:", repositoryName, "Status:", dataStatus);
      
      const checkRepoInSupabase = async () => {
        setDataStatus("checking");
        setShouldFetchData(false);
        
        try {
          console.log("📊 Querying Supabase commits table for repo:", repositoryName);
          // Check if there are any commits with this repository name
          const { data: commits, error: commitsError } = await supabase
            .from('commits')
            .select('count')
            .eq('repo_name', repositoryName)
            .single();
          
          if (commitsError) {
            console.error("❌ Supabase query error:", commitsError);
            throw commitsError;
          }
          
          console.log("📋 Supabase response:", commits);
          
          if (commits && commits.count > 0) {
            console.log("✅ Found existing data, count:", commits.count);
            toast.success(`Found existing repository: ${repositoryName}`);
            setDataStatus("ready");
          } else {
            console.log("⚠️ No data found in Supabase");
            toast.info(`No data found for repository: ${repositoryName}`);
            setDataStatus("no-data");
            // Automatically try to generate data if not found
            generateTimelineData(repositoryName);
          }
        } catch (error) {
          console.error("❌ Error checking repository:", error);
          setDataStatus("no-data");
          // Try to generate even if there was an error checking
          generateTimelineData(repositoryName);
        }
      };
      
      checkRepoInSupabase();
    } else {
      console.log("🔄 useEffect conditions not met - repositoryName:", repositoryName, "dataStatus:", dataStatus, "shouldFetchData:", shouldFetchData);
    }
  }, [repositoryName, dataStatus, shouldFetchData, repoUrl]);

  // Helper function to extract repository name from GitHub URL
  const extractRepositoryName = (url: string): string | null => {
    try {
      // Handle various GitHub URL formats
      let repoName: string | null = null;
      
      // Most common format: github.com/username/repo
      const githubUrlRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
      const match = url.match(githubUrlRegex);
      
      if (match && match.length >= 3) {
        // Clean the repository name - remove .git suffix and URL parameters
        let repoSegment = match[2];
        repoSegment = repoSegment.replace(/\.git$/, '');  // Remove .git suffix
        repoSegment = repoSegment.split('?')[0];         // Remove URL parameters
        repoSegment = repoSegment.split('#')[0];         // Remove URL fragments
        
        repoName = `${match[1]}/${repoSegment}`;
        console.log("Extracted repo name:", repoName);
        return repoName;
      }
      
      // If no match was found, try to be very permissive
      if (url.includes('/')) {
        const parts = url.split('/').filter(part => part.trim() !== '');
        if (parts.length >= 2) {
          const possibleUser = parts[parts.length - 2];
          let possibleRepo = parts[parts.length - 1];
          
          // Clean the repository name
          possibleRepo = possibleRepo.replace(/\.git$/, '');  // Remove .git suffix
          possibleRepo = possibleRepo.split('?')[0];         // Remove URL parameters
          possibleRepo = possibleRepo.split('#')[0];         // Remove URL fragments
          
          if (possibleUser && possibleRepo) {
            repoName = `${possibleUser}/${possibleRepo}`;
            console.log("Fallback extracted repo name:", repoName);
            return repoName;
          }
        }
      }
      
      console.log("Could not extract repository name from URL:", url);
      return null;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return null;
    }
  };

  // Helper function to generate timeline data via the API
  const generateTimelineData = async (repoName: string) => {
    setDataStatus("generating");
    const toastId = toast.loading(`Generating timeline data for ${repoName}...`);
    
    try {
      
      // Generate timeline from API
      await apiService.generateTimeline(repoUrl);
      toast.success(`Timeline data generated for ${repoName}`, {
        id: toastId
      });
      
      // Important: Set flag to refetch data from Supabase 
      // since that's where the generated data is stored
      setShouldFetchData(true);
      
    } catch (apiError) {
      console.error("API error:", apiError);
      toast.error("Couldn't generate timeline data. Please try again later.", {
        id: toastId
      });
      setDataStatus("no-data");
    }
  };

  // Update the processInput function to set all necessary loading states
  const processInput = () => {
    console.log("Processing input directly:", repoUrl);
    if (!repoUrl) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }
    
    // Simpler GitHub URL validation that's more lenient
    if (!repoUrl.includes('github.com/')) {
      toast.error("Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)");
      return;
    }
    
    // Set appropriate loading states
    setIsVerifyingRepo(true);
    setError(null);
    setDataStatus("loading");
    
    try {
      const repoName = extractRepositoryName(repoUrl);
      if (!repoName) {
        setIsVerifyingRepo(false);
        toast.error("Failed to parse repository name from URL. Please make sure the URL format is correct.");
        setDataStatus(null);
        return;
      }
      
      console.log("Extracted repository name:", repoName);
      toast.info(`Processing repository: ${repoName}`);
      setRepositoryName(repoName);
      setIsVerifyingRepo(false);
      setIsLoading(true);
      setDataStatus("checking");
    } catch (error) {
      console.error("Error processing URL:", error);
      toast.error("Something went wrong processing the URL. Please try a different format.");
      setIsVerifyingRepo(false);
      setIsLoading(false);
      setDataStatus(null);
    }
  };

  const handleRefresh = () => {
    if (repositoryName) {
      setShouldFetchData(true);
    }
  };

  // Add back a simplified handleSubmit function 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    processInput(); // Just call our common processing function
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
                  disabled={isVerifyingRepo || dataStatus === "generating"}
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
              
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <GitFork className="mr-2 h-4 w-4" />
                  <span>Try with popular repositories like React, Vue, or TensorFlow</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRepoUrl("https://github.com/facebook/react");
                      setTimeout(processInput, 100);
                    }}
                  >
                    Try React
                  </Button>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRepoUrl("https://github.com/vuejs/vue");
                      setTimeout(processInput, 100);
                    }}
                  >
                    Try Vue
                  </Button>
                </div>
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
        
        {dataStatus === "checking" && (
          <section className="py-4 px-6">
            <div className="container mx-auto max-w-3xl">
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Checking repository data</AlertTitle>
                <AlertDescription>Looking for existing data in our database...</AlertDescription>
              </Alert>
            </div>
          </section>
        )}
        
        {dataStatus === "generating" && (
          <section className="py-8 px-6">
            <div className="container mx-auto max-w-3xl">
              <Alert variant="default" className="bg-amber-50 border-amber-200">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <AlertTitle className="text-amber-700">Generating timeline data</AlertTitle>
                <AlertDescription className="text-amber-600">
                  This may take a minute or two depending on the repository size...
                </AlertDescription>
              </Alert>
              
              <div className="mt-8 p-8 border border-dashed rounded-lg flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Analyzing repository commits</h3>
                <p className="text-muted-foreground mt-2 text-center max-w-md">
                  We're fetching and analyzing the commit history for {repositoryName}. 
                  This involves processing commit messages and code changes to generate meaningful insights.
                </p>
              </div>
            </div>
          </section>
        )}

        {(dataStatus === "loading") && (
          <section className="py-8 px-6">
            <div className="container mx-auto">
              <div className="space-y-4">
                <Skeleton className="h-12 w-64 mx-auto" />
                <Skeleton className="h-6 w-full max-w-lg mx-auto" />
              </div>
            </div>
          </section>
        )}
        
        {repositoryName && dataStatus === "ready" && (
          <section className="py-8 px-6 pb-16">
            <div className="container mx-auto">
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh Data
                </Button>
              </div>
              <ChronoTimeline 
                repositoryName={repositoryName} 
                isLoading={false} 
              />
            </div>
          </section>
        )}
        
        {dataStatus === "no-data" && repositoryName && (
          <section className="py-8 px-6">
            <div className="container mx-auto max-w-3xl">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Timeline Data Available</AlertTitle>
                <AlertDescription>
                  <p>We couldn't find or generate timeline data for this repository.</p>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => generateTimelineData(repositoryName)}
                    >
                      Try Again
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </section>
        )}
        
        {!isLoading && !repositoryName && !error && !dataStatus && (
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
