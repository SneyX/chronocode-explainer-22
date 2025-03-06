
import { useState, useRef, useEffect } from "react";
import { GitBranch, GitCommit, Code, MessageSquare, Search, Clock } from "lucide-react";

const TimelinePreview = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const timelinePoints = [
    {
      title: "Initial Commit",
      description: "First setup of the project with basic configuration files and dependencies.",
      icon: GitCommit,
      date: "2 weeks ago"
    },
    {
      title: "Feature Implementation",
      description: "Added user authentication and profile management functionality.",
      icon: Code,
      date: "10 days ago"
    },
    {
      title: "Bug Fix",
      description: "Fixed validation errors in the registration form submissions.",
      icon: GitBranch,
      date: "7 days ago"
    },
    {
      title: "UI Enhancement",
      description: "Redesigned dashboard interface for improved user experience.",
      icon: MessageSquare,
      date: "4 days ago"
    },
    {
      title: "Performance Optimization",
      description: "Refactored data fetching logic to reduce loading times by 40%.",
      icon: Search,
      date: "2 days ago"
    }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % timelinePoints.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [timelinePoints.length]);
  
  useEffect(() => {
    if (timelineRef.current) {
      const activeDot = timelineRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeDot) {
        activeDot.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    }
  }, [activeIndex]);

  return (
    <div className="relative glass rounded-xl p-6 md:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent"></div>
      
      <div className="relative z-10">
        <div className="mb-8 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Clock className="w-4 h-4 mr-2" />
            <span>Timeline View</span>
          </div>
          <h3 className="text-xl md:text-2xl font-medium mb-3">Commit History Visualization</h3>
          <p className="text-muted-foreground">
            Chronocode transforms complex code changes into clear, understandable timelines that reveal the evolution of your project.
          </p>
        </div>
        
        <div className="relative pt-8 pb-4 overflow-x-auto scrollbar-none" ref={timelineRef}>
          <div className="absolute h-0.5 top-14 left-0 right-0 bg-muted">
            <div 
              className="absolute h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ 
                width: `${100 / timelinePoints.length}%`,
                left: `${(activeIndex * 100) / timelinePoints.length}%`
              }}
            ></div>
          </div>
          
          <div className="flex justify-between min-w-max">
            {timelinePoints.map((point, index) => (
              <div 
                key={index} 
                className="px-8 cursor-pointer"
                onClick={() => setActiveIndex(index)}
                data-index={index}
              >
                <div className={`flex flex-col items-center transition-all duration-300 ${
                  activeIndex === index 
                    ? "opacity-100 transform translate-y-0" 
                    : "opacity-50 transform translate-y-2"
                }`}>
                  <div 
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                      activeIndex === index
                        ? "bg-primary text-white animate-timeline-pulse"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <point.icon className="w-4 h-4" />
                  </div>
                  <div className={`mt-8 transition-opacity duration-300 max-w-[160px] ${
                    activeIndex === index ? "opacity-100" : "opacity-0"
                  }`}>
                    <p className="font-medium text-foreground text-sm">{point.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{point.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="min-h-[120px] mt-6 p-6 bg-accent/50 rounded-lg">
          <p className="text-muted-foreground italic text-sm md:text-base">
            "{timelinePoints[activeIndex].description}"
          </p>
          
          <div className="mt-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <GitCommit className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs font-medium">Developer motivation analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelinePreview;
