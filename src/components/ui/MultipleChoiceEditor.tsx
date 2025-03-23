import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Card } from './card';
import { MultipleChoice, Choice } from '@/types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultipleChoiceEditorProps {
  question: MultipleChoice;
  onChange: (question: MultipleChoice) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export function MultipleChoiceEditor({ 
  question,
  onChange,
  onDelete,
  disabled = false
}: MultipleChoiceEditorProps) {
  // Deep copy of choices to prevent direct state mutation
  const [localChoices, setLocalChoices] = React.useState<Choice[]>(
    question.choices.map(c => ({...c}))
  );
  const [localQuestion, setLocalQuestion] = React.useState(question.question);
  const [localExplanation, setLocalExplanation] = React.useState(question.explanation || '');

  // Update parent when local state changes
  React.useEffect(() => {
    const updatedQuestion = {
      ...question,
      question: localQuestion,
      choices: localChoices,
      explanation: localExplanation
    };
    onChange(updatedQuestion);
  }, [localQuestion, localChoices, localExplanation]);

  const handleAddChoice = () => {
    const newChoice: Choice = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      isCorrect: false
    };
    setLocalChoices([...localChoices, newChoice]);
  };

  const handleDeleteChoice = (id: string) => {
    setLocalChoices(localChoices.filter(c => c.id !== id));
  };

  const handleChoiceChange = (id: string, changes: Partial<Choice>) => {
    setLocalChoices(localChoices.map(choice =>
      choice.id === id ? { ...choice, ...changes } : choice
    ));
  };

  const handleSelectCorrect = (id: string) => {
    setLocalChoices(localChoices.map(choice => ({
      ...choice,
      isCorrect: choice.id === id
    })));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="question">Question Text</Label>
        <Textarea
          id="question"
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          placeholder="Enter your question..."
          disabled={disabled}
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Answer Choices</Label>
          <Button
            type="button"
            onClick={handleAddChoice}
            disabled={disabled}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Choice
          </Button>
        </div>

        <div className="space-y-2">
          {localChoices.map((choice, index) => (
            <Card
              key={choice.id}
              className={cn(
                'p-4 flex items-start gap-4',
                choice.isCorrect && 'border-primary'
              )}
            >
              <div className="flex items-center gap-2 min-w-[3rem]">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="font-mono text-sm text-muted-foreground">
                  {String.fromCharCode(65 + index)}
                </span>
              </div>

              <div className="flex-1 space-y-2">
                <Input
                  value={choice.text}
                  onChange={(e) => handleChoiceChange(choice.id, { text: e.target.value })}
                  placeholder="Enter answer choice..."
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={choice.isCorrect ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelectCorrect(choice.id)}
                  disabled={disabled}
                >
                  {choice.isCorrect ? 'Correct' : 'Mark Correct'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteChoice(choice.id)}
                  disabled={disabled || localChoices.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation (Optional)</Label>
        <Textarea
          id="explanation"
          value={localExplanation}
          onChange={(e) => setLocalExplanation(e.target.value)}
          placeholder="Explain the correct answer..."
          disabled={disabled}
          rows={2}
        />
      </div>
    </div>
  );
}
