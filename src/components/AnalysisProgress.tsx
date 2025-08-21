import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  duration: number;
  completed: boolean;
}

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  onComplete?: () => void;
}

const getAnalysisSteps = (t: any): AnalysisStep[] => [
  {
    id: "market",
    title: t('analysisProgress.steps.market.title'),
    description: t('analysisProgress.steps.market.desc'),
    duration: 3000,
    completed: false
  },
  {
    id: "feasibility",
    title: t('analysisProgress.steps.feasibility.title'),
    description: t('analysisProgress.steps.feasibility.desc'),
    duration: 2500,
    completed: false
  },
  {
    id: "competition",
    title: t('analysisProgress.steps.competition.title'),
    description: t('analysisProgress.steps.competition.desc'),
    duration: 2000,
    completed: false
  },
  {
    id: "strengths",
    title: t('analysisProgress.steps.strengths.title'),
    description: t('analysisProgress.steps.strengths.desc'),
    duration: 1500,
    completed: false
  },
  {
    id: "weaknesses",
    title: t('analysisProgress.steps.weaknesses.title'),
    description: t('analysisProgress.steps.weaknesses.desc'),
    duration: 1500,
    completed: false
  },
  {
    id: "recommendations",
    title: t('analysisProgress.steps.recommendations.title'),
    description: t('analysisProgress.steps.recommendations.desc'),
    duration: 2000,
    completed: false
  }
];

const AnalysisProgress = ({ isAnalyzing, onComplete }: AnalysisProgressProps) => {
  const { t } = useTranslation();
  const [steps, setSteps] = useState<AnalysisStep[]>(getAnalysisSteps(t));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      // Reset when not analyzing
      setSteps(getAnalysisSteps(t).map(step => ({ ...step, completed: false })));
      setCurrentStepIndex(0);
      setProgress(0);
      return;
    }

    let totalDuration = 0;
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);
        
        // Simulate step processing
        const stepDuration = steps[i].duration;
        const stepStart = Date.now();
        
        while (Date.now() - stepStart < stepDuration) {
          const elapsed = Date.now() - stepStart;
          const stepProgress = (elapsed / stepDuration) * 100;
          const totalProgress = ((i * 100) + stepProgress) / steps.length;
          setProgress(Math.min(totalProgress, 100));
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (!isAnalyzing) return; // Stop if analysis is cancelled
        }
        
        // Mark step as completed
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, completed: true } : step
        ));
        
        totalDuration += stepDuration;
      }
      
      setProgress(100);
      if (onComplete) {
        setTimeout(onComplete, 500);
      }
    };

    processSteps();
  }, [isAnalyzing, onComplete]);

  if (!isAnalyzing) return null;

  return (
    <Card className="shadow-elegant border-border/50">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{t('analysisProgress.title')}</h3>
            <Progress value={progress} className="w-full h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(progress)}% {t('analysisProgress.completed')}
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                  index === currentStepIndex 
                    ? 'bg-primary/10 border border-primary/20' 
                    : step.completed 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-muted/30'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : index === currentStepIndex ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    index === currentStepIndex 
                      ? 'text-primary' 
                      : step.completed 
                        ? 'text-green-700' 
                        : 'text-foreground'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisProgress;