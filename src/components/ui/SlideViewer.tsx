import React from 'react';
import { Slide, MarkdownContent, ImageContent, QuizContent, EquationContent, StudentResponse } from '@/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { EquationEditor } from './equation';
import { StudentQuizView } from './StudentQuizView';
import { SlideEnlargeDialog } from './SlideEnlargeDialog';

interface SlideViewerProps {
  slides: Slide[];
  currentSlide: number;
  onSlideChange?: (index: number) => void;
  editable?: boolean;
  className?: string;
  onAnswerSubmit?: (questionId: string, response: StudentResponse) => void;
  studentResponses?: Record<string, StudentResponse>;
  canEnlarge?: boolean;
}

export function SlideViewer({
  slides,
  currentSlide,
  onSlideChange,
  editable = true,
  className,
  onAnswerSubmit,
  studentResponses = {},
  canEnlarge = false
}: SlideViewerProps) {
  const [enlargedSlide, setEnlargedSlide] = React.useState<boolean>(false);
  const currentContent = slides[currentSlide]?.content;

  const renderContent = () => {
    if (!currentContent) return null;

    switch (currentContent.type) {
      case 'markdown':
        return (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{(currentContent.content as MarkdownContent).text}</ReactMarkdown>
          </div>
        );

      case 'image':
        const imageContent = currentContent.content as ImageContent;
        return (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black/5 flex justify-center items-center min-h-[200px]">
              {imageContent.url ? (
                <img 
                  src={imageContent.url} 
                  alt={imageContent.caption || 'Slide image'} 
                  className="max-h-[400px] max-w-full object-contain"
                  onError={(e) => {
                    console.error("Image failed to load:", imageContent.url);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgOUgxMVYxMUgxM1Y5WiIgZmlsbD0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTEzIDEzSDExVjE3SDEzVjEzWiIgZmlsbD0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTEyIDIwQzE2LjQxODMgMjAgMjAgMTYuNDE4MyAyMCAxMkMyMCA3LjU4MTcyIDE2LjQxODMgNCAxMiA0QzcuNTgxNzIgNCA0IDcuNTgxNzIgNCAxMkM0IDE2LjQxODMgNy41ODE3MiAyMCAxMiAyMFpNMTIgMjJDNi40NzcxNyAyMiAyIDE3LjUyMjggMiAxMkMyIDYuNDc3MTcgNi40NzcxNyAyIDEyIDJDMTcuNTIyOCAyMiAyMiA2LjQ3NzE3IDIyIDEyQzIyIDE3LjUyMjggMTcuNTIyOCAyMiAxMiAyMloiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==';
                    e.currentTarget.alt = 'Failed to load image';
                    e.currentTarget.className = 'max-h-[400px] max-w-full object-contain opacity-40';
                  }}
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center p-4">
                  <span>Image not available</span>
                </div>
              )}
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
                {editable ? (
                  <>
                    <h4 className="font-medium">{question.question}</h4>
                    <div className="space-y-1">
                      {question.choices.map((choice, idx) => (
                        <div key={`choice-${idx}`} className="flex items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center",
                            choice.isCorrect && "bg-green-500 border-green-500 text-white"
                          )}>
                            {choice.label || String.fromCharCode(65 + idx)}
                          </div>
                          <span>{choice.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <StudentQuizView
                    question={question}
                    onAnswer={(response) => onAnswerSubmit?.(question.id, response)}
                    isAnswered={!!studentResponses[question.id]}
                    previousAnswer={studentResponses[question.id]?.selectedChoice}
                  />
                )}
              </div>
            ))}
          </div>
        );

      case 'quiz':
        const quizContent = currentContent.content as QuizContent;
        return (
          <div className="space-y-6">
            {quizContent.questions.map((question, index) => (
              <div key={`quiz-${index}`} className="bg-muted/20 p-4 rounded-lg">
                {editable ? (
                  <>
                    <h4 className="font-medium mb-4">{question.question}</h4>
                    <div className="space-y-2">
                      {question.choices.map((choice, idx) => (
                        <div key={`quiz-choice-${idx}`} className="flex items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center",
                            choice.isCorrect && "bg-green-500 border-green-500 text-white"
                          )}>
                            {choice.label || String.fromCharCode(65 + idx)}
                          </div>
                          <span>{choice.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <StudentQuizView
                    question={question}
                    onAnswer={(response) => onAnswerSubmit?.(question.id, response)}
                    isAnswered={!!studentResponses[question.id]}
                    previousAnswer={studentResponses[question.id]?.selectedChoice}
                  />
                )}
              </div>
            ))}
          </div>
        );

      case 'equation':
        const equationContent = currentContent.content as EquationContent;
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
    <div className={cn(
      "bg-white rounded-lg border overflow-y-auto",
      "flex flex-col", // Add flex layout for better space utilization
      "h-full w-full", // Ensure it takes full height and width
      canEnlarge && "cursor-pointer hover:bg-gray-50/50 transition-colors",
      !canEnlarge ? "p-6" : "p-0", // Padding adjustment
      className
    )} onClick={canEnlarge ? () => setEnlargedSlide(true) : undefined}>
      {slides.length > 0 ? (
        <div className="flex-1 flex flex-col w-full">
          {/* Title */}
          {slides[currentSlide]?.title && (
            <h2 className="text-2xl font-bold mb-6">
              {slides[currentSlide].title}
            </h2>
          )}

          {/* Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full text-muted-foreground">
          No slides yet. Click "Add Slide" to get started.
        </div>
      )}

      {/* Enlarged Slide Dialog */}
      {canEnlarge && (
        <SlideEnlargeDialog
          slide={slides[currentSlide]}
          open={enlargedSlide}
          onOpenChange={setEnlargedSlide}
          onAnswerSubmit={onAnswerSubmit}
          studentResponses={studentResponses}
        />
      )}
    </div>
  );
}
