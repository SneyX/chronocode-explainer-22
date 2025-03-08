import React, { useState, useEffect, useMemo } from 'react';
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
  GitBranch,
  Filter,
  RefreshCw,
  Info,
  MessageSquare
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Avatar } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { format, parseISO, differenceInDays, addDays, isWithinInterval } from 'date-fns';
import { 
  fetchCommits, 
  fetchCommitAnalyses, 
  fetchUniqueAuthors, 
  fetchUniqueTypes,
  groupCommitsByPeriod,
  groupCommitAnalyses
} from '@/services/supabaseService';
import { 
  CommitRecord, 
  CommitAnalysisRecord, 
  TimelinePeriod, 
  TimelineGroupBy 
} from '@/lib/supabase';

// Types
export interface TimelineData {
  repositoryName: string;
  periods: Record<string, CommitRecord[]>;
  groups: Record<string, CommitAnalysisRecord[]>;
  commits: CommitRecord[];
  analyses: CommitAnalysisRecord[];
}

interface ChronoTimelineProps {
  repositoryName: string;
  isLoading?: boolean;
}

interface CommitBarProps {
  commit: CommitRecord;
  analysis?: CommitAnalysisRecord;
  startDate: Date;
  endDate: Date;
  onClick: () => void;
}

// Helper functions
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
};

const formatPeriodLabel = (periodKey: string, periodType: TimelinePeriod): string => {
  try {
    switch (periodType) {
      case 'day':
        return format(parseISO(periodKey), 'MMM d, yyyy');
      case 'week':
        return `Week of ${format(parseISO(periodKey), 'MMM d, yyyy')}`;
      case 'two_weeks':
        // For two weeks format (YYYY-WXX)
        const [year, weekPart] = periodKey.split('-');
        const weekNumber = parseInt(weekPart.substring(1));
        return `${year} Weeks ${weekNumber}-${weekNumber + 1}`;
      case 'month':
        return format(parseISO(`${periodKey}-01`), 'MMMM yyyy');
      case 'quarter':
        const [yearQ, quarterPart] = periodKey.split('-Q');
        return `Q${quarterPart} ${yearQ}`;
      case 'year':
        return periodKey;
      default:
        return periodKey;
    }
  } catch (e) {
    return periodKey;
  }
};

// Component for commit bars in Gantt chart
const CommitBar: React.FC<CommitBarProps> = ({ commit, analysis, startDate, endDate, onClick }) => {
  const commitDate = parseISO(commit.date);
  
  // Calculate position as percentage of total time range
  const timeRange = endDate.getTime() - startDate.getTime();
  const position = timeRange <= 0 ? 50 : ((commitDate.getTime() - startDate.getTime()) / timeRange) * 100;
  
  // Constrain position within 0-100%
  const constrainedPosition = Math.max(0, Math.min(position, 100));
  
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="absolute h-8 bg-primary/30 rounded-md flex items-center justify-center px-2 cursor-pointer hover:bg-primary/50 transition-colors"
            style={{ 
              left: `${constrainedPosition}%`,
              width: '30px',
              transform: 'translateX(-15px)',
              zIndex: 10
            }}
            onClick={onClick}
          >
            <Avatar className="h-6 w-6 border-2 border-background">
              <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs font-bold">
                {commit.author.substring(0, 2).toUpperCase()}
              </div>
            </Avatar>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm" sideOffset={5}>
          <div className="space-y-2">
            <div className="font-medium">{analysis?.title || commit.message}</div>
            <div className="text-xs flex items-center gap-1">
              <User className="h-3 w-3" /> {commit.author}
            </div>
            <div className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(commit.date)}
            </div>
            {analysis && (
              <div className="text-xs flex items-center gap-1">
                <Badge variant="outline" className="text-xs py-0 h-4">
                  {analysis.type}
                </Badge>
              </div>
            )}
            {(analysis?.description || commit.description) && (
              <div className="text-xs flex items-start gap-1 max-w-xs">
                <MessageSquare className="h-3 w-3 mt-0.5" /> 
                <span className="line-clamp-2">{analysis?.description || commit.description}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ChronoTimeline: React.FC<ChronoTimelineProps> = ({ repositoryName, isLoading = false }) => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [authors, setAuthors] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<TimelinePeriod>('week');
  const [groupBy, setGroupBy] = useState<TimelineGroupBy>('type');
  const [selectedCommit, setSelectedCommit] = useState<CommitRecord | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CommitAnalysisRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(isLoading);

  // Derive date range from commits
  const dateRange = useMemo(() => {
    if (!timelineData || !timelineData.commits || timelineData.commits.length === 0) {
      const now = new Date();
      return {
        startDate: addDays(now, -30),
        endDate: now
      };
    }

    const dates = timelineData.commits.map(commit => new Date(commit.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Add buffer on both sides
    return {
      startDate: addDays(minDate, -2),
      endDate: addDays(maxDate, 2)
    };
  }, [timelineData?.commits]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    if (!repositoryName) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch data from Supabase
        const [commitsData, authorsData, typesData] = await Promise.all([
          fetchCommits(repositoryName),
          fetchUniqueAuthors(repositoryName),
          fetchUniqueTypes(repositoryName)
        ]);
        
        // Apply author filter if needed
        const filteredCommits = filterAuthor 
          ? commitsData.filter(commit => commit.author === filterAuthor)
          : commitsData;
        
        // Fetch analyses with filters
        const analysesData = await fetchCommitAnalyses(repositoryName, {
          type: filterType || undefined,
          author: filterAuthor || undefined
        });
        
        // Group data by period and type
        const periods = groupCommitsByPeriod(filteredCommits, periodType);
        const groups = groupCommitAnalyses(analysesData, filteredCommits, groupBy);
        
        setTimelineData({
          repositoryName,
          periods,
          groups,
          commits: filteredCommits,
          analyses: analysesData
        });
        
        setAuthors(authorsData);
        setTypes(typesData);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [repositoryName, filterAuthor, filterType, periodType, groupBy]);

  const toggleCommit = (id: string) => {
    setExpandedCommit(expandedCommit === id ? null : id);
  };

  const openCommitDetails = (commit: CommitRecord, analysis?: CommitAnalysisRecord) => {
    setSelectedCommit(commit);
    setSelectedAnalysis(analysis || null);
    setIsDialogOpen(true);
  };

  const handlePeriodChange = (value: string) => {
    setPeriodType(value as TimelinePeriod);
  };

  const handleGroupByChange = (value: string) => {
    setGroupBy(value as TimelineGroupBy);
  };

  // Generate period columns based on periodType
  const generatePeriodColumns = () => {
    if (!dateRange) return [];

    const { startDate, endDate } = dateRange;
    const daysDiff = differenceInDays(endDate, startDate);
    
    let intervals: { start: Date; end: Date; label: string }[] = [];
    
    switch (periodType) {
      case 'day':
        // Create a column for each day
        for (let i = 0; i <= daysDiff; i++) {
          const day = addDays(startDate, i);
          intervals.push({
            start: day,
            end: addDays(day, 1),
            label: format(day, 'MMM d')
          });
        }
        break;
      
      case 'week':
        // Create a column for each week
        for (let i = 0; i < daysDiff; i += 7) {
          const weekStart = addDays(startDate, i);
          const weekEnd = addDays(weekStart, 7);
          intervals.push({
            start: weekStart,
            end: weekEnd,
            label: `${format(weekStart, 'MMM d')} - ${format(addDays(weekEnd, -1), 'MMM d')}`
          });
        }
        break;
      
      case 'two_weeks':
        // Create a column for every two weeks
        for (let i = 0; i < daysDiff; i += 14) {
          const periodStart = addDays(startDate, i);
          const periodEnd = addDays(periodStart, 14);
          intervals.push({
            start: periodStart,
            end: periodEnd,
            label: `${format(periodStart, 'MMM d')} - ${format(addDays(periodEnd, -1), 'MMM d')}`
          });
        }
        break;
      
      case 'month':
        // Create columns by month
        let currentMonth = new Date(startDate);
        while (currentMonth < endDate) {
          const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
          intervals.push({
            start: monthStart,
            end: nextMonth,
            label: format(monthStart, 'MMMM yyyy')
          });
          currentMonth = nextMonth;
        }
        break;
      
      case 'quarter':
        // Create columns by quarter
        let currentQuarter = new Date(startDate);
        currentQuarter.setMonth(Math.floor(currentQuarter.getMonth() / 3) * 3);
        currentQuarter.setDate(1);
        
        while (currentQuarter < endDate) {
          const quarterStart = new Date(currentQuarter);
          const quarterEnd = new Date(currentQuarter.getFullYear(), currentQuarter.getMonth() + 3, 1);
          intervals.push({
            start: quarterStart,
            end: quarterEnd,
            label: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`
          });
          currentQuarter = quarterEnd;
        }
        break;
      
      case 'year':
        // Create columns by year
        let currentYear = new Date(startDate.getFullYear(), 0, 1);
        while (currentYear.getFullYear() <= endDate.getFullYear()) {
          const yearStart = new Date(currentYear.getFullYear(), 0, 1);
          const yearEnd = new Date(currentYear.getFullYear() + 1, 0, 1);
          intervals.push({
            start: yearStart,
            end: yearEnd,
            label: yearStart.getFullYear().toString()
          });
          currentYear.setFullYear(currentYear.getFullYear() + 1);
        }
        break;
      
      default:
        // Default to weeks
        for (let i = 0; i < daysDiff; i += 7) {
          const weekStart = addDays(startDate, i);
          const weekEnd = addDays(weekStart, 7);
          intervals.push({
            start: weekStart,
            end: weekEnd,
            label: `${format(weekStart, 'MMM d')} - ${format(addDays(weekEnd, -1), 'MMM d')}`
          });
        }
    }
    
    return intervals;
  };

  if (loading) {
    return <TimelineSkeleton />;
  }

  if (!timelineData) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center space-y-4">
          <Info className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">No timeline data available</h3>
          <p className="text-muted-foreground">Commits and analyses could not be loaded.</p>
        </div>
      </div>
    );
  }

  const { groups } = timelineData;
  const groupKeys = Object.keys(groups).sort();
  const periodColumns = generatePeriodColumns();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-medium mb-2">{repositoryName}</h2>
          <p className="text-muted-foreground">
            {timelineData.commits.length} commits • {timelineData.analyses.length} analyses
          </p>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col gap-1 min-w-32">
            <span className="text-xs text-muted-foreground">Period</span>
            <Select value={periodType} onValueChange={handlePeriodChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="two_weeks">Two Weeks</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1 min-w-32">
            <span className="text-xs text-muted-foreground">Group By</span>
            <Select value={groupBy} onValueChange={handleGroupByChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 min-w-32">
            <span className="text-xs text-muted-foreground">Author</span>
            <Select 
              value={filterAuthor || "all"} 
              onValueChange={(value) => setFilterAuthor(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {authors.map(author => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 min-w-32">
            <span className="text-xs text-muted-foreground">Type</span>
            <Select 
              value={filterType || "all"} 
              onValueChange={(value) => setFilterType(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 ml-2 mt-4"
            onClick={() => {
              setFilterAuthor(null);
              setFilterType(null);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Gantt Chart Timeline View */}
      <div className="bg-background/50 p-6 rounded-lg border overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header - Time Periods */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${periodColumns.length}, 1fr)` }}>
            <div className="font-medium text-sm">
              {groupBy === 'type' ? 'Categories' : groupBy === 'author' ? 'Authors' : 'Time Periods'}
            </div>
            
            {periodColumns.map((period, index) => (
              <div key={index} className="text-center text-xs text-muted-foreground font-medium p-1">
                {period.label}
              </div>
            ))}
          </div>
          
          {/* Gantt Rows */}
          <div className="mt-4 space-y-4">
            {groupKeys.map((group, rowIndex) => (
              <div 
                key={group} 
                className="relative"
              >
                {/* Row Label */}
                <div 
                  className="grid gap-2 items-center" 
                  style={{ gridTemplateColumns: `200px repeat(${periodColumns.length}, 1fr)` }}
                >
                  <div className="font-medium text-sm truncate">
                    {groupBy === 'type' && (
                      <Badge variant="outline" className={`bg-primary/10 text-primary border-primary/20`}>
                        {group}
                      </Badge>
                    )}
                    {groupBy === 'author' && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs font-bold">
                            {group.substring(0, 2).toUpperCase()}
                          </div>
                        </Avatar>
                        <span>{group}</span>
                      </div>
                    )}
                    {groupBy === 'date' && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{group}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Timeline Grid Cells */}
                  {periodColumns.map((period, colIndex) => (
                    <div 
                      key={`${group}-${colIndex}`} 
                      className="border border-border/30 rounded min-h-12 h-12"
                    ></div>
                  ))}
                </div>
                
                {/* Commits positioned over the timeline */}
                <div 
                  className="absolute top-0 left-[200px] right-0 h-12 flex items-center"
                >
                  {/* Find commits for this group */}
                  {groups[group].map(analysis => {
                    // Find the commit for this analysis
                    const commit = timelineData.commits.find(c => c.sha === analysis.commit_sha);
                    if (!commit) return null;
                    
                    // Only show if it fits within our date range
                    const commitDate = parseISO(commit.date);
                    if (commitDate < dateRange.startDate || commitDate > dateRange.endDate) return null;
                    
                    return (
                      <CommitBar
                        key={analysis.id}
                        commit={commit}
                        analysis={analysis}
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onClick={() => openCommitDetails(commit, analysis)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List View of Commits */}
      <div className="relative space-y-6 pl-6 before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-border">
        {timelineData.analyses.map((analysis, index) => {
          // Find the corresponding commit
          const commit = timelineData.commits.find(c => c.sha === analysis.commit_sha);
          if (!commit) return null;
          
          return (
            <div 
              key={analysis.id}
              className={cn(
                "relative pl-6 transition-all",
                index === 0 ? "animate-fade-in" : "",
                { "opacity-70 hover:opacity-100": expandedCommit && expandedCommit !== analysis.id }
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute left-[-1.65rem] top-1 h-4 w-4 rounded-full border bg-background flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              
              <div className={cn(
                "glass p-6 rounded-lg border border-border/50 transition-all",
                expandedCommit === analysis.id ? "shadow-md" : ""
              )}>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs font-bold">
                        {commit.author.substring(0, 2).toUpperCase()}
                      </div>
                    </Avatar>
                    <div>
                      <Badge variant="outline" className="mb-1">
                        {analysis.type}
                      </Badge>
                      <h3 className="font-medium text-lg">{analysis.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(commit.date)}</span>
                    <span className="text-xs opacity-20">•</span>
                    <User className="h-3.5 w-3.5" />
                    <span>{commit.author}</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4">{analysis.description || commit.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <GitCommit className="mr-2 h-3.5 w-3.5" />
                    <span>{commit.sha.substring(0, 7)}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openCommitDetails(commit, analysis)}
                    className="gap-1 h-8 text-xs"
                  >
                    <span>View Details</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Commit Details Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedCommit && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedAnalysis ? selectedAnalysis.title : selectedCommit.message}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <User className="h-4 w-4" />
                    <span>{selectedCommit.author}</span>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>{formatDate(selectedCommit.date)}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="mt-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  {selectedAnalysis && (
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p>{selectedCommit.description || selectedCommit.message}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Commit Info</h3>
                    <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="font-medium w-20">SHA:</span>
                        <span className="text-xs bg-background px-2 py-1 rounded font-mono">{selectedCommit.sha}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium w-20">Author:</span>
                        <span>{selectedCommit.author}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium w-20">Email:</span>
                        <span>{selectedCommit.author_email}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium w-20">Date:</span>
                        <span>{formatDate(selectedCommit.date)}</span>
                      </div>
                      {selectedCommit.url && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium w-20">URL:</span>
                          <a href={selectedCommit.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            View on GitHub
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                {selectedAnalysis && (
                  <TabsContent value="analysis" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                      <Badge>{selectedAnalysis.type}</Badge>
                    </div>
                    
                    {selectedAnalysis.idea && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Main Idea</h3>
                        <p>{selectedAnalysis.idea}</p>
                      </div>
                    )}
                    
                    {selectedAnalysis.description && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Detailed Analysis</h3>
                        <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                          {selectedAnalysis.description}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
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
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Matrix Skeleton */}
      <div className="bg-background/50 p-6 rounded-lg border overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(5, 1fr)` }}>
            <Skeleton className="h-5 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
          
          <div className="mt-4 space-y-4">
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <div 
                key={rowIndex} 
                className="grid gap-2" 
                style={{ gridTemplateColumns: `200px repeat(5, 1fr)` }}
              >
                <Skeleton className="h-12 w-full" />
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-12 w-full" />
                ))}
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
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-48" />
                  </div>
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