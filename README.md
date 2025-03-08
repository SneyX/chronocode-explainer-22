# Welcome to ChronoCode

ChronoCode is an interactive development timeline visualization tool that analyzes GitHub repositories and creates insightful timelines based on commit history.

## Project info

**URL**: https://lovable.dev/projects/7445a6cd-bd04-41a7-9f8c-584a55315c6e

## Features

- Visualize repository development history as a timeline
- Group analysis by commit type, author, or date
- Customize timeline periods (day, week, month, etc.)
- Filter by commit type or author
- View detailed commit analysis

## Setup

The project requires both a frontend (this repository) and a backend server for generating commit analyses. The frontend can display data directly from Supabase even if the backend is not running.

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account - [Sign up for Supabase](https://supabase.com)

### Supabase Setup

1. Create a new Supabase project
2. Create the following tables with the specified columns:

**commits**
- id (uuid, primary key)
- created_at (timestamp with timezone)
- repo_name (text)
- sha (text)
- author (text)
- date (timestamp)
- message (text)
- url (text)
- author_email (text)
- description (text)
- author_url (text)

**commit_analyses**
- id (uuid, primary key)
- created_at (timestamp with timezone)
- repo_name (text)
- title (text)
- idea (text)
- description (text)
- commit_sha (text)
- type (text) - recommended to create an enum with values: FEATURE, DOCS, ISSUE, WARNING, REFACTOR, FIX, TEST, OTHER

3. Create a foreign key relationship between `commit_analyses.commit_sha` and `commits.sha`
4. Copy your Supabase project URL and anon key from the API settings
5. Create a `.env` file based on `.env.example` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_KEY=your_supabase_anon_key_here
```

### Getting Started

Follow these steps to set up the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd chronocode-explainer-22

# Step 3: Install the necessary dependencies
npm i

# Step 4: Create a .env file with your Supabase credentials
cp .env.example .env
# Then edit the .env file with your actual credentials

# Step 5: Start the development server
npm run dev
```

## Technologies Used

- Vite
- TypeScript
- React
- Supabase
- shadcn-ui
- Tailwind CSS
- date-fns

## Backend API

For full functionality, you'll need to run the ChronoCode backend API which handles commit fetching and analysis. The backend repo should be set up with Supabase to store the commit data. 

The backend handles:
1. Fetching repository commits from GitHub
2. Analyzing commits using AI
3. Storing commit data and analyses in Supabase

## Deployment

To deploy this project:

1. Set up the Supabase tables as described above
2. Deploy the frontend to your preferred hosting service (Netlify, Vercel, etc.)
3. Set the environment variables for Supabase in your deployment platform
4. Deploy the backend API separately (FastAPI-based)

## Custom Domain

If you want to deploy your project under your own domain then we recommend using Netlify. Visit the Lovable docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
