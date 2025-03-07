import React, { useState, useEffect } from 'react';
import { 
  GitCommit, 
  Clock, 
  User, 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Code,
  GitBranch
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Avatar } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// Types
export interface Commit {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  author_email: string;
  authorImage?: string;
  analysis?: string;
  startDate?: string;
  endDate?: string;
}

export interface Hito {
  name: string;
  description: string;
  fecha: string;
}

export interface Timeline {
  repositoryName: string;
  commits: Commit[];
  hitos?: Hito[];
}

interface ChronoTimelineProps {
  timeline: Timeline;
  isLoading?: boolean;
}

// Helper functions
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const calculateTimelinePositions = (commits: Commit[]) => {
  // Sort commits by date
  const sortedCommits = [...commits].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (sortedCommits.length === 0) return [];
  
  // Get earliest and latest dates
  const earliestDate = new Date(sortedCommits[0].date).getTime();
  const latestDate = new Date(sortedCommits[sortedCommits.length - 1].date).getTime();
  const timeRange = latestDate - earliestDate;
  
  // If all commits are on the same day, use a default range
  const totalSegments = 10;
  
  return sortedCommits.map(commit => {
    const commitDate = new Date(commit.date).getTime();
    
    // Calculate position as percentage of total time range
    let position = 0;
    if (timeRange > 0) {
      position = ((commitDate - earliestDate) / timeRange) * 100;
    } else {
      // If all commits are on the same day, space them evenly
      const index = sortedCommits.findIndex(c => c.id === commit.id);
      position = (index / (sortedCommits.length - 1 || 1)) * 100;
    }
    
    // Calculate a reasonable duration (width)
    const duration = 10; // Default width percentage
    
    return {
      ...commit,
      position,
      duration
    };
  });
};

const ChronoTimeline: React.FC<ChronoTimelineProps> = ({ timeline, isLoading = false }) => {
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string | null>(null);
  const [showHitos, setShowHitos] = useState<boolean>(true);
  
  // Get unique authors for filtering
  const authors = timeline?.commits 
    ? Array.from(new Set(timeline.commits.map(commit => commit.author)))
    : [];
  
  // Filter commits based on author
  const filteredCommits = timeline?.commits && filterAuthor 
    ? timeline.commits.filter(commit => commit.author === filterAuthor) 
    : timeline?.commits || [];
  
  // Calculate timeline positions
  const commitsWithPositions = calculateTimelinePositions(filteredCommits);
  
  const toggleCommit = (id: string) => {
    setExpandedCommit(expandedCommit === id ? null : id);
  };

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-medium mb-2">{timeline.repositoryName}</h2>
          <p className="text-muted-foreground">
            {filteredCommits.length} commits in timeline
            {timeline.hitos && ` • ${timeline.hitos.length} milestones`}
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
          {timeline.hitos && timeline.hitos.length > 0 && (
            <Button
              variant={showHitos ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHitos(!showHitos)}
            >
              {showHitos ? "Hide Milestones" : "Show Milestones"}
            </Button>
          )}
        </div>
      </div>

      {/* Gantt Chart Style Timeline */}
      <div className="bg-background/50 p-6 rounded-lg border overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex mb-6">
            <div className="w-1/4 font-medium text-sm">Commit</div>
            <div className="w-3/4 flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                  {i * 10}%
                </div>
              ))}
            </div>
          </div>
          
          {/* Timeline Items */}
          <div className="space-y-6">
            {commitsWithPositions.map((commit, index) => (
              <div key={commit.id} className="flex items-center animate-fade-in" 
                   style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-1/4 pr-4">
                  <div className="font-medium text-sm truncate">{commit.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {commit.author}
                  </div>
                </div>
                
                <div className="w-3/4 flex items-center h-10 relative">
                  {/* Timeline Bar */}
                  <div 
                    className="absolute h-8 bg-primary/20 rounded-md flex items-center px-2 cursor-pointer hover:bg-primary/30 transition-colors"
                    style={{ 
                      left: `${commit.position}%`,
                      width: `${commit.duration}%`,
                      maxWidth: '100%'
                    }}
                    onClick={() => toggleCommit(commit.id)}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            {commit.authorImage ? (
                              <img src={commit.authorImage} alt={commit.author} />
                            ) : (
                              <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs font-bold">
                                {commit.author.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{commit.title}</p>
                          <p className="text-xs">{formatDate(commit.date)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
            ))}
            
            {/* Hitos (Milestones) */}
            {showHitos && timeline.hitos && timeline.hitos.map((hito, index) => (
              <div key={`hito-${index}`} className="flex items-center animate-fade-in" 
                   style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-1/4 pr-4">
                  <div className="font-medium text-sm truncate flex items-center gap-1">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                      Milestone
                    </Badge>
                    {hito.name}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(hito.fecha)}
                  </div>
                </div>
                
                <div className="w-3/4 flex items-center h-10 relative">
                  {/* Calculate position based on date */}
                  <div 
                    className="absolute h-8 bg-amber-500/20 rounded-md flex items-center px-2 border border-amber-500/30"
                    style={{ 
                      left: `${Math.random() * 80}%`,  // Random position for demo
                      width: '15%'
                    }}
                  >
                    <span className="text-xs font-medium text-amber-700">{hito.name}</span>
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
            ))}
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
                    {commit.authorImage ? (
                      <img src={commit.authorImage} alt={commit.author} />
                    ) : (
                      <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs font-bold">
                        {commit.author.substring(0, 2).toUpperCase()}
                      </div>
                    )}
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
                
                {commit.analysis && (
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
                )}
              </div>
              
              {expandedCommit === commit.id && commit.analysis && (
                <div className="mt-4 pt-4 border-t animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">Commit Analysis</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{commit.analysis}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Hitos in timeline view */}
        {showHitos && timeline.hitos && timeline.hitos.map((hito, index) => (
          <div 
            key={`hito-timeline-${index}`}
            className="relative pl-6 transition-all animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute left-[-1.65rem] top-1 h-4 w-4 rounded-full border bg-background flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            
            <div className="glass p-6 rounded-lg border border-amber-500/20 transition-all bg-amber-500/5">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <GitBranch className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
                      Milestone
                    </Badge>
                    <h3 className="font-medium text-lg">{hito.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(hito.fecha)}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-4">{hito.description}</p>
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

// Loading skeleton
const TimelineSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Gantt Chart Skeleton */}
      <div className="bg-background/50 p-6 rounded-lg border overflow-x-auto">
        <div className="min-w-[800px]">
          <Skeleton className="h-6 w-full mb-6" />
          
          {/* Timeline Items Skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-1/4 pr-4">
                  <Skeleton className="h-5 w-full mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                
                <div className="w-3/4">
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List View Skeleton */}
      <div className="relative space-y-6 pl-6 before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="relative pl-6">
            <div className="absolute left-[-1.65rem] top-1 h-4 w-4 rounded-full border bg-background" />
            
            <div className="glass p-6 rounded-lg border border-border/50">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
              
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6 mb-1" />
              <Skeleton className="h-4 w-4/6 mb-4" />
              
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChronoTimeline; 