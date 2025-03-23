import React from 'react';
import { Slide } from '@/types';
import { Button } from './button';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface SlideCarouselProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  onReorder?: (slides: Slide[]) => void;
}

export function SlideCarousel({
  slides,
  currentSlideIndex,
  onSelect,
  className,
  onReorder
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

  const handleDragEnd = (result: any) => {
    if (!result.destination || !onReorder) return;
    
    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onReorder(items);
    
    // Update scroll position if necessary
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
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
          className="flex-shrink-0 z-10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="slides" direction="horizontal">
            {(provided) => (
              <div 
                ref={(el) => {
                  containerRef.current = el;
                  provided.innerRef(el);
                }}
                className="flex gap-2 overflow-x-hidden scroll-smooth"
                {...provided.droppableProps}
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
                    <Draggable 
                      key={slide.id} 
                      draggableId={slide.id} 
                      index={index}
                      isDragDisabled={!onReorder}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center"
                        >
                          {onReorder && (
                            <div {...provided.dragHandleProps} className="mr-1 cursor-grab">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <Button
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
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleScroll('right')}
          disabled={!containerRef.current || scrollPosition >= containerRef.current.scrollWidth - containerRef.current.clientWidth}
          className="flex-shrink-0 z-10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default SlideCarousel;
