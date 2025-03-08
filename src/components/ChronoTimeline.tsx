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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Network, 
  FileText, 
  Lightbulb,
  Braces,
  FileCode,
  GitPullRequest
} from 'lucide-react';

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

// First add a new interface for commit clustering
interface CommitCluster {
  commits: CommitRecord[];
  analyses: CommitAnalysisRecord[];
  position: number; // percentage position on timeline
  count: number;
}

// Add these helper functions for the Code Impact Analysis
interface FileImpactData {
  name: string;
  value: number;
  children?: FileImpactData[];
  path?: string;
  color?: string;
}

// Function to process commit data into file impact statistics
const processFileChanges = (commits: CommitRecord[]): FileImpactData => {
  // In a real implementation, we would parse the commit data to extract file changes
  // For this demo, we'll create mock data representing file changes
  
  // Create a hierarchical structure of directories and files
  const root: FileImpactData = {
    name: 'root',
    value: 0,
    children: []
  };
  
  // Mock file paths that might be changed in commits
  const mockFilePaths = [
    'src/components/ui/button.tsx',
    'src/components/ui/dialog.tsx',
    'src/components/ui/input.tsx',
    'src/components/ChronoTimeline.tsx',
    'src/components/Navbar.tsx',
    'src/pages/GenerateTimeline.tsx',
    'src/pages/Index.tsx',
    'src/lib/utils.ts',
    'src/lib/supabase.ts',
    'src/services/api.ts',
    'src/services/supabaseService.ts',
    'public/assets/logo.svg',
    'README.md',
    'package.json'
  ];
  
  // Assign random change counts to files based on commit volume
  const commitCount = commits.length;
  
  mockFilePaths.forEach(filePath => {
    // Calculate a weighted value based on the number of commits
    // More commits = more likely to have higher change counts
    const changeCount = Math.floor(Math.random() * commitCount * 0.5) + 1;
    
    // Split the path into parts
    const parts = filePath.split('/');
    const fileName = parts.pop() || '';
    
    // Navigate/create the directory structure
    let currentNode = root;
    
    for (const part of parts) {
      // Find or create directory node
      let dirNode = currentNode.children?.find(child => child.name === part);
      
      if (!dirNode) {
        dirNode = {
          name: part,
          value: 0,
          children: []
        };
        currentNode.children?.push(dirNode);
      }
      
      currentNode = dirNode;
    }
    
    // Add the file node
    currentNode.children?.push({
      name: fileName,
      value: changeCount,
      path: filePath
    });
    
    // Update parent directory values
    let tempNode = root;
    for (const part of parts) {
      tempNode = tempNode.children?.find(child => child.name === part) as FileImpactData;
      tempNode.value += changeCount;
    }
  });
  
  // Assign colors based on file types
  const assignColors = (node: FileImpactData) => {
    if (node.children) {
      node.children.forEach(assignColors);
    } else {
      // Assign colors based on file extension
      const ext = node.name.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'tsx':
        case 'jsx':
          node.color = '#61dafb'; // React blue
          break;
        case 'ts':
        case 'js':
          node.color = '#3178c6'; // TypeScript blue
          break;
        case 'css':
        case 'scss':
          node.color = '#264de4'; // CSS blue
          break;
        case 'json':
          node.color = '#f5de19'; // JSON yellow
          break;
        case 'md':
          node.color = '#083fa1'; // Markdown blue
          break;
        case 'svg':
          node.color = '#ff9900'; // SVG orange
          break;
        default:
          node.color = '#718096'; // Default gray
      }
    }
  };
  
  assignColors(root);
  
  return root;
};

// Custom Treemap content component
const CustomTreemapContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, value, colors } = props;
  
  // Don't render if width or height is too small
  if (width < 10 || height < 10) {
    return null;
  }
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: props.color || colors[index % colors.length],
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {width > 30 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fill="#fff"
          style={{ pointerEvents: 'none' }}
        >
          {name}
        </text>
      )}
      {width > 60 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="#fff"
          style={{ pointerEvents: 'none' }}
        >
          {value} changes
        </text>
      )}
    </g>
  );
};

// Now add the Code Impact Analysis component
const CodeImpactAnalysis: React.FC<{
  commits: CommitRecord[];
}> = ({ commits }) => {
  // Define mockFilePaths here to avoid reference errors
  const mockFilePaths = [
    'src/components/ui/button.tsx',
    'src/components/ui/dialog.tsx',
    'src/components/ui/input.tsx',
    'src/components/ChronoTimeline.tsx',
    'src/components/Navbar.tsx',
    'src/pages/GenerateTimeline.tsx',
    'src/pages/Index.tsx',
    'src/lib/utils.ts',
    'src/lib/supabase.ts',
    'src/services/api.ts',
    'src/services/supabaseService.ts',
    'public/assets/logo.svg',
    'README.md',
    'package.json'
  ];
  
  // Process the commit data to get file impact statistics
  const fileImpactData = useMemo(() => processFileChanges(commits), [commits]);
  
  // Prepare data for the treemap
  const treemapData = useMemo(() => {
    // Create a flattened array for the treemap
    const flattenHierarchy = (node: FileImpactData, parentPath = ''): any[] => {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      if (!node.children || node.children.length === 0) {
        return [{
          name: node.name,
          fullPath: currentPath,
          size: node.value,
          color: node.color || '#8884d8'
        }];
      }
      
      // Include the parent directory with its own size
      const result = [{
        name: node.name,
        fullPath: currentPath,
        size: node.value * 0.2, // Reduce parent size to make children more visible
        color: '#718096' // Gray for directories
      }];
      
      // Add all children
      node.children.forEach(child => {
        result.push(...flattenHierarchy(child, currentPath));
      });
      
      return result;
    };
    
    return flattenHierarchy(fileImpactData).filter(item => item.size > 0);
  }, [fileImpactData]);
  
  // Colors for the treemap
  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];
  
  return (
    <div className="space-y-6">
      <div className="w-full flex flex-col md:flex-row justify-center items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-medium">Code Impact Heatmap</h3>
          <p className="text-muted-foreground">
            Visualizing which files and directories have the most changes.
          </p>
        </div>
      </div>
      
      <div className="h-[500px] w-full bg-background/30 rounded-lg border overflow-hidden">
        {treemapData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              nameKey="name"
              stroke="#fff"
            >
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-md shadow-md p-3">
                        <p className="font-medium">{data.fullPath}</p>
                        <p className="text-sm text-muted-foreground">{data.size} changes</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <FileCode className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No file impact data available</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-background/60">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            Most Changed Files
          </h4>
          <ul className="space-y-2">
            {mockFilePaths.slice(0, 5).map((path, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span className="truncate">{path.split('/').pop()}</span>
                <Badge variant="outline">{Math.floor(Math.random() * 50) + 10} changes</Badge>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 border rounded-lg bg-background/60">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-primary" />
            Active Directories
          </h4>
          <ul className="space-y-2">
            {['src/components', 'src/pages', 'src/lib', 'src/services', 'public/assets'].map((dir, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span>{dir}</span>
                <Badge variant="outline">{Math.floor(Math.random() * 100) + 20} changes</Badge>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 border rounded-lg bg-background/60">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Braces className="h-4 w-4 text-primary" />
            File Type Distribution
          </h4>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'TypeScript', value: 45 },
                    { name: 'React', value: 30 },
                    { name: 'CSS', value: 15 },
                    { name: 'JSON', value: 5 },
                    { name: 'Other', value: 5 }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

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

// Implement a better CommitBar that handles single commits and clusters
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
            className="absolute h-8 bg-primary/30 rounded-md flex items-center justify-center px-2 cursor-pointer hover:bg-primary/50 transition-colors hover:z-20"
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

// Create a new component to handle clusters of commits
const CommitClusterBar: React.FC<{
  cluster: CommitCluster;
  startDate: Date;
  endDate: Date;
  onClusterClick: (cluster: CommitCluster) => void;
}> = ({ cluster, startDate, endDate, onClusterClick }) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="absolute h-8 bg-primary/40 rounded-md flex items-center justify-center px-2 cursor-pointer hover:bg-primary/60 transition-colors border border-primary/30 hover:z-20"
            style={{ 
              left: `${cluster.position}%`,
              width: '36px',
              transform: 'translateX(-18px)',
              zIndex: 15
            }}
            onClick={() => onClusterClick(cluster)}
          >
            <div className="font-medium text-xs">+{cluster.count}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm" sideOffset={5}>
          <div className="space-y-2">
            <div className="font-medium">Cluster of {cluster.count} commits</div>
            <div className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" /> From {formatDate(cluster.commits[0].date)} to {formatDate(cluster.commits[cluster.commits.length-1].date)}
            </div>
            <div className="text-xs">
              <span className="font-semibold">Authors:</span> {Array.from(new Set(cluster.commits.map(c => c.author))).join(', ')}
            </div>
            <div className="text-xs flex items-center mt-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs w-full"
                onClick={() => onClusterClick(cluster)}
              >
                View All Commits
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Create a dialog to show clustered commits
const ClusterDialog: React.FC<{
  cluster: CommitCluster | null;
  isOpen: boolean;
  onClose: () => void;
  onCommitClick: (commit: CommitRecord, analysis?: CommitAnalysisRecord) => void;
}> = ({ cluster, isOpen, onClose, onCommitClick }) => {
  if (!cluster) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commit Cluster ({cluster.count} commits)</DialogTitle>
          <DialogDescription>
            Commits close together in time between {formatDate(cluster.commits[0].date)} and {formatDate(cluster.commits[cluster.commits.length-1].date)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {cluster.commits.map((commit, index) => {
            // Find the matching analysis
            const analysis = cluster.analyses.find(a => a.commit_sha === commit.sha);
            
            return (
              <div 
                key={commit.sha}
                className="p-4 rounded-lg border hover:bg-background/60 cursor-pointer transition-colors"
                onClick={() => {
                  onCommitClick(commit, analysis);
                  onClose();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs font-bold">
                        {commit.author.substring(0, 2).toUpperCase()}
                      </div>
                    </Avatar>
                    <span className="font-medium">{analysis?.title || commit.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(commit.date)}</span>
                </div>
                
                {analysis && (
                  <Badge variant="outline" className="mt-2">
                    {analysis.type}
                  </Badge>
                )}
                
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {analysis?.description || commit.description || commit.message}
                </p>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add these helper functions and components for the Commit Complexity Analysis
interface ComplexityData {
  id: string;
  date: string;
  complexity: number;
  impactScope: number;
  type: string;
  author: string;
  message: string;
  color?: string;
}

// Function to calculate commit complexity metrics
const calculateCommitComplexity = (
  commits: CommitRecord[],
  analyses: CommitAnalysisRecord[]
): ComplexityData[] => {
  // In a real implementation, we would analyze the actual commit content
  // For this demo, we'll create mock complexity data
  
  return commits.map(commit => {
    // Find the corresponding analysis
    const analysis = analyses.find(a => a.commit_sha === commit.sha);
    
    // Calculate a mock complexity score (1-10)
    // In a real implementation, this would be based on code metrics
    const complexity = Math.floor(Math.random() * 10) + 1;
    
    // Calculate a mock impact scope (1-10)
    // In a real implementation, this would be based on number of files changed
    const impactScope = Math.floor(Math.random() * 10) + 1;
    
    // Determine the type from the analysis or use a default
    const type = analysis?.type || 'OTHER';
    
    // Assign a color based on the type
    let color;
    switch (type) {
      case 'FEATURE':
        color = '#4299e1'; // blue
        break;
      case 'FIX':
        color = '#48bb78'; // green
        break;
      case 'REFACTOR':
        color = '#ed8936'; // orange
        break;
      case 'DOCS':
        color = '#9f7aea'; // purple
        break;
      case 'TEST':
        color = '#ecc94b'; // yellow
        break;
      default:
        color = '#a0aec0'; // gray
    }
    
    return {
      id: commit.sha,
      date: commit.date,
      complexity,
      impactScope,
      type,
      author: commit.author,
      message: commit.message,
      color
    };
  });
};

// Custom tooltip for the scatter plot
const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-background border rounded-md shadow-md p-3 max-w-xs">
        <p className="font-medium mb-1 truncate">{data.message}</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Author: {data.author}</p>
          <p>Date: {formatDate(data.date)}</p>
          <p>Type: {data.type}</p>
          <p>Complexity: {data.complexity}/10</p>
          <p>Impact Scope: {data.impactScope}/10</p>
        </div>
      </div>
    );
  }
  
  return null;
};

// Now add the Commit Complexity Analysis component
const CommitComplexityAnalysis: React.FC<{
  commits: CommitRecord[];
  analyses: CommitAnalysisRecord[];
}> = ({ commits, analyses }) => {
  // Calculate complexity metrics
  const complexityData = useMemo(
    () => calculateCommitComplexity(commits, analyses),
    [commits, analyses]
  );
  
  // Group data by type for the bar chart
  const typeData = useMemo(() => {
    const types: Record<string, { count: number, avgComplexity: number }> = {};
    
    complexityData.forEach(item => {
      if (!types[item.type]) {
        types[item.type] = { count: 0, avgComplexity: 0 };
      }
      
      types[item.type].count += 1;
      types[item.type].avgComplexity += item.complexity;
    });
    
    // Calculate averages
    Object.keys(types).forEach(type => {
      types[type].avgComplexity = parseFloat((types[type].avgComplexity / types[type].count).toFixed(1));
    });
    
    // Convert to array for the chart
    return Object.entries(types).map(([type, data]) => ({
      type,
      count: data.count,
      avgComplexity: data.avgComplexity
    }));
  }, [complexityData]);
  
  // Group data by author for the bar chart
  const authorData = useMemo(() => {
    const authors: Record<string, { count: number, avgComplexity: number }> = {};
    
    complexityData.forEach(item => {
      if (!authors[item.author]) {
        authors[item.author] = { count: 0, avgComplexity: 0 };
      }
      
      authors[item.author].count += 1;
      authors[item.author].avgComplexity += item.complexity;
    });
    
    // Calculate averages
    Object.keys(authors).forEach(author => {
      authors[author].avgComplexity = parseFloat((authors[author].avgComplexity / authors[author].count).toFixed(1));
    });
    
    // Convert to array for the chart
    return Object.entries(authors).map(([author, data]) => ({
      author,
      count: data.count,
      avgComplexity: data.avgComplexity
    }));
  }, [complexityData]);
  
  return (
    <div className="space-y-6">
      <div className="w-full flex flex-col md:flex-row justify-center items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-medium">Commit Complexity Analysis</h3>
          <p className="text-muted-foreground">
            Analyzing the complexity and scope of commits over time.
          </p>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="category"
              dataKey="date"
              name="Date"
              tickFormatter={(value) => {
                try {
                  return format(parseISO(value), 'MMM d');
                } catch (e) {
                  return value;
                }
              }}
              label={{ value: 'Date', position: 'insideBottomRight', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="complexity"
              name="Complexity"
              domain={[0, 10]}
              label={{ value: 'Complexity', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis
              type="number"
              dataKey="impactScope"
              range={[50, 400]}
              name="Impact Scope"
            />
            <RechartsTooltip content={<CustomScatterTooltip />} />
            <Legend />
            
            {/* Group scatters by type */}
            {Array.from(new Set(complexityData.map(item => item.type))).map(type => {
              const filteredData = complexityData.filter(item => item.type === type);
              const color = filteredData[0]?.color || '#a0aec0';
              
              return (
                <Scatter
                  key={type}
                  name={type}
                  data={filteredData}
                  fill={color}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg bg-background/60">
          <h4 className="font-medium mb-4">Complexity by Commit Type</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Number of Commits" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="avgComplexity" name="Avg. Complexity" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-background/60">
          <h4 className="font-medium mb-4">Complexity by Author</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={authorData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="author" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Number of Commits" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="avgComplexity" name="Avg. Complexity" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add these helper functions and components for the Developer Focus Patterns
interface DeveloperFocusData {
  author: string;
  primary: string;
  expertise: { name: string; percentage: number }[];
  commitCount: number;
  lastActive: string;
}

// Function to analyze developer focus areas
const analyzeDevFocus = (commits: CommitRecord[]): Record<string, DeveloperFocusData> => {
  // In a real implementation, we would analyze the actual files changed in commits
  // For this demo, we'll create mock data
  
  // Group commits by author
  const authorCommits: Record<string, CommitRecord[]> = {};
  
  commits.forEach(commit => {
    if (!authorCommits[commit.author]) {
      authorCommits[commit.author] = [];
    }
    
    authorCommits[commit.author].push(commit);
  });
  
  // Mock file paths that might be changed in commits
  const mockFilePaths = [
    'src/components/ui',
    'src/components',
    'src/pages',
    'src/lib',
    'src/services',
    'public/assets',
    'tests',
    'docs'
  ];
  
  // Create mock focus data for each author
  const focusData: Record<string, DeveloperFocusData> = {};
  
  Object.entries(authorCommits).forEach(([author, commits]) => {
    // Randomly assign focus areas
    const focusAreas = mockFilePaths
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(4, mockFilePaths.length))
      .map(area => {
        return {
          name: area,
          percentage: Math.floor(Math.random() * 80) + 20
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
    
    // Normalize percentages to sum to 100
    const totalPercentage = focusAreas.reduce((sum, area) => sum + area.percentage, 0);
    focusAreas.forEach(area => {
      area.percentage = Math.round((area.percentage / totalPercentage) * 100);
    });
    
    // Find the last active date
    const dates = commits.map(commit => new Date(commit.date).getTime());
    const lastActive = new Date(Math.max(...dates)).toISOString();
    
    focusData[author] = {
      author,
      primary: focusAreas[0].name,
      expertise: focusAreas,
      commitCount: commits.length,
      lastActive
    };
  });
  
  return focusData;
};

// Now add the Developer Focus Patterns component
const DeveloperFocusPatterns: React.FC<{
  commits: CommitRecord[];
}> = ({ commits }) => {
  // Analyze developer focus areas
  const focusData = useMemo(() => analyzeDevFocus(commits), [commits]);
  
  // Convert to array for easier rendering
  const developers = useMemo(() => 
    Object.values(focusData).sort((a, b) => b.commitCount - a.commitCount),
    [focusData]
  );
  
  // Generate colors for the expertise areas
  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];
  
  return (
    <div className="space-y-6">
      <div className="w-full flex flex-col md:flex-row justify-center items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-medium">Developer Focus Patterns</h3>
          <p className="text-muted-foreground">
            Identifying which developers specialize in which parts of the codebase.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {developers.map(dev => (
          <div key={dev.author} className="p-4 border rounded-lg bg-background/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xs font-bold">
                    {dev.author.substring(0, 2).toUpperCase()}
                  </div>
                </Avatar>
                <div>
                  <h4 className="font-medium">{dev.author}</h4>
                  <p className="text-xs text-muted-foreground">
                    {dev.commitCount} commits · Last active: {formatDate(dev.lastActive)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {dev.commitCount} commits
              </Badge>
            </div>
            
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2">Primary focus: {dev.primary}</h5>
              
              <div className="space-y-3">
                {dev.expertise.map((area, index) => (
                  <div key={area.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{area.name}</span>
                      <span>{area.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${area.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border rounded-lg bg-background/60">
        <h4 className="font-medium mb-4">Team Collaboration Network</h4>
        <p className="text-muted-foreground mb-4">
          Visualizing how developers collaborate on different parts of the codebase.
        </p>
        <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
          <div className="text-center">
            <Network className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Collaboration network visualization would be displayed here in a full implementation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add these helper functions and components for the Semantic Commit Analysis
interface SemanticGroup {
  theme: string;
  commits: CommitRecord[];
  analyses: CommitAnalysisRecord[];
  startDate: string;
  endDate: string;
  commitCount: number;
  summary: string;
  keywords: string[];
  color: string;
}

// Function to analyze commit themes
const analyzeCommitThemes = (
  commits: CommitRecord[],
  analyses: CommitAnalysisRecord[]
): SemanticGroup[] => {
  // In a real implementation, we would use NLP to extract themes from commit messages
  // For this demo, we'll create mock semantic groups
  
  // Define some mock themes
  const mockThemes = [
    {
      theme: 'User Interface Improvements',
      summary: 'Enhancements to the user interface components and layout',
      keywords: ['UI', 'design', 'layout', 'components', 'responsive'],
      color: '#3182ce' // blue
    },
    {
      theme: 'Performance Optimization',
      summary: 'Optimizations to improve application performance and loading times',
      keywords: ['performance', 'speed', 'optimization', 'loading', 'cache'],
      color: '#38a169' // green
    },
    {
      theme: 'Bug Fixes',
      summary: 'Resolving issues and bugs in the application',
      keywords: ['fix', 'bug', 'issue', 'resolve', 'problem'],
      color: '#e53e3e' // red
    },
    {
      theme: 'Feature Development',
      summary: 'Adding new features and functionality to the application',
      keywords: ['feature', 'add', 'new', 'implement', 'functionality'],
      color: '#805ad5' // purple
    },
    {
      theme: 'Code Refactoring',
      summary: 'Restructuring and improving code quality without changing functionality',
      keywords: ['refactor', 'clean', 'restructure', 'improve', 'quality'],
      color: '#dd6b20' // orange
    },
    {
      theme: 'Documentation',
      summary: 'Improving documentation and code comments',
      keywords: ['docs', 'documentation', 'comment', 'readme', 'guide'],
      color: '#718096' // gray
    }
  ];
  
  // Sort commits by date
  const sortedCommits = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (sortedCommits.length === 0) {
    return [];
  }
  
  // Divide commits into time periods
  const totalCommits = sortedCommits.length;
  const groupCount = Math.min(mockThemes.length, Math.max(2, Math.floor(totalCommits / 5)));
  const commitsPerGroup = Math.ceil(totalCommits / groupCount);
  
  const groups: SemanticGroup[] = [];
  
  for (let i = 0; i < groupCount; i++) {
    const startIndex = i * commitsPerGroup;
    const endIndex = Math.min(startIndex + commitsPerGroup, totalCommits);
    const groupCommits = sortedCommits.slice(startIndex, endIndex);
    
    if (groupCommits.length === 0) continue;
    
    const theme = mockThemes[i % mockThemes.length];
    const groupAnalyses = analyses.filter(analysis => 
      groupCommits.some(commit => commit.sha === analysis.commit_sha)
    );
    
    groups.push({
      ...theme,
      commits: groupCommits,
      analyses: groupAnalyses,
      startDate: groupCommits[0].date,
      endDate: groupCommits[groupCommits.length - 1].date,
      commitCount: groupCommits.length
    });
  }
  
  return groups;
};

// Helper function to format a date range
const formatDateRange = (startDate: string, endDate: string): string => {
  try {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  } catch (e) {
    return `${startDate} - ${endDate}`;
  }
};

// Now add the Semantic Commit Analysis component
const SemanticCommitAnalysis: React.FC<{
  commits: CommitRecord[];
  analyses: CommitAnalysisRecord[];
}> = ({ commits, analyses }) => {
  // Analyze commit themes
  const semanticGroups = useMemo(
    () => analyzeCommitThemes(commits, analyses),
    [commits, analyses]
  );
  
  // Prepare data for the bar chart
  const chartData = useMemo(() => {
    return semanticGroups.map(group => ({
      name: group.theme,
      commits: group.commitCount,
      fill: group.color
    }));
  }, [semanticGroups]);
  
  return (
    <div className="space-y-6">
      <div className="w-full flex flex-col md:flex-row justify-center items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-medium">Semantic Commit Analysis</h3>
          <p className="text-muted-foreground">
            Grouping commits by semantic meaning and themes.
          </p>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="commits" name="Number of Commits">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-6">
        {semanticGroups.map((group, index) => (
          <div 
            key={group.theme} 
            className="border-l-4 pl-4 py-2" 
            style={{ borderColor: group.color }}
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
              <h4 className="font-medium text-lg">{group.theme}</h4>
              <div className="text-sm text-muted-foreground">
                {formatDateRange(group.startDate, group.endDate)} · {group.commitCount} commits
              </div>
            </div>
            
            <p className="mt-2 text-muted-foreground">{group.summary}</p>
            
            <div className="mt-3 flex flex-wrap gap-1">
              {group.keywords.map(keyword => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
            
            <div className="mt-4 space-y-2">
              <h5 className="text-sm font-medium">Key Commits:</h5>
              <div className="space-y-2">
                {group.commits.slice(0, 3).map(commit => {
                  const analysis = group.analyses.find(a => a.commit_sha === commit.sha);
                  
                  return (
                    <div 
                      key={commit.sha} 
                      className="p-3 bg-background/60 rounded-md border text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{analysis?.title || commit.message}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(commit.date)}</div>
                      </div>
                      {analysis && (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {analysis.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChronoTimeline: React.FC<ChronoTimelineProps> = ({ repositoryName, isLoading = false }) => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [authors, setAuthors] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<TimelinePeriod>('month');
  const [groupBy, setGroupBy] = useState<TimelineGroupBy>('type');
  const [selectedCommit, setSelectedCommit] = useState<CommitRecord | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CommitAnalysisRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(isLoading);
  
  // New state for cluster handling
  const [selectedCluster, setSelectedCluster] = useState<CommitCluster | null>(null);
  const [isClusterDialogOpen, setIsClusterDialogOpen] = useState<boolean>(false);
  const [clusterThreshold, setClusterThreshold] = useState<number>(2); // percentage threshold for clustering

  // Add this to the ChronoTimeline component state
  const [activeView, setActiveView] = useState<'timeline' | 'impact' | 'complexity' | 'focus' | 'semantic'>('timeline');

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
  
  // Create clusters of commits that are close together
  const createCommitClusters = (
    commits: CommitRecord[], 
    analyses: CommitAnalysisRecord[], 
    threshold: number
  ): { 
    singleCommits: { commit: CommitRecord, analysis?: CommitAnalysisRecord, position: number }[],
    clusters: CommitCluster[] 
  } => {
    if (!commits.length) return { singleCommits: [], clusters: [] };
    
    // Sort commits by date
    const sortedCommits = [...commits].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate position for each commit
    const positionedCommits = sortedCommits.map(commit => {
      const commitDate = new Date(commit.date).getTime();
      const timeRange = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      const position = timeRange <= 0 ? 50 : ((commitDate - dateRange.startDate.getTime()) / timeRange) * 100;
      
      // Find matching analysis
      const analysis = analyses.find(a => a.commit_sha === commit.sha);
      
      return {
        commit,
        analysis,
        position: Math.max(0, Math.min(position, 100)) // Constrain between 0-100%
      };
    });
    
    // Group commits that are within the threshold of each other
    const clusters: CommitCluster[] = [];
    const singleCommits: typeof positionedCommits = [];
    
    // Use a sliding window approach to identify clusters
    let currentCluster: typeof positionedCommits = [];
    
    for (let i = 0; i < positionedCommits.length; i++) {
      const current = positionedCommits[i];
      
      if (currentCluster.length === 0) {
        currentCluster.push(current);
        continue;
      }
      
      const prev = currentCluster[currentCluster.length - 1];
      if (Math.abs(current.position - prev.position) <= threshold) {
        // Close enough to be in the same cluster
        currentCluster.push(current);
      } else {
        // Too far, close current cluster and start a new one
        if (currentCluster.length > 1) {
          // Only create clusters for 2+ commits
          clusters.push({
            commits: currentCluster.map(c => c.commit),
            analyses: currentCluster.map(c => c.analysis).filter(Boolean) as CommitAnalysisRecord[],
            position: currentCluster.reduce((sum, c) => sum + c.position, 0) / currentCluster.length,
            count: currentCluster.length
          });
        } else {
          // Single commits get their own representation
          singleCommits.push(...currentCluster);
        }
        
        currentCluster = [current];
      }
    }
    
    // Handle the last cluster
    if (currentCluster.length > 1) {
      clusters.push({
        commits: currentCluster.map(c => c.commit),
        analyses: currentCluster.map(c => c.analysis).filter(Boolean) as CommitAnalysisRecord[],
        position: currentCluster.reduce((sum, c) => sum + c.position, 0) / currentCluster.length,
        count: currentCluster.length
      });
    } else {
      singleCommits.push(...currentCluster);
    }
    
    return { singleCommits, clusters };
  };

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
  
  const handleClusterClick = (cluster: CommitCluster) => {
    setSelectedCluster(cluster);
    setIsClusterDialogOpen(true);
  };

  const handlePeriodChange = (value: string) => {
    setPeriodType(value as TimelinePeriod);
  };

  const handleGroupByChange = (value: string) => {
    setGroupBy(value as TimelineGroupBy);
  };
  
  const handleClusterThresholdChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.5 && numValue <= 10) {
      setClusterThreshold(numValue);
    }
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

          <div className="flex flex-col gap-1 w-24">
            <span className="text-xs text-muted-foreground">Clustering</span>
            <Select 
              value={clusterThreshold.toString()} 
              onValueChange={handleClusterThresholdChange}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">Tight</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="5">Loose</SelectItem>
                <SelectItem value="10">Very Loose</SelectItem>
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

      {/* View Selector Tabs */}
      <div className="mt-6">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span>Code Impact</span>
            </TabsTrigger>
            <TabsTrigger value="complexity" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Complexity</span>
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span>Developer Focus</span>
            </TabsTrigger>
            <TabsTrigger value="semantic" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span>Semantic Analysis</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline">
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
                  {groupKeys.map((group, rowIndex) => {
                    // Get all analyses for this group and their associated commits
                    const groupAnalyses = groups[group];
                    const groupCommits = groupAnalyses
                      .map(analysis => {
                        const commit = timelineData.commits.find(c => c.sha === analysis.commit_sha);
                        return commit ? { commit, analysis } : null;
                      })
                      .filter(Boolean)
                      .map(item => item as { commit: CommitRecord, analysis: CommitAnalysisRecord });
                    
                    // Process clustering for this row
                    const clusteredData = createCommitClusters(
                      groupCommits.map(item => item.commit),
                      groupCommits.map(item => item.analysis),
                      clusterThreshold
                    );
                    
                    return (
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
                          {/* Render individual commits */}
                          {clusteredData.singleCommits.map(({commit, analysis, position}) => (
                            <CommitBar
                              key={commit.sha}
                              commit={commit}
                              analysis={analysis}
                              startDate={dateRange.startDate}
                              endDate={dateRange.endDate}
                              onClick={() => openCommitDetails(commit, analysis)}
                            />
                          ))}
                          
                          {/* Render commit clusters */}
                          {clusteredData.clusters.map((cluster, i) => (
                            <CommitClusterBar
                              key={`cluster-${i}`}
                              cluster={cluster}
                              startDate={dateRange.startDate}
                              endDate={dateRange.endDate}
                              onClusterClick={handleClusterClick}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="impact">
            {timelineData ? (
              <CodeImpactAnalysis commits={timelineData.commits} />
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center space-y-4">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No data available</h3>
                  <p className="text-muted-foreground">Code impact analysis requires commit data.</p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="complexity">
            {timelineData ? (
              <CommitComplexityAnalysis commits={timelineData.commits} analyses={timelineData.analyses} />
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center space-y-4">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No data available</h3>
                  <p className="text-muted-foreground">Complexity analysis requires commit data.</p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="focus">
            {timelineData ? (
              <DeveloperFocusPatterns commits={timelineData.commits} />
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center space-y-4">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No data available</h3>
                  <p className="text-muted-foreground">Developer focus analysis requires commit data.</p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="semantic">
            {timelineData ? (
              <SemanticCommitAnalysis commits={timelineData.commits} analyses={timelineData.analyses} />
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center space-y-4">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No data available</h3>
                  <p className="text-muted-foreground">Semantic analysis requires commit data.</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
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

      {/* Cluster Dialog */}
      <ClusterDialog
        cluster={selectedCluster}
        isOpen={isClusterDialogOpen}
        onClose={() => setIsClusterDialogOpen(false)}
        onCommitClick={openCommitDetails}
      />
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