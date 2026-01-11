import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollIndicatorProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export function ScrollIndicator({ children, className, maxHeight = "350px" }: ScrollIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrollable = scrollHeight > clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowIndicator(isScrollable && !isAtBottom);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [children]);

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className={cn("overflow-y-auto overflow-x-auto custom-scrollbar", className)}
        style={{ maxHeight }}
      >
        {children}
      </div>
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-12 pointer-events-none transition-opacity duration-300 flex items-end justify-center pb-1",
          "bg-gradient-to-t from-background/90 via-background/50 to-transparent",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex flex-col items-center animate-bounce">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
