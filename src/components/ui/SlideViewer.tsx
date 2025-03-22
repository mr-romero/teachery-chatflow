
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlideViewerProps {
  slides: string[];
  currentSlide: number;
  onSlideChange?: (slideIndex: number) => void;
  editable?: boolean;
  className?: string;
}

const SlideViewer = ({
  slides,
  currentSlide,
  onSlideChange,
  editable = false,
  className
}: SlideViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate loading
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [currentSlide]);

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

  // Determine file type (simplified)
  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    return 'image';
  };

  return (
    <div className={cn("flex flex-col h-full rounded-lg border overflow-hidden bg-white", className)}>
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
        <h3 className="font-medium">
          Slide {currentSlide + 1} of {slides.length}
        </h3>
        {editable && (
          <div className="text-sm text-muted-foreground">
            Click to upload or replace
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
          <div className="text-center p-4 text-destructive">
            <p>Error loading slide:</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            <p>No slides available</p>
            {editable && <p className="text-sm mt-2">Upload slides to get started</p>}
          </div>
        ) : (
          <>
            {getFileType(slides[currentSlide]) === 'pdf' ? (
              <iframe
                src={`${slides[currentSlide]}#toolbar=0`}
                className="w-full h-full"
                title={`Slide ${currentSlide + 1}`}
              />
            ) : (
              <img
                src={slides[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="max-w-full max-h-full object-contain transition-opacity duration-300"
                onError={() => setError("Failed to load image")}
              />
            )}
          </>
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
