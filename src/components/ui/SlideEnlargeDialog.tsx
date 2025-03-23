import React from 'react';
import { Dialog, DialogContent } from './dialog';
import { Slide, StudentResponse, MarkdownContent, ImageContent, QuizContent, EquationContent } from '@/types';
import { Button } from './button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { StudentQuizView } from './StudentQuizView';
import { EquationEditor } from './equation';

interface SlideEnlargeDialogProps {
  slide: Slide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnswerSubmit?: (questionId: string, response: StudentResponse) => void;
  studentResponses?: Record<string, StudentResponse>;
}

// Create a standalone content renderer to avoid using SlideViewer
export function SlideEnlargeDialog({
  slide,
  open,
  onOpenChange,
  onAnswerSubmit,
  studentResponses = {}
}: SlideEnlargeDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };
  
  // Render content without using SlideViewer to avoid nesting
  const renderContent = () => {
    if (!slide.content) return null;
    
    switch (slide.content.type) {
      case 'markdown':
        return (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{(slide.content.content as MarkdownContent).text}</ReactMarkdown>
          </div>
        );

      case 'image':
        const imageContent = slide.content.content as ImageContent;
        return (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black/5">
              <img 
                src={imageContent.url} 
                alt={imageContent.caption || ''} 
                className="max-h-[600px] w-full object-contain"
              />
            </div>
            {imageContent.caption && (
              <p className="text-sm text-center text-muted-foreground">
                {imageContent.caption}
              </p>
            )}
            {imageContent.questions?.map((question, index) => (
              <div 
                key={`question-${index}`}
                className="bg-muted/20 p-4 rounded-lg space-y-2"
              >
                <StudentQuizView
                  question={question}
                  onAnswer={(response) => onAnswerSubmit?.(question.id, response)}
                  isAnswered={!!studentResponses[question.id]}
                  previousAnswer={studentResponses[question.id]?.selectedChoice}
                />
              </div>
            ))}
          </div>
        );

      case 'quiz':
        const quizContent = slide.content.content as QuizContent;
        return (
          <div className="space-y-6">
            {quizContent.questions.map((question, index) => (
              <div key={`quiz-${index}`} className="bg-muted/20 p-4 rounded-lg">
                <StudentQuizView
                  question={question}
                  onAnswer={(response) => onAnswerSubmit?.(question.id, response)}
                  isAnswered={!!studentResponses[question.id]}
                  previousAnswer={studentResponses[question.id]?.selectedChoice}
                />
              </div>
            ))}
          </div>
        );

      case 'equation':
        const equationContent = slide.content.content as EquationContent;
        return (
          <div className="space-y-6">
            {equationContent.equations.map((equation, index) => (
              <EquationEditor
                key={`equation-${index}`}
                equation={equation}
                onChange={() => {}}
                preview={true}
              />
            ))}
          </div>
        );

      default:
        return (
          <div className="text-muted-foreground text-center py-8">
            Unsupported content type
          </div>
        );
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[90vh] p-8 overflow-hidden"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
      >
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] flex flex-col bg-white rounded-lg">
          {/* Title */}
          {slide.title && (
            <h2 className="text-2xl font-bold mb-6">
              {slide.title}
            </h2>
          )}

          {/* Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
        
        <div className="absolute bottom-4 right-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            size="sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
