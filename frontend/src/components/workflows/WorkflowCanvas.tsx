import React from "react";
import { LucideIcon } from "lucide-react";

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
}

export interface WorkflowCanvasProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  steps: WorkflowStep[];
  activeStepId: string;
  onStepClick: (stepId: string) => void;
}

export function WorkflowCanvas({ 
  title, 
  description, 
  icon: Icon, 
  steps, 
  activeStepId, 
  onStepClick 
}: WorkflowCanvasProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start gap-4 mb-8">
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
         {steps.map((step) => (
           <button 
              key={step.id} 
              onClick={() => onStepClick(step.id)}
              className={`px-4 py-2 border rounded-md text-sm transition-colors $\\{activeStepId === step.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-foreground border-border'\\}`}
           >
              {step.label}
           </button>
         ))}
      </div>
    </div>
  );
}
