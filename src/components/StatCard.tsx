import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  isSolid?: boolean;
  isMesh?: boolean;
  className?: string;
}

// Modern StatCard with dynamic mesh gradients and Inter Regular 400
export function StatCard({ title, value, icon, trend, variant = 'default', isSolid = false, isMesh = false, className }: StatCardProps) {
  const variantStyles = {
    default: isMesh 
      ? 'text-white border-white/20' 
      : isSolid ? 'bg-primary text-primary-foreground border-primary/20 shadow-lg shadow-primary/20' : 'border-border bg-card shadow-sm',
    success: isMesh
      ? 'text-white border-white/20'
      : isSolid ? 'bg-success text-success-foreground border-success/20 shadow-lg shadow-success/20' : 'border-success/20 bg-success/[0.03] shadow-sm',
    warning: isMesh
      ? 'text-white border-white/20'
      : isSolid ? 'bg-warning text-warning-foreground border-warning/20 shadow-lg shadow-warning/20' : 'border-warning/20 bg-warning/[0.03] shadow-sm',
    destructive: isMesh
      ? 'text-white border-white/20'
      : isSolid ? 'bg-destructive text-destructive-foreground border-destructive/20 shadow-lg shadow-destructive/20' : 'border-destructive/20 bg-destructive/[0.03] shadow-sm',
  };

    const meshGradients = {
      default: 'from-blue-600 via-indigo-600 to-violet-600',
      success: 'from-emerald-600 via-emerald-500 to-teal-400',
      warning: 'from-amber-400 via-orange-500 to-rose-500',
      destructive: 'from-red-600 via-red-500 to-rose-400',
    };

  const accentColors = {
    default: (isSolid || isMesh) ? 'from-white/20 via-transparent to-transparent' : 'from-primary/10 via-transparent to-transparent',
    success: (isSolid || isMesh) ? 'from-white/20 via-transparent to-transparent' : 'from-success/10 via-transparent to-transparent',
    warning: (isSolid || isMesh) ? 'from-white/20 via-transparent to-transparent' : 'from-warning/10 via-transparent to-transparent',
    destructive: (isSolid || isMesh) ? 'from-white/20 via-transparent to-transparent' : 'from-destructive/10 via-transparent to-transparent',
  };

  const iconStyles = {
    default: (isSolid || isMesh) ? 'text-white bg-white/20 border-white/20' : 'text-primary bg-primary/10 border-primary/20',
    success: (isSolid || isMesh) ? 'text-white bg-white/20 border-white/20' : 'text-success bg-success/10 border-success/20',
    warning: (isSolid || isMesh) ? 'text-white bg-white/20 border-white/20' : 'text-warning bg-warning/10 border-warning/20',
    destructive: (isSolid || isMesh) ? 'text-white bg-white/20 border-white/20' : 'text-destructive bg-destructive/10 border-destructive/20',
  };

  return (
    <Card
      className={cn(
        "group relative rounded-2xl border transition-all duration-500 overflow-hidden",
        "hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
        variantStyles[variant],
        isMesh && "border-none shadow-xl",
        className
      )}
    >
      {/* Mesh Gradient Background */}
      {isMesh && (
        <div className={cn(
          "absolute inset-0 transition-transform duration-700 group-hover:scale-110",
          "bg-gradient-to-br",
          meshGradients[variant]
        )}>
          {/* Animated Mesh Blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-white/20 blur-[60px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-black/10 blur-[50px] animate-pulse delay-700" />
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-[40px] animate-bounce duration-[10s]" />
        </div>
      )}

      {/* Modern Background Elements */}
      {!isMesh && (
        <div className={cn(
          "absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl opacity-20 transition-all duration-500 group-hover:scale-150 group-hover:opacity-30",
          accentColors[variant]
        )} />
      )}
      
      {/* Subtle Mesh/Grid Pattern Overlay */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        isMesh ? "opacity-[0.07]" : "opacity-[0.03]"
      )} 
        style={{ 
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} 
      />

      <CardContent className="relative p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "p-1 sm:p-1.5 rounded-lg border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0",
              iconStyles[variant]
            )}>
              <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                {icon}
              </div>
            </div>
            
              <p className={cn(
                "text-[7px] sm:text-[9px] font-normal uppercase tracking-[0.15em] leading-none truncate transition-opacity",
                isMesh ? "text-white/80 group-hover:text-white" : "text-muted-foreground opacity-80 group-hover:opacity-100"
              )}>
                {title}
              </p>
            </div>
            
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-[7px] sm:text-[9px] font-normal px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full border backdrop-blur-sm shrink-0",
                  isMesh 
                    ? "text-white border-white/20 bg-white/10"
                    : trend.isPositive 
                      ? "text-primary border-primary/20 bg-primary/5" 
                      : "text-destructive border-destructive/20 bg-destructive/5"
                )}
              >
                <span className="text-[9px] sm:text-[11px] font-normal">{trend.isPositive ? "↑" : "↓"}</span>
                {trend.value}%
              </div>
            )}
          </div>
  
          <div>
            <p className={cn(
              "text-lg sm:text-2xl font-normal tracking-tight leading-tight",
              isMesh ? "text-white" : "text-foreground"
            )}>
              {value}
            </p>
          </div>
      </CardContent>
    </Card>
  );
}
