import React from 'react';
import { Slide, MarkdownContent, ImageContent, QuizContent, EquationContent, StudentResponse } from '@/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { EquationEditor } from './equation';
import { StudentQuizView } from './StudentQuizView';

interface SlideViewerProps {
  slides: Slide[];
  currentSlide: number;
  onSlideChange?: (index: number) => void;
  editable?: boolean;
  className?: string;
  onAnswerSubmit?: (questionId: string, response: StudentResponse) => void;
  studentResponses?: Record<string, StudentResponse>;
}

export function SlideViewer({
  slides,
  currentSlide,
  onSlideChange,
  editable = true,
  className,
  onAnswerSubmit,
  studentResponses = {}
}: SlideViewerProps) {
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
            <div className="relative rounded-lg overflow-hidden bg-black/5">
              <img 
                src={imageContent.url} 
                alt={imageContent.caption || ''} 
                className="max-h-[400px] w-full object-contain"
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
      "bg-white rounded-lg border p-6 h-full overflow-y-auto",
      className
    )}>
      {slides.length > 0 ? (
        <>
          {/* Title */}
          {slides[currentSlide]?.title && (
            <h2 className="text-2xl font-bold mb-6">
              {slides[currentSlide].title}
            </h2>
          )}

          {/* Content */}
          {renderContent()}
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No slides yet. Click "Add Slide" to get started.
        </div>
      )}
    </div>
  );
}
