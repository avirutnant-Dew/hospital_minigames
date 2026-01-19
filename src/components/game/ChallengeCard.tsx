import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star, Shield, Heart, Timer, CheckCircle, XCircle } from "lucide-react";

interface ChallengeCardProps {
  question: {
    id: string;
    category: string;
    question: string;
    options: string[];
    correct_answer: string;
    points: number;
  };
  onAnswer: (isCorrect: boolean, points: number) => void;
  timeLimit?: number;
}

export function ChallengeCard({ question, onAnswer, timeLimit = 30 }: ChallengeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isFlipped || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFlipped, showResult]);

  const handleTimeout = () => {
    setShowResult(true);
    onAnswer(false, 0);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer || showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === question.correct_answer;
    onAnswer(isCorrect, isCorrect ? question.points : 0);
  };

  const getCategoryIcon = () => {
    switch (question.category) {
      case "GROW_PLUS":
        return <Star className="w-8 h-8 text-strategy-grow" />;
      case "SAFE_ACT":
        return <Shield className="w-8 h-8 text-strategy-safe" />;
      case "PRO_CARE":
        return <Heart className="w-8 h-8 text-strategy-care" />;
      default:
        return null;
    }
  };

  const getCategoryColor = () => {
    switch (question.category) {
      case "GROW_PLUS":
        return "from-strategy-grow/20 to-strategy-grow/5 border-strategy-grow/50";
      case "SAFE_ACT":
        return "from-strategy-safe/20 to-strategy-safe/5 border-strategy-safe/50";
      case "PRO_CARE":
        return "from-strategy-care/20 to-strategy-care/5 border-strategy-care/50";
      default:
        return "";
    }
  };

  return (
    <div className="perspective-1000 w-full max-w-2xl mx-auto">
      <div
        className={cn(
          "relative w-full min-h-[400px] transition-transform duration-700 transform-style-preserve-3d cursor-pointer",
          isFlipped && "rotate-y-180"
        )}
        onClick={() => !isFlipped && setIsFlipped(true)}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Card Front */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-2xl border-2 p-8",
            "bg-gradient-to-br from-primary/30 to-accent/20 border-primary/50",
            "flex flex-col items-center justify-center gap-6"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-6xl animate-bounce-soft">🎯</div>
          <h3 className="text-2xl font-display font-bold text-center">
            Challenge Card
          </h3>
          <p className="text-muted-foreground">คลิกเพื่อเปิดการ์ด</p>
          <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
            +{question.points} คะแนน
          </div>
        </div>

        {/* Card Back (Question) */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl border-2 p-6",
            "bg-gradient-to-br",
            getCategoryColor(),
            "flex flex-col"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getCategoryIcon()}
              <span className="font-display font-semibold">
                {question.category.replace("_", " ")}
              </span>
            </div>
            
            {/* Timer */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full",
                timeLeft <= 10 ? "bg-destructive/20 text-destructive" : "bg-muted"
              )}
            >
              <Timer className="w-4 h-4" />
              <span className="font-display font-bold">{timeLeft}s</span>
            </div>
          </div>

          {/* Question */}
          <h3 className="text-xl font-semibold mb-6 flex-grow flex items-center">
            {question.question}
          </h3>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.correct_answer;
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(option);
                  }}
                  disabled={showResult}
                  className={cn(
                    "h-auto py-4 px-4 text-left justify-start whitespace-normal",
                    showResult && isCorrect && "bg-strategy-grow/30 border-strategy-grow text-strategy-grow",
                    showResult && isSelected && !isCorrect && "bg-destructive/30 border-destructive text-destructive"
                  )}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                  {showResult && isCorrect && <CheckCircle className="w-5 h-5 ml-auto" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 ml-auto" />}
                </Button>
              );
            })}
          </div>

          {/* Result */}
          {showResult && (
            <div className={cn(
              "mt-4 p-4 rounded-lg text-center font-display font-bold text-lg",
              selectedAnswer === question.correct_answer
                ? "bg-strategy-grow/20 text-strategy-grow"
                : "bg-destructive/20 text-destructive"
            )}>
              {selectedAnswer === question.correct_answer
                ? `🎉 ถูกต้อง! +${question.points} คะแนน`
                : "❌ ผิด! เสียใจด้วย"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
