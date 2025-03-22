
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { RefreshCw } from 'lucide-react';

export interface SlideContent {
  type: 'image' | 'pdf' | 'markdown';
  content: string;
  multipleChoice?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  equation?: {
    question: string;
    answer: string;
  };
}

interface SlideViewerProps {
  slides: SlideContent[];
  currentSlide: number;
  onSlideChange?: (slideIndex: number) => void;
  editable?: boolean;
  className?: string;
  onAnswerSubmit?: (isCorrect: boolean) => void;
}

const SlideViewer = ({
  slides,
  currentSlide,
  onSlideChange,
  editable = false,
  className,
  onAnswerSubmit
}: SlideViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Reset loading state and error when slide changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setSelectedAnswer(null);
    setAnswered(false);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentSlide, retryCount]);

  const handlePrevSlide = () => {
    if (currentSlide > 0 && onSlideChange) {
      onSlideChange(currentSlide - 1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlide < slides.length - 1 && onSlideChange) {
      onSlideChange(currentSlide + 1);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
  };

  const handleAnswerSelect = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || answered) return;
    
    const currentSlideContent = slides[currentSlide];
    if (currentSlideContent.multipleChoice) {
      const isCorrect = selectedAnswer === currentSlideContent.multipleChoice.correctAnswer;
      setAnswered(true);
      
      if (onAnswerSubmit) {
        onAnswerSubmit(isCorrect);
      }
    }
  };

  const renderSlideContent = (slide: SlideContent) => {
    switch (slide.type) {
      case 'pdf':
        return (
          <iframe
            src={`${slide.content}#toolbar=0`}
            className="w-full h-full"
            title={`Slide ${currentSlide + 1}`}
            onError={() => setError("Failed to load PDF")}
          />
        );
      case 'image':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={slide.content}
              alt={`Slide ${currentSlide + 1}`}
              className="max-w-full max-h-full object-contain transition-opacity duration-300"
              onError={() => setError("Failed to load image")}
            />
          </div>
        );
      case 'markdown':
        return (
          <div className="w-full h-full overflow-auto p-6 prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{slide.content}</ReactMarkdown>
            
            {slide.multipleChoice && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/20">
                <h3 className="font-medium text-lg mb-3">{slide.multipleChoice.question}</h3>
                <div className="space-y-2">
                  {slide.multipleChoice.options.map((option, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer",
                        selectedAnswer === idx ? "bg-primary/10" : "hover:bg-muted/50",
                        answered && idx === slide.multipleChoice?.correctAnswer && "bg-green-100 border-green-500 border",
                        answered && selectedAnswer === idx && idx !== slide.multipleChoice?.correctAnswer && "bg-red-100 border-red-500 border"
                      )}
                      onClick={() => handleAnswerSelect(idx)}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border",
                        selectedAnswer === idx && !answered && "border-primary"
                      )}>
                        {answered && idx === slide.multipleChoice?.correctAnswer && (
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                        )}
                        {selectedAnswer === idx && !answered && (
                          <div className="w-3 h-3 bg-primary rounded-full" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  ))}
                </div>
                
                {!editable && !answered && selectedAnswer !== null && (
                  <Button onClick={handleAnswerSubmit} className="mt-4">
                    Submit Answer
                  </Button>
                )}
                
                {editable && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Correct answer: Option {slide.multipleChoice.correctAnswer + 1}
                  </div>
                )}
                
                {answered && (
                  <div className={cn(
                    "mt-4 p-3 rounded-lg text-sm",
                    selectedAnswer === slide.multipleChoice.correctAnswer ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {selectedAnswer === slide.multipleChoice.correctAnswer 
                      ? "Correct! Well done." 
                      : `Incorrect. The correct answer is: ${slide.multipleChoice.options[slide.multipleChoice.correctAnswer]}`
                    }
                  </div>
                )}
              </div>
            )}
            
            {slide.equation && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/20">
                <h3 className="font-medium text-lg mb-3">{slide.equation.question}</h3>
                {editable && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <span className="font-medium">Answer Key: </span>
                    {slide.equation.answer}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return <div className="text-muted-foreground">Unsupported content type</div>;
    }
  };

  return (
    <div className={cn("flex flex-col h-full rounded-lg border overflow-hidden bg-white", className)}>
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
        <h3 className="font-medium">
          Slide {currentSlide + 1} of {slides.length}
        </h3>
        {editable && (
          <div className="text-sm text-muted-foreground">
            Click to edit
          </div>
        )}
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-zinc-50 relative overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <div className="text-sm text-muted-foreground">Loading slide...</div>
          </div>
        ) : error ? (
          <div className="text-center p-4">
            <div className="text-destructive mb-4">{error}</div>
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Loading
            </Button>
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            <p>No slides available</p>
            {editable && <p className="text-sm mt-2">Upload slides to get started</p>}
          </div>
        ) : (
          renderSlideContent(slides[currentSlide])
        )}
      </div>
      
      <div className="p-4 border-t flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevSlide}
          disabled={currentSlide === 0 || !onSlideChange || slides.length === 0}
        >
          Previous
        </Button>
        
        <div className="flex gap-1">
          {slides.length > 0 && [...Array(slides.length)].map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentSlide === index 
                  ? "bg-primary scale-125" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              onClick={() => onSlideChange && onSlideChange(index)}
              disabled={!onSlideChange}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          onClick={handleNextSlide}
          disabled={currentSlide === slides.length - 1 || !onSlideChange || slides.length === 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default SlideViewer;
