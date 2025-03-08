import { CommitRecord, CommitAnalysisRecord } from '@/lib/supabase';

// API base URL - change this to your FastAPI server URL
const API_BASE_URL = 'http://localhost:8000';

// Types for API requests and responses
interface RepositoryRequest {
  repo_url: string;
  access_token?: string;
}

export interface ApiTimelineResponse {
  repositoryName: string;
  commits: any[];
}

// API service
export const apiService = {
  /**
   * Get all commits from a repository
   */
  async getCommits(repoUrl: string, accessToken?: string): Promise<CommitRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          access_token: accessToken,
        } as RepositoryRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch commits');
      }

      // The API might return data in a different format, so we convert it
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id || item.sha,
        repo_name: item.repository_name || item.repo_name,
        sha: item.sha,
        author: item.author,
        date: item.date,
        message: item.message || item.title,
        url: item.url,
        author_email: item.author_email,
        description: item.description,
        author_url: item.author_url
      }));
    } catch (error) {
      console.error('Error fetching commits:', error);
      throw error;
    }
  },

  /**
   * Generate a timeline for a repository
   */
  async generateTimeline(repoUrl: string, accessToken?: string): Promise<ApiTimelineResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/timeline-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          access_token: accessToken,
        } as RepositoryRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate timeline');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating timeline:', error);
      throw error;
    }
  },

  /**
   * Get repository information
   */
  async getRepositoryInfo(owner: string, repo: string, accessToken?: string): Promise<any> {
    try {
      const url = `${API_BASE_URL}/api/repository/${owner}/${repo}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch repository info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repository info:', error);
      throw error;
    }
  },

}; 