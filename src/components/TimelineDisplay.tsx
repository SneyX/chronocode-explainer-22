
import { useState } from "react";
import { GitCommit, Clock, User, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface Commit {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  authorImage: string;
  analysis: string;
  startDate?: string;
  endDate?: string;
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

      {/* Gantt Chart Style Timeline */}
      <div className="bg-background/50 p-6 rounded-lg border overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex mb-6">
            <div className="w-1/4 font-medium text-sm">Task</div>
            <div className="w-3/4 flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                  Period {i + 1}
                </div>
              ))}
            </div>
          </div>
          
          {/* Timeline Items */}
          <div className="space-y-6">
            {filteredCommits.map((commit, index) => {
              // Calculate relative position and width for timeline bar
              // For demo purposes, I'm using random values, but you would calculate these
              // based on actual dates in a real implementation
              const startPosition = Math.floor(Math.random() * 5) + 1; // Random start between 1-5
              const duration = Math.floor(Math.random() * 4) + 1; // Random duration between 1-4

              return (
                <div key={commit.id} className="flex items-center animate-fade-in" 
                     style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="w-1/4 pr-4">
                    <div className="font-medium text-sm truncate">{commit.title}</div>
                    <div className="text-xs text-muted-foreground">{commit.author}</div>
                  </div>
                  
                  <div className="w-3/4 flex items-center h-10 relative">
                    {/* Timeline Bar */}
                    <div 
                      className="absolute h-8 bg-primary/20 rounded-md flex items-center px-2"
                      style={{ 
                        left: `${(startPosition - 1) * 10}%`,
                        width: `${duration * 10}%`
                      }}
                    >
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <img src={commit.authorImage} alt={commit.author} />
                      </Avatar>
                    </div>
                    
                    {/* Grid Lines */}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 border-l border-border/40 h-full"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* List View of Commits */}
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
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <img src={commit.authorImage} alt={commit.author} />
                  </Avatar>
                  <h3 className="font-medium text-lg">{commit.title}</h3>
                </div>
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
