
import { useState } from "react";
import { GitCommit, Clock, User, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Commit {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  analysis: string;
}

interface TimelineProps {
  timeline: {
    repositoryName: string;
    commits: Commit[];
  };
}

const TimelineDisplay = ({ timeline }: TimelineProps) => {
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string | null>(null);
  
  // Get unique authors for filtering
  const authors = Array.from(new Set(timeline.commits.map(commit => commit.author)));
  
  // Filter commits based on author
  const filteredCommits = filterAuthor 
    ? timeline.commits.filter(commit => commit.author === filterAuthor) 
    : timeline.commits;
  
  const toggleCommit = (id: string) => {
    setExpandedCommit(expandedCommit === id ? null : id);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-medium mb-2">{timeline.repositoryName}</h2>
          <p className="text-muted-foreground">
            {filteredCommits.length} commits in timeline
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filterAuthor === null ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilterAuthor(null)}
          >
            All
          </Button>
          {authors.map(author => (
            <Button
              key={author}
              variant={filterAuthor === author ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAuthor(author)}
            >
              {author}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative space-y-6 pl-6 before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-border">
        {filteredCommits.map((commit, index) => (
          <div 
            key={commit.id}
            className={cn(
              "relative pl-6 transition-all",
              index === 0 ? "animate-fade-in" : "",
              { "opacity-70 hover:opacity-100": expandedCommit && expandedCommit !== commit.id }
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute left-[-1.65rem] top-1 h-4 w-4 rounded-full border bg-background flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            
            <div className={cn(
              "glass p-6 rounded-lg border border-border/50 transition-all",
              expandedCommit === commit.id ? "shadow-md" : ""
            )}>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-3">
                <h3 className="font-medium text-lg">{commit.title}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDate(commit.date)}</span>
                  <span className="text-xs opacity-20">•</span>
                  <User className="h-3.5 w-3.5" />
                  <span>{commit.author}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-4">{commit.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <GitCommit className="mr-2 h-3.5 w-3.5" />
                  <span>{commit.id.substring(0, 7)}</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleCommit(commit.id)}
                  className="gap-1 h-8 text-xs"
                >
                  {expandedCommit === commit.id ? (
                    <>
                      <span>Hide Analysis</span>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Show Analysis</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
              
              {expandedCommit === commit.id && (
                <div className="mt-4 pt-4 border-t animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">Developer Motivation Analysis</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{commit.analysis}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center pt-6">
        <Button variant="outline" className="group">
          <Search className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span>Explore More Commits</span>
        </Button>
      </div>
    </div>
  );
};

export default TimelineDisplay;
