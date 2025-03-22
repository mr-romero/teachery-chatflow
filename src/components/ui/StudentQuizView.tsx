import React from 'react';
import { MultipleChoice, StudentResponse } from '@/types';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { EquationEditor } from './equation';

interface StudentQuizViewProps {
  question: MultipleChoice;
  onAnswer: (response: StudentResponse) => void;
  isAnswered?: boolean;
  previousAnswer?: string;
}

export function StudentQuizView({
  question,
  onAnswer,
  isAnswered,
  previousAnswer
}: StudentQuizViewProps) {
  const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null);
  const [latexAnswer, setLatexAnswer] = React.useState('');

  const handleSubmit = () => {
    if (question.latexAnswer) {
      // Handle LaTeX answer submission
      const isCorrect = latexAnswer.trim() === question.latexAnswer.trim();
      onAnswer({
        answer: latexAnswer,
        isCorrect,
        timestamp: Date.now(),
        latexAnswer
      });
    } else if (selectedChoice) {
      // Handle multiple choice submission
      const selected = question.choices.find(c => c.label === selectedChoice || c.id === selectedChoice);
      if (selected) {
        onAnswer({
          answer: selected.text,
          isCorrect: selected.isCorrect,
          timestamp: Date.now(),
          selectedChoice: selected.label || selected.id
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="font-medium text-lg">{question.question}</div>

      {question.latexAnswer ? (
        // LaTeX answer input
        <div className="space-y-4">
          <EquationEditor
            equation={{
              latex: latexAnswer,
              displayMode: true
            }}
            onChange={(eq) => setLatexAnswer(eq.latex)}
            preview={false}
          />
          <Button 
            onClick={handleSubmit}
            disabled={!latexAnswer.trim() || isAnswered}
          >
            Submit Answer
          </Button>
        </div>
      ) : (
        // Multiple choice view
        <div className="space-y-4">
          <div className="grid gap-2">
            {question.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => !isAnswered && setSelectedChoice(choice.label || choice.id)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border text-left",
                  "transition-colors hover:bg-muted/50",
                  selectedChoice === (choice.label || choice.id) && "border-primary",
                  isAnswered && choice.isCorrect && "bg-green-50 border-green-500",
                  isAnswered && 
                  previousAnswer === (choice.label || choice.id) && 
                  !choice.isCorrect && "bg-red-50 border-red-500",
                  isAnswered && "cursor-default hover:bg-transparent"
                )}
                disabled={isAnswered}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border",
                  selectedChoice === (choice.label || choice.id) && "border-primary",
                  isAnswered && choice.isCorrect && "border-green-500",
                  isAnswered && 
                  previousAnswer === (choice.label || choice.id) && 
                  !choice.isCorrect && "border-red-500"
                )}>
                  {choice.label || String.fromCharCode(65 + question.choices.indexOf(choice))}
                </div>
                <span>{choice.text}</span>
              </button>
            ))}
          </div>

          {!isAnswered && (
            <Button 
              onClick={handleSubmit}
              disabled={!selectedChoice}
            >
              Submit Answer
            </Button>
          )}
        </div>
      )}

      {isAnswered && question.explanation && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="font-medium mb-2">Explanation:</div>
          <div className="text-muted-foreground">{question.explanation}</div>
        </div>
      )}
    </div>
  );
}
