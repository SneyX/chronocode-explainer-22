
import { useState } from "react";
import { Search, MessageSquare, Code, FileCode, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

const CodeExplorer = () => {
  const [activeTab, setActiveTab] = useState<"query" | "result">("query");
  
  const queryExample = `
// Ask about code evolution
What motivated the changes in the authentication system?

// Ask about specific commits
Tell me about the performance optimization in the data fetching logic

// Ask about code structure
How did the project architecture evolve over time?
  `.trim();
  
  const resultExample = `
Based on my analysis of the commit history, the authentication system
underwent several changes motivated by:

1. Security concerns identified during a code review (commit a7f3d2e)
2. User feedback about login flow complexity (commits b8e9f1c, d2c7a0b)
3. Need to support social authentication providers (commit e5f6g7h)

The changes systematically improved security posture while simplifying
the user experience by consolidating authentication routes and
implementing JWT token refresh logic.
  `.trim();

  return (
    <div className="relative glass rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent"></div>
      
      <div className="relative z-10 p-6 md:p-8">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Search className="w-4 h-4 mr-2" />
            <span>Natural Language Queries</span>
          </div>
          <h3 className="text-xl md:text-2xl font-medium mb-3">Ask Questions About Your Code</h3>
          <p className="text-muted-foreground">
            Chronocode understands your project's history and can answer questions about code evolution, developer motivations, and architectural decisions.
          </p>
        </div>
        
        <div className="bg-accent/50 rounded-lg overflow-hidden border">
          <div className="flex border-b">
            <button 
              className={`py-3 px-4 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === "query" 
                  ? "bg-background text-foreground border-r" 
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("query")}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Your Query</span>
            </button>
            <button 
              className={`py-3 px-4 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === "result" 
                  ? "bg-background text-foreground border-l" 
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("result")}
            >
              <FileCode className="w-4 h-4" />
              <span>Chronocode Response</span>
            </button>
          </div>
          
          <div className="p-5">
            <pre className={`text-left text-sm font-mono whitespace-pre-wrap bg-transparent transition-all duration-500 ${
              activeTab === "query" ? "block animate-fade-in" : "hidden"
            }`}>
              <code>{queryExample}</code>
            </pre>
            
            <pre className={`text-left text-sm font-mono whitespace-pre-wrap bg-transparent transition-all duration-500 ${
              activeTab === "result" ? "block animate-fade-in" : "hidden"
            }`}>
              <code>{resultExample}</code>
            </pre>
          </div>
          
          <div className="p-4 border-t bg-background flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Code context is automatically analyzed</span>
            </div>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setActiveTab(activeTab === "query" ? "result" : "query")}
              className="text-xs flex items-center gap-1 h-8"
            >
              <span>View {activeTab === "query" ? "Response" : "Query"}</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeExplorer;
