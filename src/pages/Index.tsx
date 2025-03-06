
import { useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TimelinePreview from "@/components/TimelinePreview";
import CodeExplorer from "@/components/CodeExplorer";
import { Button } from "@/components/ui/button";
import { GitBranch, GitCommit, Code, MessageSquare, Brain, ArrowRight, ChevronRight, Star } from "lucide-react";

const Index = () => {
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-up');
          observer.current?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => {
      observer.current?.observe(el);
    });

    return () => observer.current?.disconnect();
  }, []);

  const features = [
    {
      icon: GitBranch,
      title: "Timeline Visualization",
      description: "Transform commit history into a visual timeline that shows the evolution of your codebase."
    },
    {
      icon: GitCommit,
      title: "Commit Analysis",
      description: "Understand the reasoning and motivation behind each commit and code change."
    },
    {
      icon: Code,
      title: "Code Context",
      description: "Get detailed context about any part of your codebase and its development history."
    },
    {
      icon: MessageSquare,
      title: "Natural Language Queries",
      description: "Ask questions about your code in plain English and get comprehensive answers."
    },
    {
      icon: Brain,
      title: "Developer Intent",
      description: "Uncover the thought process and intent behind code changes and architectural decisions."
    }
  ];

  const testimonials = [
    {
      quote: "Chronocode has completely transformed how our team onboards new developers. Understanding the 'why' behind our code has cut onboarding time in half.",
      author: "Sarah Chen",
      role: "CTO at TechFlow"
    },
    {
      quote: "As a developer who frequently works with legacy code, Chronocode has been invaluable. It's like having the original developers explain their thinking to me.",
      author: "Michael Rodriguez",
      role: "Senior Developer at CodeCraft"
    },
    {
      quote: "The timeline feature provides insights I never thought possible. It's not just about what changed, but why it changed. Game changer for code reviews.",
      author: "Aisha Johnson",
      role: "Lead Engineer at InnovateSoft"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="animate-fade-in mb-6 inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              <GitBranch className="w-4 h-4 mr-2" />
              <span>Understand Code Evolution</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight animate-slide-down mb-6">
              Decode the evolution of your <span className="text-primary">codebase</span>
            </h1>
            
            <p className="text-muted-foreground text-lg md:text-xl animate-slide-up max-w-2xl mb-8">
              Chronocode transforms code changes into natural language, helping you understand the complete development history of any GitHub repository.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-scale-in">
              <Button className="relative overflow-hidden group" size="lg">
                <span className="relative z-10">Get Started for Free</span>
                <span className="absolute inset-0 bg-primary/80 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300"></span>
              </Button>
              
              <Button variant="outline" size="lg" className="group">
                <span>Watch Demo</span>
                <ChevronRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
          
          <div className="mt-16 md:mt-24 max-w-5xl mx-auto opacity-0 animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
            <div className="relative rounded-xl overflow-hidden border shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/10"></div>
              <img 
                src="https://placehold.co/1200x675" 
                alt="Chronocode Interface" 
                className="w-full h-auto rounded-xl relative z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { label: "Repositories Analyzed", value: "100,000+" },
              { label: "Code Commits Processed", value: "15M+" },
              { label: "Developer Time Saved", value: "250,000 hrs" }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="p-5 rounded-lg border bg-card/50 animate-on-scroll opacity-0"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <p className="text-2xl md:text-3xl font-medium">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 px-6" id="features">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-medium mb-6 animate-on-scroll opacity-0">
              Understand Your Code's Journey
            </h2>
            <p className="text-muted-foreground text-lg animate-on-scroll opacity-0">
              Chronocode offers a suite of powerful features designed to help developers understand, explore, and communicate about codebases.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-xl border hover:shadow-md transition-all duration-300 group animate-on-scroll opacity-0 bg-card/50"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="animate-on-scroll opacity-0 mb-16" id="demo">
            <TimelinePreview />
          </div>
          
          <div className="animate-on-scroll opacity-0">
            <CodeExplorer />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 md:py-24 px-6 bg-accent/30">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-medium mb-6 animate-on-scroll opacity-0">
              Trusted by Developers
            </h2>
            <p className="text-muted-foreground text-lg animate-on-scroll opacity-0">
              See what developers are saying about how Chronocode has transformed their understanding of codebases.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="glass p-6 rounded-xl animate-on-scroll opacity-0"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6" id="waitlist">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto glass rounded-xl p-8 md:p-12 relative overflow-hidden animate-on-scroll opacity-0">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50"></div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-medium mb-4">
                Ready to understand your codebase?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Join the Chronocode waitlist to be among the first to experience a new way of understanding code evolution.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button className="h-12 px-8">
                <span>Join Waitlist</span>
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              By joining, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
