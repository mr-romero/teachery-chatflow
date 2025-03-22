import React from 'react';
import { Slide } from '@/types';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideCarouselProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function SlideCarousel({
  slides,
  currentSlideIndex,
  onSelect,
  className
}: SlideCarouselProps) {
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;

    const scrollAmount = 200;
    const newPosition = direction === 'left'
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(
          containerRef.current.scrollWidth - containerRef.current.clientWidth,
          scrollPosition + scrollAmount
        );
    
    setScrollPosition(newPosition);
    containerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  return (
    <div 
      className={cn(
        "relative group bg-background border rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleScroll('left')}
          disabled={scrollPosition === 0}
          className="flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div 
          ref={containerRef}
          className="flex gap-2 overflow-x-hidden scroll-smooth"
        >
          {slides.map((slide, index) => {
            // Generate preview text based on content type
            let preview = '';
            switch (slide.content.type) {
              case 'markdown':
                preview = slide.content.content.text.slice(0, 50) + '...';
                break;
              case 'image':
                preview = 'Image' + (slide.content.content.caption ? `: ${slide.content.content.caption}` : '');
                break;
              case 'quiz':
                preview = `Quiz (${slide.content.content.questions.length} questions)`;
                break;
              case 'equation':
                preview = 'Equation';
                break;
            }

            return (
              <Button
                key={slide.id}
                variant={currentSlideIndex === index ? "default" : "outline"}
                onClick={() => onSelect(index)}
                className={cn(
                  "min-w-[200px] h-24 flex-shrink-0",
                  "flex flex-col items-start justify-start p-3 gap-1",
                  "text-left"
                )}
              >
                <div className="text-xs font-semibold">
                  Slide {index + 1}
                </div>
                {slide.title && (
                  <div className="text-sm font-medium truncate w-full">
                    {slide.title}
                  </div>
                )}
                <div className="text-xs text-muted-foreground truncate w-full">
                  {preview}
                </div>
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleScroll('right')}
          disabled={!containerRef.current || scrollPosition >= containerRef.current.scrollWidth - containerRef.current.clientWidth}
          className="flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default SlideCarousel;
