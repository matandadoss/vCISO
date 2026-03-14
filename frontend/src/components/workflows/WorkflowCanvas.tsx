import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
}

interface WorkflowCanvasProps {
  title: string;
  description: string;
  steps: WorkflowStep[];
  activeStepId: string;
  onStepClick: (stepId: string) => void;
  className?: string;
  icon?: React.ElementType;
}

export function WorkflowCanvas({
  title,
  description,
  steps,
  activeStepId,
  onStepClick,
  className,
  icon: Icon
}: WorkflowCanvasProps) {
  const activeIndex = steps.findIndex((s) => s.id === activeStepId);

  return (
    <div className={cn("bg-card border border-border rounded-xl p-6 shadow-sm", className)}>
      <div className="flex items-start gap-4 mb-8">
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <div className="relative">
        {/* Connecting Line Backdrop */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 rounded-full hidden md:block" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <div 
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex-1 flex flex-row md:flex-col items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border md:border-none",
                  isActive 
                    ? "bg-primary/5 md:bg-transparent border-primary/30 md:scale-105" 
                    : "bg-background md:bg-transparent border-border hover:bg-muted/50"
                )}
              >
                {/* Status Indicator */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors",
                  isActive ? "border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]" :
                  isCompleted ? "border-primary bg-primary/10 text-primary" :
                  "border-muted bg-card text-muted-foreground"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-semibold">{idx + 1}</span>}
                </div>

                {/* Step Content */}
                <div className="flex flex-col items-start md:items-center text-left md:text-center min-w-0">
                  <span className={cn(
                    "font-semibold text-sm truncate w-full",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-xs text-muted-foreground truncate w-full mt-0.5 hidden md:block">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
