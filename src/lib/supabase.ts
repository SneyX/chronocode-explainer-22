import { createClient } from '@supabase/supabase-js';

// These should be set in your .env file
// If environment variables aren't available, use these fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://hdsvnvynqrkuqpjdathj.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkc3ZudnlucXJrdXFwamRhdGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMDg5OTAsImV4cCI6MjA1NTU4NDk5MH0.SPwd6UMuPayyAsIBsJ7P9-3sEX52SWXJnafBgydgGZ4";

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables or fallbacks.');
} else {
  console.log('Supabase client initialized with configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Define types based on your database schema
export interface CommitRecord {
  id?: string;
  created_at?: string;
  repo_name: string;
  sha: string;
  author: string;
  date: string;
  message: string;
  url?: string;
  author_email: string;
  description?: string;
  author_url?: string;
}

export interface CommitAnalysisRecord {
  id?: string;
  created_at?: string;
  repo_name: string;
  title: string;
  idea?: string;
  description?: string;
  commit_sha: string;
  type: 'FEATURE' | 'DOCS' | 'ISSUE' | 'WARNING' | 'REFACTOR' | 'FIX' | 'TEST' | 'OTHER';
}

export type TimelinePeriod = 'day' | 'week' | 'two_weeks' | 'month' | 'quarter' | 'year';
export type TimelineGroupBy = 'type' | 'author' | 'date'; 