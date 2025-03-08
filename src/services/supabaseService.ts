import { supabase, CommitRecord, CommitAnalysisRecord, TimelinePeriod, TimelineGroupBy } from '@/lib/supabase';

/**
 * Fetch commits from Supabase for a specific repository
 */
export const fetchCommits = async (repoName: string): Promise<CommitRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('commits')
      .select('*')
      .eq('repo_name', repoName)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching commits:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchCommits:', error);
    throw error;
  }
};

/**
 * Fetch commit analyses from Supabase for a specific repository
 */
export const fetchCommitAnalyses = async (
  repoName: string,
  filters?: {
    type?: string;
    author?: string;
  }
): Promise<CommitAnalysisRecord[]> => {
  try {
    let query = supabase
      .from('commit_analyses')
      .select('*, commits!inner(*)')
      .eq('repo_name', repoName);

    // Apply filters if provided
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.author) {
      query = query.eq('commits.author', filters.author);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching commit analyses:', error);
      throw error;
    }

    // Process the data to extract just what we need
    const processedData = data.map(item => ({
      id: item.id,
      created_at: item.created_at,
      repo_name: item.repo_name,
      title: item.title,
      idea: item.idea,
      description: item.description,
      commit_sha: item.commit_sha,
      type: item.type
    }));

    return processedData || [];
  } catch (error) {
    console.error('Error in fetchCommitAnalyses:', error);
    throw error;
  }
};

/**
 * Get a list of unique authors from commits for a repository
 */
export const fetchUniqueAuthors = async (repoName: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('commits')
      .select('author')
      .eq('repo_name', repoName)
      .order('author');

    if (error) {
      console.error('Error fetching authors:', error);
      throw error;
    }

    // Extract unique authors
    const authors = [...new Set(data.map(item => item.author))];
    return authors;
  } catch (error) {
    console.error('Error in fetchUniqueAuthors:', error);
    throw error;
  }
};

/**
 * Get a list of unique types from commit analyses for a repository
 */
export const fetchUniqueTypes = async (repoName: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('commit_analyses')
      .select('type')
      .eq('repo_name', repoName)
      .order('type');

    if (error) {
      console.error('Error fetching types:', error);
      throw error;
    }

    // Extract unique types
    const types = [...new Set(data.map(item => item.type))];
    return types;
  } catch (error) {
    console.error('Error in fetchUniqueTypes:', error);
    throw error;
  }
};

/**
 * Organize a list of commits by their dates into time periods
 */
export const groupCommitsByPeriod = (commits: CommitRecord[], period: TimelinePeriod) => {
  const periods: Record<string, CommitRecord[]> = {};
  
  // Helper function to get period key based on date
  const getPeriodKey = (date: string): string => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    switch (period) {
      case 'day':
        return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      case 'week':
        // Get the start of week (Sunday)
        const dayOfWeek = dateObj.getDay();
        const diffToStartOfWeek = dayOfWeek * 24 * 60 * 60 * 1000;
        const startOfWeek = new Date(dateObj.getTime() - diffToStartOfWeek);
        return `${startOfWeek.getFullYear()}-${(startOfWeek.getMonth() + 1).toString().padStart(2, '0')}-${startOfWeek.getDate().toString().padStart(2, '0')}`;
      case 'two_weeks':
        // Get the week number in the year, then group by pairs
        const twoWeekNum = Math.floor(getWeekNumber(dateObj) / 2);
        return `${year}-W${twoWeekNum * 2}`;
      case 'month':
        return `${year}-${(month + 1).toString().padStart(2, '0')}`;
      case 'quarter':
        const quarter = Math.floor(month / 3) + 1;
        return `${year}-Q${quarter}`;
      case 'year':
        return `${year}`;
      default:
        return `${year}-${(month + 1).toString().padStart(2, '0')}`;
    }
  };

  // Group commits by period
  for (const commit of commits) {
    const periodKey = getPeriodKey(commit.date);
    if (!periods[periodKey]) {
      periods[periodKey] = [];
    }
    periods[periodKey].push(commit);
  }

  return periods;
};

/**
 * Helper function to get week number in a year
 */
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Organize commit analyses by their type or other grouping criteria
 */
export const groupCommitAnalyses = (
  analyses: CommitAnalysisRecord[],
  commits: CommitRecord[],
  groupBy: TimelineGroupBy
): Record<string, CommitAnalysisRecord[]> => {
  const groups: Record<string, CommitAnalysisRecord[]> = {};
  
  // Create a map of commits by sha for quick lookup
  const commitsBySha = commits.reduce((acc, commit) => {
    acc[commit.sha] = commit;
    return acc;
  }, {} as Record<string, CommitRecord>);
  
  for (const analysis of analyses) {
    let groupKey: string;
    
    switch (groupBy) {
      case 'type':
        groupKey = analysis.type;
        break;
      case 'author':
        // Find the corresponding commit to get the author
        const commit = commitsBySha[analysis.commit_sha];
        groupKey = commit?.author || 'Unknown';
        break;
      case 'date':
        // Group by month-year for date grouping
        const commit2 = commitsBySha[analysis.commit_sha];
        if (commit2) {
          const date = new Date(commit2.date);
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else {
          groupKey = 'Unknown';
        }
        break;
      default:
        groupKey = analysis.type;
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(analysis);
  }
  
  return groups;
}; 